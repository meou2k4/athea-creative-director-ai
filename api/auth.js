import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import nodemailer from 'nodemailer';

// --- HÀM TẠO ID NGẪU NHIÊN ---
function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- HÀM TẠO ID DUY NHẤT ---
async function generateUniqueId(sheet) {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const newId = generateRandomId(8);
    const rows = await sheet.getRows();
    const isExist = rows.some(row => row.get('ID') === newId);
    
    if (!isExist) {
      return newId;
    }
    attempts++;
  }
  
  // Nếu sau 10 lần vẫn trùng, tăng độ dài ID
  return generateRandomId(12);
}

// --- HÀM GỬI EMAIL THÔNG BÁO CHO QUẢN LÝ ---
async function sendAdminNotification(name, email, userId) {
  console.log('📧 [Email] Kiểm tra cấu hình ENV...');
  console.log('📧 [Email] GMAIL_USER:', process.env.GMAIL_USER ? 'Đã cấu hình' : 'THIẾU');
  console.log('📧 [Email] GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Đã cấu hình' : 'THIẾU');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("❌ [Email] Bỏ qua gửi email do thiếu cấu hình ENV (GMAIL_USER hoặc GMAIL_APP_PASSWORD)");
    return;
  }

  try {
    console.log('📧 [Email] Đang khởi tạo transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}`;
    const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    const mailOptions = {
      from: `"ATHEA System" <${process.env.GMAIL_USER}>`,
      to: 'Tungdinhvan1606@gmail.com',
      subject: '🔔 ATHEA: Có thành viên mới đăng ký!',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #2c3e50;">🚀 Có người dùng mới đăng ký!</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><b>ID:</b> ${userId}</p>
            <p><b>Họ tên:</b> ${name}</p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Thời gian:</b> ${timestamp}</p>
            <p><b>Trạng thái:</b> <span style="color: #f39c12; font-weight: bold;">PENDING</span></p>
          </div>
          <hr>
          <p style="margin-top: 20px;">
            <a href="${sheetUrl}" 
               style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📋 Mở Google Sheet để duyệt
            </a>
          </p>
        </div>
      `
    };

    console.log('📧 [Email] Đang gửi email đến:', 'Tungdinhvan1606@gmail.com');
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ [Email] Đã gửi thông báo cho quản lý thành công. MessageId:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ [Email] Lỗi gửi mail cho quản lý:", error.message);
    console.error("❌ [Email] Error details:", JSON.stringify(error, null, 2));
    // Throw error để caller có thể xử lý
    throw error;
  }
}

// --- VERCEL SERVERLESS FUNCTION ---
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { action, email, password, name } = req.body;
    console.log(`📥 Request: ${action} | User: ${email}`);

    // 1. Khởi tạo kết nối Google Sheets
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // --- XỬ LÝ ĐĂNG KÝ ---
    if (action === 'register') {
      // Validation: Kiểm tra đầy đủ thông tin
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
      }

      // Validation: Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ. Vui lòng nhập đúng định dạng email.' });
      }
      if (email.length > 100) {
        return res.status(400).json({ message: 'Email không được vượt quá 100 ký tự.' });
      }

      // Validation: Password
      if (password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      }
      if (password.length > 50) {
        return res.status(400).json({ message: 'Mật khẩu không được vượt quá 50 ký tự.' });
      }

      // Validation: Name
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ message: 'Họ tên phải có ít nhất 2 ký tự.' });
      }
      if (trimmedName.length > 50) {
        return res.status(400).json({ message: 'Họ tên không được vượt quá 50 ký tự.' });
      }
      const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
      if (!nameRegex.test(trimmedName)) {
        return res.status(400).json({ message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng.' });
      }

      // Chuẩn hóa email: trim và chuyển thành chữ hoa
      const normalizedEmail = email.trim().toUpperCase();

      // Kiểm tra trùng lặp
      const rows = await sheet.getRows();
      const isExist = rows.some(row => row.get('Email')?.toUpperCase() === normalizedEmail);

      if (isExist) {
        return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống' });
      }

      // Tạo ID ngẫu nhiên duy nhất
      const uniqueId = await generateUniqueId(sheet);
      console.log(`🆔 Đã tạo ID: ${uniqueId}`);

      // Thêm dòng mới với logic xử lý Timeout
      let rowAdded = false;
      try {
        console.log('➕ Đang thêm dòng mới...');
        // Tạo promise addRow với timeout 15s
        const addRowPromise = sheet.addRow({
          ID: uniqueId,
          Email: normalizedEmail,
          Password: password,
          Name: trimmedName,
          Status: 'PENDING',
          CreatedAt: new Date().toISOString()
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_REACHED')), 15000)
        );

        await Promise.race([addRowPromise, timeoutPromise]);
        rowAdded = true;
      } catch (err) {
        if (err.message === 'TIMEOUT_REACHED') {
          console.log('⏰ Timeout! Đang kiểm tra xem dữ liệu đã kịp lưu chưa...');
          // Kiểm tra 10 dòng cuối cùng để xác nhận
          const lastRows = await sheet.getRows({ limit: 10, offset: Math.max(0, sheet.rowCount - 10) });
          rowAdded = lastRows.some(row => row.get('Email')?.toUpperCase() === normalizedEmail);
        } else {
          throw err; // Lỗi khác thì quăng ra ngoài
        }
      }

      if (rowAdded) {
        console.log('✅ Đăng ký thành công');
        
        // Gửi email thông báo cho quản lý (đợi hoàn thành để đảm bảo email được gửi)
        try {
          console.log('📧 [Email] Bắt đầu gửi email thông báo cho quản lý...');
          await sendAdminNotification(trimmedName, email, uniqueId);
          console.log('✅ [Email] Đã gửi email thông báo thành công');
        } catch (emailError) {
          // Log lỗi nhưng không fail toàn bộ request
          console.error('❌ [Email] Lỗi khi gửi email thông báo:', emailError.message);
          console.error('❌ [Email] Stack trace:', emailError.stack);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Đăng ký thành công! Vui lòng chờ Admin duyệt.' 
        });
      } else {
        throw new Error('Không thể ghi dữ liệu vào Sheet.');
      }
    }

    // --- XỬ LÝ ĐĂNG NHẬP ---
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }

      // Chuẩn hóa email: trim và chuyển thành chữ hoa để so sánh
      const normalizedEmail = email.trim().toUpperCase();
      
      const rows = await sheet.getRows();
      const user = rows.find(row => 
        row.get('Email')?.toUpperCase() === normalizedEmail && row.get('Password') === password
      );

      if (!user) {
        return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
      }

      const status = user.get('Status');
      if (status !== 'APPROVED') {
        return res.status(403).json({ 
          success: false, 
          message: `Tài khoản ${status}. Vui lòng liên hệ Admin.` 
        });
      }

      return res.status(200).json({ 
        success: true, 
        user: { name: user.get('Name'), email: user.get('Email') } 
      });
    }

    // Nếu action không phải register hay login
    return res.status(400).json({ message: 'Hành động không hợp lệ' });

  } catch (error) {
    console.error('❌ Server Error:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
    }
  }
}

