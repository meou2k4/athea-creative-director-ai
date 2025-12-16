import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import nodemailer from 'nodemailer'; // <--- Thêm thư viện này

export default async function handler(req, res) {
  // 1. Chỉ cho phép phương thức POST (Gửi dữ liệu lên)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 2. Kết nối với Google Sheet
    // Xử lý lỗi xuống dòng trong Private Key (Rất quan trọng khi deploy Vercel)
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

    // Tải dữ liệu từ Sheet về
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // Lấy sheet đầu tiên

    const { action, email, password, name } = req.body;

    // === TRƯỜNG HỢP 1: ĐĂNG KÝ (REGISTER) ===
    if (action === 'register') {
      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
      }

      // Lấy toàn bộ dòng để kiểm tra trùng lặp
      const rows = await sheet.getRows();
      const isExist = rows.some((row) => row.get('Email') === email);

      if (isExist) {
        return res.status(400).json({ message: 'Email này đã được đăng ký' });
      }

      // Thêm dòng mới vào Sheet
      await sheet.addRow({
        Email: email,
        Password: password, // Lưu ý: Dự án thật hãy mã hóa password (VD: bcrypt)
        Name: name,
        Status: 'PENDING', // Mặc định chờ duyệt
        Date: new Date().toISOString()
      });

      try {
        // Cấu hình gửi mail (Admin dùng chính Gmail của mình để tự gửi cho mình)
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,        // Email của bạn
            pass: process.env.GMAIL_APP_PASSWORD // Mật khẩu ứng dụng 16 ký tự
          }
        });

        // Nội dung email
        const mailOptions = {
          from: `"ATHEA Bot" <${process.env.GMAIL_USER}>`,
          to: 'Tungdinhvan1606@gmail.com', // Gửi về chính email của bạn để thông báo
          subject: '🔔 ATHEA: Có thành viên mới đăng ký!',
          html: `
            <h3>🚀 Có người dùng mới vừa đăng ký!</h3>
            <p>Thông tin chi tiết:</p>
            <ul>
              <li><strong>Họ tên:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</li>
            </ul>
            <p>Vui lòng vào <a href="https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}">Google Sheet</a> để xét duyệt (đổi PENDING thành APPROVED).</p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("Đã gửi email thông báo cho Admin.");

      } catch (emailError) {
        // Nếu gửi mail lỗi thì chỉ log ra, KHÔNG chặn người dùng đăng ký
        console.error("Lỗi gửi email:", emailError);
      }

      return res.status(200).json({ success: true, message: 'Đăng ký thành công! Vui lòng chờ Admin duyệt.' });
    }

    // === TRƯỜNG HỢP 2: ĐĂNG NHẬP (LOGIN) ===
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
      }

      const rows = await sheet.getRows();
      // Tìm dòng khớp cả Email và Password
      const user = rows.find((row) => row.get('Email') === email && row.get('Password') === password);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
      }

      // QUAN TRỌNG: Kiểm tra cột Status
      const status = user.get('Status');
      if (status !== 'APPROVED') {
        return res.status(403).json({ 
          success: false, 
          message: `Tài khoản đang ở trạng thái: ${status}. Vui lòng liên hệ Admin.` 
        });
      }

      // Đăng nhập thành công
      return res.status(200).json({ 
        success: true, 
        message: 'Đăng nhập thành công',
        user: {
            name: user.get('Name'),
            email: user.get('Email')
        }
      });
    }

    // Nếu action không phải register hay login
    return res.status(400).json({ message: 'Hành động không hợp lệ' });

  } catch (error) {
    console.error('Lỗi API:', error);
    return res.status(500).json({ message: 'Lỗi Server', error: error.message });
  }
}