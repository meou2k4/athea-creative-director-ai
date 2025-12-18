<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Athea Creative Director AI

Athea is an AI-powered creative director tool that assists with creative tasks using advanced AI models.

## Demo

View the live demo: https://copy-of-athea-creative-director-ai.vercel.app/

## Run Locally

**Prerequisites:**  Node.js

### 1. Install dependencies:
```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc với các biến sau:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail Configuration (để gửi email thông báo khi có người đăng ký)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Server Port (optional, default: 3001)
PORT=3001
```

**Lưu ý:**
- `GMAIL_APP_PASSWORD`: Tạo mật khẩu ứng dụng 16 ký tự từ Google Account → Security → 2-Step Verification → App passwords
- `GOOGLE_SHEET_ID`: Lấy từ URL Google Sheet: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- `GOOGLE_PRIVATE_KEY`: Copy toàn bộ private key từ Service Account JSON, giữ nguyên format với `\n`

### 3. Tạo Google Sheet

Tạo một Google Sheet với các cột sau (dòng đầu tiên là header):
- `Email` (Text)
- `Password` (Text)
- `Name` (Text)
- `Status` (Text) - Giá trị: `PENDING` hoặc `APPROVED`
- `Date` (Text)

Chia sẻ Sheet với Service Account Email (quyền Editor).

### 4. Chạy ứng dụng

**Cách 1: Chạy cả Server và Client cùng lúc (Khuyến nghị)**
```bash
npm run dev:all
```

**Cách 2: Chạy riêng biệt**

Terminal 1 - Chạy API Server:
```bash
npm run dev:server
```

Terminal 2 - Chạy Vite Dev Server:
```bash
npm run dev
```

Sau đó mở trình duyệt tại: `http://localhost:3000`

### 5. Sử dụng

1. **Đăng ký**: Nhập email, password, tên → Hệ thống sẽ lưu vào Google Sheet với status `PENDING` và gửi email thông báo cho Admin
2. **Duyệt tài khoản**: Vào Google Sheet, đổi `Status` từ `PENDING` thành `APPROVED`
3. **Đăng nhập**: Dùng email/password đã được approve để đăng nhập
