# Hướng dẫn Debug

## Lỗi 500 Internal Server Error

### 0. Chạy Script Test (Nhanh nhất)

```bash
npm run test:server
```

Script này sẽ kiểm tra:
- ✅ Tất cả biến môi trường có đầy đủ không
- ✅ Server có đang chạy không
- ✅ Kết nối đến server có OK không

### 1. Kiểm tra Server có đang chạy

**Terminal 1 - Chạy API Server:**
```bash
npm run dev:server
```

Bạn sẽ thấy:
```
🚀 API Server đang chạy tại http://localhost:3001
✅ Tất cả biến môi trường đã được cấu hình
```

Nếu thấy `⚠️ Thiếu biến môi trường` → Xem bước 2

**Terminal 2 - Chạy Vite Dev Server:**
```bash
npm run dev
```

Hoặc chạy cả 2 cùng lúc:
```bash
npm run dev:all
```

### 2. Kiểm tra file .env

Đảm bảo file `.env` trong thư mục gốc có đầy đủ:

```env
GEMINI_API_KEY=your_key_here
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
```

### 3. Kiểm tra Health Endpoint

Mở trình duyệt: `http://localhost:3001/api/health`

Nếu thấy `{"status":"ok"}` → Server đang chạy tốt

### 4. Kiểm tra Google Sheet

**Quan trọng:**
- Google Sheet phải được **share** với Service Account Email
- Quyền phải là **Editor** (không phải Viewer)
- Sheet phải có các cột: `Email`, `Password`, `Name`, `Status`, `Date`

### 5. Kiểm tra Console Logs

Khi gọi API, server sẽ log:
```
📥 Received auth request: { action: 'login', email: '...' }
```

Nếu có lỗi, sẽ thấy:
```
❌ Lỗi API: [error message]
```

### 6. Các lỗi phổ biến

**"Không thể kết nối đến Google Sheets API"**
- Kiểm tra internet
- Kiểm tra GOOGLE_SHEET_ID đúng chưa

**"Không có quyền truy cập Google Sheet"**
- Share Sheet với Service Account Email
- Đảm bảo quyền là Editor

**"Lỗi xác thực Google Service Account"**
- Kiểm tra GOOGLE_PRIVATE_KEY (phải có `\n` trong quotes)
- Kiểm tra GOOGLE_SERVICE_ACCOUNT_EMAIL đúng chưa

**"Không tìm thấy Google Sheet"**
- Kiểm tra GOOGLE_SHEET_ID trong URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

## Lỗi Browser Extension

Các lỗi `ERR_FILE_NOT_FOUND` cho `utils.js`, `extensionState.js`, `heuristicsRedefinitions.js` là từ **browser extension** (Grammarly hoặc extension khác), **KHÔNG ảnh hưởng** đến ứng dụng. Có thể bỏ qua hoặc tắt extension.

## Lỗi Tailwind CDN Warning

Warning về `cdn.tailwindcss.com` chỉ là cảnh báo, không ảnh hưởng đến ứng dụng. Trong production nên cài Tailwind CSS như PostCSS plugin.

