<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ATHEA Creative Director AI

ATHEA là công cụ AI Giám Đốc Sáng Tạo chuyên nghiệp, hỗ trợ tạo concept thời trang với Multi-Angle Identity Lock, tự động lưu trữ trên Google Drive và quản lý bộ sưu tập concept.

## ✨ Tính năng chính

### 🎨 Studio - Tạo Concept Thời Trang
- **Multi-Angle Product Analysis**: Tải lên tối đa 4 ảnh sản phẩm từ nhiều góc độ để AI phân tích chi tiết
- **Face Reference Lock**: Khóa gương mặt người mẫu để giữ tính nhất quán
- **Fabric Reference**: Tham chiếu chất liệu sản phẩm
- **15+ Preset Scenes**: Chọn từ các bối cảnh được thiết kế sẵn (Winter Boutique, Paris Golden Hour, Yacht Resort, v.v.)
- **Custom Description**: Mô tả chi tiết yêu cầu bổ sung
- **Model Origin**: Chọn quốc tịch người mẫu (VN, KR, US)
- **Lighting Lock**: Khóa ánh sáng để đồng bộ tone màu

### 📚 Collection - Quản lý Bộ Sưu Tập
- **Auto-sync với Google Drive**: Tự động lưu và đồng bộ concept lên Google Drive
- **Edit & Update**: Chỉnh sửa concept đã lưu, cập nhật prompt và regenerate ảnh
- **Delete Concept**: Xóa concept và tất cả ảnh liên quan
- **Unsaved Changes Warning**: Cảnh báo khi có dữ liệu chưa lưu trước khi chuyển trang

### 🔐 Bảo mật & Quản lý
- **User Authentication**: Đăng ký/đăng nhập với Google Sheets
- **Status Management**: Quản lý trạng thái user (PENDING/APPROVED) qua Google Sheet
- **Auto Session Check**: Tự động kiểm tra và xác thực user khi load lại trang
- **Data Protection**: Cảnh báo dữ liệu chưa lưu khi chuyển tab hoặc đóng trang

## 🚀 Demo

Xem demo trực tiếp: https://copy-of-athea-creative-director-ai.vercel.app/

## 📋 Yêu cầu hệ thống

- **Node.js** (v18 trở lên)
- **Google Account** (để tạo Service Account và Google Drive)
- **Gemini API Key** (từ Google AI Studio)

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/your-username/athea-creative-director-ai.git
cd athea-creative-director-ai
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục gốc:

```env
# Gemini API Key (Bắt buộc)
GEMINI_API_KEY=your_gemini_api_key_here

# Gmail Configuration (Để gửi email thông báo khi có người đăng ký)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Google Sheets Configuration (Bắt buộc)
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Google Drive Configuration (Bắt buộc - dùng cùng Service Account)
# Service Account cần có quyền truy cập Google Drive

# Server Port (Tùy chọn, mặc định: 3001)
PORT=3001
```

**Hướng dẫn lấy thông tin:**

