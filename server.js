import express from 'express';
import cors from 'cors';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { Readable } from 'stream'; // Thêm thư viện xử lý stream ảnh

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Tăng giới hạn lên 50MB để nhận được ảnh từ Frontend
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- 1. CẤU HÌNH OAUTH2 ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

// Nếu có Refresh Token thì set, nếu không thì báo lỗi
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
} else {
  console.error("⚠️ CẢNH BÁO: Thiếu GOOGLE_REFRESH_TOKEN trong .env");
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// --- HÀM HELPER: LƯU BASE64 THÀNH FILE DRIVE ---
async function saveBase64AsFile(base64Str, folderId, fileName) {
  try {
    // Kiểm tra xem có phải base64 hợp lệ không
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return base64Str; // Không phải base64 (có thể là url sẵn), trả về nguyên gốc
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };
    const media = {
      mimeType: mimeType,
      body: stream
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    console.log(`✅ Đã tách ảnh lưu thành file: ${fileName} (${file.data.id})`);
    return `DRIVE_FILE:${file.data.id}`; // Trả về ID đánh dấu
  } catch (error) {
    console.error("Lỗi lưu ảnh:", error.message);
    return null; 
  }
}

// --- HÀM HELPER: TẢI FILE DRIVE VỀ LẠI BASE64 (ĐỂ HIỂN THỊ) ---
async function restoreImageFromDrive(strValue) {
    if (!strValue || typeof strValue !== 'string' || !strValue.startsWith('DRIVE_FILE:')) {
        return strValue;
    }
    
    const fileId = strValue.replace('DRIVE_FILE:', '');
    try {
        // 1. Lấy metadata để biết đuôi ảnh
        const meta = await drive.files.get({ fileId, fields: 'mimeType' });
        const mimeType = meta.data.mimeType;

        // 2. Tải nội dung
        const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
        
        // 3. Chuyển thành base64
        const base64 = Buffer.from(response.data).toString('base64');
        return `data:${mimeType};base64,${base64}`;
    } catch (e) {
        console.error(`Không thể tải ảnh ${fileId}:`, e.message);
        return null; // Ảnh lỗi hoặc đã bị xóa
    }
}

// --- HÀM TÌM FOLDER USER ---
async function getUserFolderId(userId) {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${userId}' and '${rootFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
  });
  if (res.data.files?.length > 0) return res.data.files[0].id;
  
  const file = await drive.files.create({
    resource: { name: userId, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
    fields: 'id',
  });
  return file.data.id;
}

// --- API DRIVE ---
app.post('/api/collection', async (req, res) => {
    try {
        const { action, userId, conceptData, conceptId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu User ID' });
        
        const userFolderId = await getUserFolderId(userId);

        // --- XỬ LÝ LƯU (SAVE) ---
        if (action === 'save') {
            console.log("📥 Đang xử lý lưu Concept...");
            const cleanData = { ...conceptData }; // Copy ra để sửa đổi
            
            // 1. Tách ảnh kết quả (Generated Image)
            if (cleanData.generatedImage) {
                cleanData.generatedImage = await saveBase64AsFile(
                    cleanData.generatedImage, 
                    userFolderId, 
                    `result_${conceptId}.png`
                );
            }

            // 2. Tách ảnh gốc (Product Images)
            if (cleanData.input && cleanData.input.productImages) {
                const newProducts = [];
                let idx = 0;
                for (const img of cleanData.input.productImages) {
                    idx++;
                    if (img.data) {
                        const newId = await saveBase64AsFile(img.data, userFolderId, `input_${conceptId}_${idx}.png`);
                        newProducts.push({ ...img, data: newId }); 
                    } else {
                        newProducts.push(img);
                    }
                }
                cleanData.input.productImages = newProducts;
            }

            // 3. Tách Face Ref & Fabric Ref (Nếu có)
            if (cleanData.input?.faceReference?.data) {
                cleanData.input.faceReference.data = await saveBase64AsFile(cleanData.input.faceReference.data, userFolderId, `face_${conceptId}.png`);
            }
            if (cleanData.input?.fabricReference?.data) {
                cleanData.input.fabricReference.data = await saveBase64AsFile(cleanData.input.fabricReference.data, userFolderId, `fabric_${conceptId}.png`);
            }

            // 4. Lưu file JSON (Lúc này file rất nhẹ, chỉ chứa Text và ID ảnh)
            await drive.files.create({
                resource: { name: `concept_${conceptId || Date.now()}.json`, parents: [userFolderId] },
                media: { mimeType: 'application/json', body: JSON.stringify(cleanData) },
                fields: 'id'
            });
            
            console.log("✅ Lưu thành công!");
            return res.json({ success: true, message: 'Đã lưu' });
        }
        
        // --- XỬ LÝ TẢI (LOAD) ---
        if (action === 'load') {
            const list = await drive.files.list({ 
                q: `'${userFolderId}' in parents and mimeType='application/json' and trashed=false`, 
                fields: 'files(id)' 
            });
            const files = list.data.files || [];
            const concepts = [];

            console.log(`📂 Đang tải ${files.length} concepts...`);

            for (const f of files) {
                try {
                    // 1. Đọc nội dung JSON
                    const content = await drive.files.get({ fileId: f.id, alt: 'media' });
                    let data = content.data;
                    if (typeof data === 'string') { try { data = JSON.parse(data); } catch(e){} }
                    
                    if (typeof data === 'object') {
                        // 2. KHÔI PHỤC ẢNH (Thay ID bằng Base64 thật để Frontend hiển thị được)
                        // - Khôi phục ảnh kết quả
                        if (data.generatedImage) data.generatedImage = await restoreImageFromDrive(data.generatedImage);
                        
                        // - Khôi phục ảnh gốc
                        if (data.input?.productImages) {
                            for (const img of data.input.productImages) {
                                if (img.data) img.data = await restoreImageFromDrive(img.data);
                            }
                        }
                        // - Khôi phục ref
                        if (data.input?.faceReference?.data) data.input.faceReference.data = await restoreImageFromDrive(data.input.faceReference.data);
                        if (data.input?.fabricReference?.data) data.input.fabricReference.data = await restoreImageFromDrive(data.input.fabricReference.data);

                        concepts.push(data);
                    }
                } catch(e) { console.error("Lỗi đọc file concept:", f.id); }
            }
            return res.json({ success: true, concepts: concepts.reverse() });
        }
    } catch (error) {
        console.error('Drive Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Với Sheets, ta cần Access Token từ OAuth client để đăng nhập
const getSheetDoc = async () => {
  const accessToken = (await oauth2Client.getAccessToken()).token;
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, { token: accessToken }); // Dùng token thay vì JWT
  return doc;
};

// --- API DRIVE ---
app.post('/api/collection', async (req, res) => {
    try {
        const { action, userId, conceptData, conceptId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu User ID' });
        
        const userFolderId = await getUserFolderId(userId);

        if (action === 'save') {
            await drive.files.create({
                resource: { name: `concept_${conceptId || Date.now()}.json`, parents: [userFolderId] },
                media: { mimeType: 'application/json', body: JSON.stringify(conceptData) },
                fields: 'id'
            });
            return res.json({ success: true, message: 'Đã lưu' });
        }
        
        if (action === 'load') {
            const list = await drive.files.list({ 
                q: `'${userFolderId}' in parents and mimeType='application/json' and trashed=false`, 
                fields: 'files(id)' 
            });
            const files = list.data.files || [];
            const concepts = [];

            for (const f of files) {
                try {
                    const content = await drive.files.get({ fileId: f.id, alt: 'media' });
                    let data = content.data;
                    if (typeof data === 'string') {
                         try { data = JSON.parse(data); } catch(e) {}
                    }
                    if (typeof data === 'object') concepts.push(data);
                } catch(e) { console.error("Lỗi đọc file:", e.message); }
            }
            return res.json({ success: true, concepts: concepts.reverse() });
        }
    } catch (error) {
        console.error('Drive Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- HÀM GỬI EMAIL THÔNG BÁO (CHẠY NGẦM) ---
async function sendAdminNotification(name, email) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log("⚠️ Bỏ qua gửi email do thiếu cấu hình ENV");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"ATHEA System" <${process.env.GMAIL_USER}>`,
      to: 'Tungdinhvan1606@gmail.com',
      subject: '🔔 ATHEA: Có thành viên mới đăng ký!',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h3 style="color: #2c3e50;">🚀 Có người dùng mới đăng ký!</h3>
          <p><b>Họ tên:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Thời gian:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          <hr>
          <p>Vui lòng duyệt tại: <a href="https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}">Google Sheet Link</a></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Email] Đã gửi thông báo Admin:", info.messageId);
  } catch (error) {
    console.error("❌ [Email] Lỗi gửi mail:", error.message);
  }
}

// --- API AUTH (SHEETS) ---
app.post('/api/auth', async (req, res) => {
    try {
        const { action, email, password, name, id } = req.body;
        
        // Kết nối Sheet bằng OAuth token
        const doc = await getSheetDoc();
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        if (action === 'verify') {
             const rows = await sheet.getRows();
             const user = rows.find(r => r.get('ID') === id);
             if (user && user.get('Status') === 'APPROVED') {
                 return res.json({ success: true, user: { name: user.get('Name'), email: user.get('Email'), id: user.get('ID') } });
             }
             return res.status(401).json({ success: false });
        }

        if (action === 'register') {
             const normEmail = email.trim().toUpperCase();
             const rows = await sheet.getRows();
             if (rows.some(r => r.get('Email')?.toUpperCase() === normEmail)) return res.status(400).json({ message: 'Email đã tồn tại' });
             
             const newId = Math.random().toString(36).substr(2, 9).toUpperCase();
             await sheet.addRow({ ID: newId, Email: normEmail, Password: password, Name: name, Status: 'PENDING', CreatedAt: new Date().toISOString() });
             sendAdminNotification(name, email);
             return res.json({ success: true, message: 'Đăng ký thành công! Chờ duyệt.' });
        }

        if (action === 'login') {
             const normEmail = email?.trim().toUpperCase();
             const rows = await sheet.getRows();
             const user = rows.find(r => r.get('Email')?.toUpperCase() === normEmail && r.get('Password') === password);
             
             if (!user) return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
             if (user.get('Status') !== 'APPROVED') return res.status(403).json({ success: false, message: 'Chưa được duyệt' });
             
             return res.json({ success: true, user: { id: user.get('ID'), name: user.get('Name'), email: user.get('Email') } });
        }
    } catch (error) {
        console.error('Auth Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server ready on port ${PORT}`));