# Hướng dẫn nhanh - Sửa lỗi 500

## Vấn đề
Code cũ dùng Vercel serverless function (`api/auth.js`) - chỉ hoạt động khi deploy lên Vercel.
Code mới dùng Express server (`server.js`) - cần chạy local để test.

## Giải pháp

### Bước 1: Đảm bảo có file `.env`
Tạo file `.env` trong thư mục gốc với nội dung:
```env
GEMINI_API_KEY=your_key
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
```

### Bước 2: Chạy server
**Cách 1: Chạy cả 2 cùng lúc (Khuyến nghị)**
```bash
npm run dev:all
```

**Cách 2: Chạy riêng biệt**

Terminal 1:
```bash
npm run dev:server
```

Terminal 2:
```bash
npm run dev
```

### Bước 3: Kiểm tra server đang chạy
Mở trình duyệt: `http://localhost:3001/api/health`

Nếu thấy `{"status":"ok"}` → Server OK ✅

### Bước 4: Test đăng nhập
Mở: `http://localhost:3000`

## Lưu ý quan trọng

1. **Server PHẢI chạy** - Nếu không chạy `npm run dev:server`, sẽ bị lỗi 500
2. **File `.env` PHẢI có** - Thiếu biến môi trường sẽ gây lỗi
3. **Google Sheet PHẢI share** - Share với Service Account Email (quyền Editor)
4. **Tài khoản PHẢI được APPROVED** - Trong Google Sheet, cột `Status` phải là `APPROVED` (không phải `PENDING`)

## Lỗi 401 "Sai email hoặc mật khẩu"

Nếu thấy lỗi 401, kiểm tra:
1. ✅ Email và password có đúng không?
2. ✅ Tài khoản trong Google Sheet có status `APPROVED` chưa?
   - Mở Google Sheet
   - Tìm dòng có email của bạn
   - Kiểm tra cột `Status` - phải là `APPROVED` (không phải `PENDING`)

## Lỗi Browser Extension (Có thể bỏ qua)

Các lỗi `ERR_FILE_NOT_FOUND` cho `utils.js`, `extensionState.js`, `heuristicsRedefinitions.js` là từ **browser extension** (Grammarly), **KHÔNG ảnh hưởng** đến ứng dụng. Có thể bỏ qua hoặc tắt extension.

## Debug nhanh

Chạy script test:
```bash
npm run test:server
```

Script sẽ báo:
- ✅ Biến môi trường nào có/thiếu
- ✅ Server có đang chạy không
- ✅ Kết nối có OK không