- **GEMINI_API_KEY**: Lấy từ [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GMAIL_APP_PASSWORD**: 
  1. Vào Google Account → Security → 2-Step Verification
  2. Tạo App Password (16 ký tự)
- **GOOGLE_SHEET_ID**: Lấy từ URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- **GOOGLE_SERVICE_ACCOUNT**: 
  1. Tạo Service Account tại [Google Cloud Console](https://console.cloud.google.com/)
  2. Tải JSON key file
  3. Copy `client_email` và `private_key` vào `.env`
  4. Chia sẻ Google Sheet và Google Drive với Service Account email (quyền Editor)

### 4. Tạo Google Sheet

Tạo một Google Sheet với các cột sau (dòng đầu tiên là header):

| Email | Password | Name | Status | CreatedAt |
|-------|----------|------|--------|-----------|
| user@example.com | password123 | User Name | APPROVED | 2024-01-01 |

**Lưu ý:**
- `Status` chỉ nhận giá trị: `PENDING` hoặc `APPROVED`
- Chia sẻ Sheet với Service Account Email (quyền Editor)

### 5. Cấu hình Google Drive

1. Tạo một thư mục trên Google Drive để lưu trữ concept
2. Chia sẻ thư mục với Service Account email (quyền Editor)
3. Hệ thống sẽ tự động tạo thư mục cho từng user khi họ lưu concept đầu tiên

## 🚀 Chạy ứng dụng

### Cách 1: Chạy cả Server và Client cùng lúc (Khuyến nghị)

```bash
npm run dev:all
```

### Cách 2: Chạy riêng biệt

**Terminal 1 - Chạy API Server:**
```bash
npm run dev:server
```

**Terminal 2 - Chạy Vite Dev Server:**
```bash
npm run dev
```

Sau đó mở trình duyệt tại: `http://localhost:3000`

## 📖 Hướng dẫn sử dụng

### Đăng ký và Đăng nhập

1. **Đăng ký tài khoản mới:**
   - Nhập Email, Password, và Họ tên
   - Hệ thống sẽ lưu vào Google Sheet với status `PENDING`
   - Admin sẽ nhận email thông báo

2. **Duyệt tài khoản:**
   - Vào Google Sheet
   - Đổi `Status` từ `PENDING` thành `APPROVED`

3. **Đăng nhập:**
   - Dùng email/password đã được approve
   - Hệ thống tự động kiểm tra status khi load lại trang

### Sử dụng Studio

1. **Tải ảnh sản phẩm:**
   - Tải lên tối đa 4 ảnh sản phẩm từ nhiều góc độ
   - Ảnh sẽ được AI phân tích để tạo concept

2. **Thiết lập tham chiếu:**
   - **Face Reference**: Tải ảnh gương mặt người mẫu (tùy chọn)
   - **Fabric Reference**: Tải ảnh chất liệu sản phẩm (tùy chọn)

3. **Chọn bối cảnh:**
   - Chọn từ 15+ preset scenes có sẵn
   - Hoặc mô tả custom trong "Yêu cầu bổ sung"

4. **Cấu hình:**
   - Chọn quốc tịch người mẫu (VN, KR, US)
   - Bật/tắt "Khóa ánh sáng" để đồng bộ tone màu

5. **Tạo Concept:**
   - Click "Chuyển bối cảnh"
   - AI sẽ tạo 3 concepts, mỗi concept có 5 poses
   - Mỗi pose có thể generate ảnh, refine, hoặc regenerate prompt

### Quản lý Collection

1. **Lưu Concept:**
   - Click nút "Lưu" trên concept card
   - Concept sẽ được lưu vào Google Drive
   - Có thể cập nhật concept đã lưu

2. **Chỉnh sửa Concept:**
   - Vào tab "Bộ sưu tập"
   - Click vào concept để chỉnh sửa
   - Thay đổi prompt, regenerate ảnh, hoặc cập nhật lock states
   - Hệ thống sẽ cảnh báo nếu có thay đổi chưa lưu

3. **Xóa Concept:**
   - Click nút "Xóa" trên concept card
   - Xác nhận xóa
   - Concept và tất cả ảnh liên quan sẽ bị xóa khỏi Google Drive

### Cảnh báo Dữ liệu chưa lưu

- Hệ thống tự động phát hiện dữ liệu chưa lưu ở cả **Studio** và **Collection**
- Khi chuyển tab hoặc đóng trang, sẽ có cảnh báo nếu có dữ liệu chưa lưu
- Có thể chọn "Bỏ qua và tiếp tục" hoặc quay lại để lưu

## 🎨 Preset Scenes

Hệ thống có 15+ preset scenes được thiết kế sẵn:

- **Winter Window Boutique Chic** - Boutique mùa đông ấm áp
- **Holiday Boutique Chic** - Street-style mùa lễ hội
- **Floral Atelier** - Romantic-luxury với hoa
- **Yacht Daylight Resort** - Du thuyền sang trọng
- **Paris Golden Hour Executive** - Paris hoàng hôn
- **Urban Café Executive** - Café phố Tây
- **Garden Estate Luncheon** - Tiệc vườn sang trọng
- **Luxury Executive Office** - Văn phòng cao cấp
- **City Shopping Stroll** - Phố mua sắm
- Và nhiều hơn nữa...

## 🔧 Cấu trúc dự án

```
athea-creative-director-ai/
├── components/          # React components
│   ├── Login.tsx       # Màn hình đăng nhập/đăng ký
│   ├── ConceptCard.tsx # Component hiển thị concept
│   └── ...
├── services/            # API services
│   └── geminiService.ts # Gemini AI service
├── api/                 # API routes (Vercel serverless)
│   └── auth.js         # Authentication API
├── server.js            # Express server (local dev)
├── App.tsx              # Main application component
└── package.json
```

## 📝 Scripts

- `npm run dev` - Chạy Vite dev server
- `npm run dev:server` - Chạy Express API server
- `npm run dev:all` - Chạy cả server và client
- `npm run build` - Build production
- `npm run preview` - Preview production build

## 🔒 Bảo mật

- User authentication qua Google Sheets
- Status management (PENDING/APPROVED)
- Auto session verification khi load lại trang
- Dữ liệu lưu trữ an toàn trên Google Drive
- Cảnh báo dữ liệu chưa lưu

## 🐛 Troubleshooting

### Port đã được sử dụng

Nếu gặp lỗi `EADDRINUSE: address already in use :::3001`:

**Windows:**
```bash
netstat -ano | findstr :3001
taskkill /F /PID <PID>
```

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

### Lỗi kết nối Google Drive

- Kiểm tra Service Account có quyền Editor trên Drive folder
- Đảm bảo Google Drive API đã được enable trong Google Cloud Console

### Lỗi authentication

- Kiểm tra Google Sheet có đúng format
- Đảm bảo Service Account có quyền Editor trên Sheet
- Kiểm tra các biến môi trường trong `.env`

## 📄 License

MIT License

## 👥 Contributors

- ATHEA Team

---

Made with ❤️ by ATHEA
