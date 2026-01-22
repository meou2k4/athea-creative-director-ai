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
- **Reset Function**: Reset toàn bộ data để bắt đầu concept mới

### 📚 Collection - Quản lý Bộ Sưu Tập
- **Auto-sync với Google Drive**: Tự động lưu và đồng bộ concept lên Google Drive
- **Edit & Update**: Chỉnh sửa concept đã lưu, cập nhật prompt và regenerate ảnh
- **Delete Concept**: Xóa concept và tất cả ảnh liên quan
- **Data Persistence**: Data Studio được giữ nguyên khi chuyển sang Collection tab

### 🔐 Bảo mật & Quản lý
- **User Authentication**: Đăng ký/đăng nhập với Google Sheets
- **Status Management**: Quản lý trạng thái user (PENDING/APPROVED) qua Google Sheet
- **Auto Session Check**: Tự động kiểm tra và xác thực user khi load lại trang
- **Timestamp Tracking**: Tự động cập nhật thời gian đăng nhập và hoạt động (múi giờ Việt Nam)

### 📊 Monitoring & Logging
- **Server-Side Logging System**: Hệ thống log chi tiết chỉ hiển thị ở server (backend)
  - Format: `Tên-Mã-Email_Đang làm gì_bắt đầu thực hiện`
  - Kết quả: `Tên-Mã-Email_Đang làm gì_trạng thái(thành công/thất bại): chi tiết`
  - Theo dõi tất cả thao tác: authentication, tải collection, lưu/xóa concept, tạo ảnh, v.v.
  - Log chỉ hiển thị ở server console (không hiển thị cho người dùng)
  - Frontend chỉ hiển thị lỗi nghiêm trọng (console.error) nếu có

### 🤖 AI Model Selection & Quality Standards
- **Text Generation (Content Creation)**:
  - Model: `gemini-2.5-flash` (001) - Stable version
  - Đặc điểm: Nhanh, 1M input tokens, 65K output tokens, hỗ trợ thinking mode, multimodal

- **Image Generation**:
  - Primary: `gemini-3-pro-image-preview` (Nano Banana Pro) - Preview với chất lượng cao
  - Fallback: `gemini-2.5-flash-image` (Nano Banana) - Stable version
  - Tự động fallback về stable model nếu preview không available
  - Hỗ trợ thinking mode, input capacity cao (131K tokens)

- **Quality Configuration**:
  - Resolution: **2K (1536x2048)** pixels với aspect ratio 3:4
  - Color: Warm-neutral editorial palette, clean whites, realistic skin texture
  - Lighting: Natural daylight only, side lighting 45-degree, soft diffused shadows
  - Material: Premium fabric texture, refined micro-texture, expensive feel
  - Camera: 50mm–85mm equivalent look, professional fashion photography aesthetic

- **Enhanced Retry & Reliability**:
  - Smart retry logic cho quota errors và temporary failures
  - Exponential backoff với jitter để tránh burst limits
  - Comprehensive error detection (404, 429, timeout, internal errors)
  - Improved prompt structure với MASTER PROFILE standards

## 🚀 Demo

Xem demo trực tiếp: https://athea-studio.vercel.app/

## 📋 Yêu cầu hệ thống

- **Node.js** (v20.0.0 trở lên) - **Bắt buộc**
- **Google Account** (để tạo OAuth2 credentials và Google Drive)
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

# Google OAuth2 Credentials (Bắt buộc)
GOOGLE_CLIENT_ID=your_oauth2_client_id
GOOGLE_CLIENT_SECRET=your_oauth2_client_secret
GOOGLE_REFRESH_TOKEN=your_oauth2_refresh_token

# Google Drive Configuration (Bắt buộc)
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_drive_folder_id

# Google Sheets Configuration (Bắt buộc)
GOOGLE_SHEET_ID=your_google_sheet_id

# Gmail Configuration (Tùy chọn - để gửi email thông báo)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password

# Server Port (Tùy chọn, mặc định: 3001)
PORT=3001
```

**Hướng dẫn lấy thông tin:**

- **GEMINI_API_KEY**: Lấy từ [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GOOGLE_OAUTH2_CREDENTIALS**: 
  1. Vào [Google Cloud Console](https://console.cloud.google.com/)
  2. Tạo OAuth 2.0 Client ID
  3. Cấu hình OAuth consent screen
  4. Lấy Client ID, Client Secret
  5. Sử dụng [OAuth Playground](https://developers.google.com/oauthplayground/) để lấy Refresh Token
- **GOOGLE_DRIVE_ROOT_FOLDER_ID**: 
  1. Tạo thư mục trên Google Drive
  2. Lấy ID từ URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
  3. Chia sẻ thư mục với OAuth2 account (quyền Editor)
- **GOOGLE_SHEET_ID**: Lấy từ URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- **GMAIL_APP_PASSWORD**: 
  1. Vào Google Account → Security → 2-Step Verification
  2. Tạo App Password (16 ký tự)

### 4. Tạo Google Sheet

Tạo một Google Sheet với các cột sau (dòng đầu tiên là header):

| ID | Email | Password | Name | Status | CreatedAt | LastLoginAt | LastActiveAt |
|----|-------|----------|------|--------|-----------|-------------|--------------|
| ABC123 | user@example.com | password123 | User Name | APPROVED | 15/01/2024-14:30 | 15/01/2024-15:00 | 15/01/2024-15:00 |

**Lưu ý:**
- `Status` chỉ nhận giá trị: `PENDING` hoặc `APPROVED`
- `CreatedAt`, `LastLoginAt`, `LastActiveAt` sẽ tự động được cập nhật (format: `DD/MM/YYYY-HH:mm`, múi giờ Việt Nam)
- Chia sẻ Sheet với OAuth2 account (quyền Editor)

### 5. Cấu hình Google Drive

1. Tạo một thư mục trên Google Drive để lưu trữ concept
2. Chia sẻ thư mục với OAuth2 account (quyền Editor)
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

## 🌐 Deploy Production

### Kiến trúc Deploy

- **Backend**: Deploy lên **Google Cloud Run** (Node.js server)
- **Frontend**: Deploy lên **Vercel** (React static files)

### Deploy Backend lên Google Cloud Run

1. **Chuẩn bị code:**
   - ✅ Server lắng nghe đúng cổng: `process.env.PORT`
   - ✅ Server bind đúng host: `0.0.0.0`
   - ✅ Có file `package.json` với script `"start": "node server.js"`

2. **Deploy qua Google Cloud Console:**
   - Vào [Google Cloud Console](https://console.cloud.google.com/)
   - Chọn **Cloud Run** → **Create Service**
   - Upload code hoặc connect GitHub repository
   - Cấu hình:
     - **Container port**: `8080` (hoặc port mà Google cấp)
     - **Environment variables**: Thêm tất cả biến môi trường từ `.env`

3. **Lấy Backend URL:**
   - Sau khi deploy thành công, bạn sẽ nhận được URL dạng:
     ```
     https://athea-backend-xxxxx-xx.a.run.app
     ```
   - Lưu lại URL này để cấu hình Frontend

### Deploy Frontend lên Vercel

1. **Cấu hình Environment Variable:**
   - Vào [Vercel Dashboard](https://vercel.com/dashboard)
   - Chọn project → **Settings** → **Environment Variables**
   - Thêm biến:
     - **Name**: `VITE_API_BASE_URL`
     - **Value**: `https://your-cloud-run-backend-url.run.app`
     - **Environment**: Production, Preview, Development

2. **Deploy:**
   - Connect GitHub repository
   - Vercel sẽ tự động build và deploy
   - Hoặc dùng CLI:
     ```bash
     npm install -g vercel
     vercel --prod
     ```

**Lưu ý:**
- Trong **development**: Frontend tự động proxy đến `localhost:3001` (không cần set `VITE_API_BASE_URL`)
- Trong **production**: Frontend sẽ gọi trực tiếp đến Google Cloud Run backend URL
- Biến `VITE_API_BASE_URL` là **BẮT BUỘC** trong production

Xem chi tiết trong file `DEPLOY_INSTRUCTIONS.md`

## 📖 Hướng dẫn sử dụng

### Đăng ký và Đăng nhập

1. **Đăng ký tài khoản mới:**
   - Nhập Email, Password, và Họ tên
   - Hệ thống sẽ lưu vào Google Sheet với status `PENDING`
   - `CreatedAt` sẽ tự động được cập nhật (múi giờ Việt Nam)
   - Admin sẽ nhận email thông báo (nếu đã cấu hình Gmail)

2. **Duyệt tài khoản:**
   - Vào Google Sheet
   - Đổi `Status` từ `PENDING` thành `APPROVED`

3. **Đăng nhập:**
   - Dùng email/password đã được approve
   - `LastLoginAt` và `LastActiveAt` sẽ tự động được cập nhật
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

6. **Reset:**
   - Click nút "Reset" để xóa toàn bộ data và bắt đầu concept mới
   - Data sẽ được giữ nguyên khi chuyển sang tab Collection

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

## 🎨 Quality Standards & Technical Improvements

### MASTER PHOTO PROFILE (Global Standards)
Hệ thống sử dụng bộ tiêu chuẩn chất lượng toàn cầu để đảm bảo tính nhất quán:

- **MASTER LIGHTING PROFILE**: Natural daylight, soft morning/afternoon, side lighting 45-degree
- **MATERIAL PROFILE**: Premium fabric texture, refined micro-texture, warm ivory lace
- **SCENE GUARDRAILS**: Environment complements outfit, neutral palettes, no visual noise
- **CAMERA PROFILE**: 50mm–85mm equivalent look, professional fashion photography aesthetic

### Technical Enhancements (Latest Update)
- **Enhanced Image Configuration**: Explicit `imageSize: "2K"` trong API config cho resolution consistency
- **Smart Retry Logic**: Improved error handling với exponential backoff và jitter
- **Structured Technical Prompts**: JSON-based prompt parsing với MASTER PROFILE standards
- **Quality Assurance**: Comprehensive API response requirements cho ultra-high quality output

### Quality Inspiration & Learning
Hệ thống đã được cải thiện bằng cách học hỏi best practices từ implementation chất lượng cao:
- **Resolution Consistency**: Luôn sử dụng 2K (1536x2048) pixels bất kể source code
- **Color Accuracy**: Warm-neutral palette được duy trì chính xác
- **Detail Quality**: Editorial standards cao cấp không thay đổi
- **Processing Excellence**: Enhanced error handling và prompt structure

## 🎨 Preset Scenes

Hệ thống có 15+ preset scenes được thiết kế sẵn:

- **Đường Phố Châu ÂU** - Concept outfit cao cấp trong bối cảnh kiến trúc châu Âu cổ điển
- **Nữ Doanh Nhân Bên Siêu Xe** - Concept editorial cao cấp dành cho nữ doanh nhân hiện đại
- **Văn Phòng Sang Trọng** - Không gian công sở thanh lịch phong cách classic
- **Luxury Identity Lock** - Hệ thống preset chuẩn cho thời trang xa xỉ
- **Giá Treo Sang Trọng** - Lookbook cao cấp kiểu Outfit được treo trên giá
- **Nữ Doanh Nhân Thành Đạt** - Phong cách lookbook/editorial cao cấp
- **Du Thuyền Sang Trọng** - "quiet luxury" trên du thuyền sang, sạch, nắng đẹp
- **Winter Window Boutique** - Cozy-Chic mùa đông, sang nhẹ, ấm áp
- **Quán Cafe Sang Trọng** - Concept Lifestyle Editorial cao cấp
- **Tiệc Ngoài Trời** - Kiểu tiệc trưa ngoài trời ở biệt thự
- **Cửa Hàng Hoa Trắng** - Romantic-luxury, thanh lịch kiểu atelier
- **City Shopping Stroll** - Editorial tại phố mua sắm cao cấp
- Và nhiều hơn nữa...

## 🔧 Cấu trúc dự án

```
athea-creative-director-ai/
├── components/              # React components
│   ├── Login.tsx           # Màn hình đăng nhập/đăng ký
│   ├── ConceptCard.tsx     # Component hiển thị concept (có logging)
│   ├── ImageUploader.tsx   # Component upload ảnh
│   ├── AnalysisDisplay.tsx
│   ├── Button.tsx
│   └── RefineImageModal.tsx
├── services/               # API services
│   └── geminiService.ts    # Enhanced Gemini AI service (quality-focused with MASTER PROFILE standards)
├── utils/                  # Utility functions
│   └── api.ts             # API URL helper
├── server.js              # Express backend server
├── App.tsx                # Main application component (có logging)
├── types.ts               # TypeScript type definitions
├── package.json
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel configuration
└── tsconfig.json          # TypeScript configuration
```

**Lưu ý:**
- Backend API được deploy trên **Google Cloud Run**
- Frontend được deploy trên **Vercel**
- Trong development: Frontend proxy đến `localhost:3001`
- Trong production: Frontend gọi trực tiếp đến Google Cloud Run backend URL

## 📝 Scripts

- `npm run dev` - Chạy Vite dev server (Frontend)
- `npm run dev:server` - Chạy Express API server (Backend)
- `npm run dev:all` - Chạy cả server và client cùng lúc
- `npm run build` - Build production (Frontend)
- `npm run preview` - Preview production build
- `npm start` - Chạy production server (Backend)

## 🔒 Bảo mật

- User authentication qua Google Sheets
- Status management (PENDING/APPROVED)
- Auto session verification khi load lại trang
- Dữ liệu lưu trữ an toàn trên Google Drive
- Timestamp tracking (múi giờ Việt Nam)
- CORS được cấu hình cho production

## 📊 Monitoring & Debugging

### Console Logging System

Hệ thống có hệ thống logging chi tiết để theo dõi tiến trình hoạt động:

**Format log:**
- Bắt đầu: `Tên-Mã-Email_Đang làm gì_bắt đầu thực hiện`
- Kết quả: `Tên-Mã-Email_Đang làm gì_trạng thái(thành công/thất bại): chi tiết`

**Các thao tác được log:**
- ✅ Kiểm tra authentication khi load trang
- ✅ Đăng nhập/Đăng xuất
- ✅ Tải bộ sưu tập từ Google Drive
- ✅ Lưu/Cập nhật concept
- ✅ Xóa concept
- ✅ Phân tích và thiết kế concept
- ✅ Tạo ảnh pose (đơn lẻ và hàng loạt)
- ✅ Chỉnh sửa ảnh (refine)
- ✅ Tạo lại prompt

**Cách xem log:**
1. Xem log ở server console (terminal/console nơi chạy server)
2. Log được gửi từ frontend lên server qua API endpoint `/api/log`
3. Tất cả log sẽ hiển thị ở server với format: `[LOG] Tên-Mã-Email_Đang làm gì_Trạng thái: chi tiết`
4. Frontend không hiển thị log trong browser console (chỉ hiển thị lỗi nghiêm trọng nếu có)

**Ví dụ log ở server:**
```
[LOG] Nguyen Van A-ABC123-nguyen@email.com_Phân tích và thiết kế concept_bắt đầu thực hiện
[LOG] Nguyen Van A-ABC123-nguyen@email.com_Phân tích và thiết kế concept_trạng thái(thành công): Đã tạo 3 concept với 15 poses
[LOG] Nguyen Van A-ABC123-nguyen@email.com_Tạo ảnh pose 1_bắt đầu thực hiện
[LOG] Nguyen Van A-ABC123-nguyen@email.com_Tạo ảnh pose 1_trạng thái(thành công): Đã tạo ảnh thành công
```

**Lưu ý:**
- Log chỉ dành cho developer/admin, không hiển thị cho người dùng cuối
- Frontend chỉ hiển thị `console.error` cho các lỗi nghiêm trọng ngoài phạm vi quản lý

## 🤖 AI Model Configuration

### Text Generation (Content Creation)
- **Model**: `gemini-2.5-flash` (version 001)
- **Lý do chọn**: 
  - Stable version, đảm bảo ổn định
  - Tốc độ phản hồi nhanh, phù hợp real-time
  - Hỗ trợ 1M input tokens, 65K output tokens
  - Có thinking mode để suy nghĩ sâu hơn
  - Multimodal (text + images), perfect cho phân tích thời trang

### Image Generation
- **Primary Model**: `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Fallback Model**: `gemini-2.5-flash-image` (Nano Banana)
- **Lý do chọn**:
  - Preview model có thinking mode, chất lượng cao hơn
  - Input capacity cao (131K vs 32K tokens)
  - Tự động fallback về stable model nếu preview không available
  - Đảm bảo không bị nghẽn hoặc sập hệ thống

**Quality Configuration:**
- **Resolution**: 2K (1536x2048) pixels với aspect ratio 3:4
- **Image Size**: Explicit `imageSize: "2K"` trong API config
- **Color Standards**: Warm-neutral editorial palette
- **Technical Prompts**: Structured JSON parsing với MASTER PROFILE standards

**Enhanced Reliability:**
- **Smart Retry Logic**: Comprehensive error detection và exponential backoff
- **Error Types**: Handles 404, 429, timeout, internal errors với different strategies
- **Jitter Implementation**: Adds randomization để tránh burst limits
- **Fallback Mechanism**: Seamless transition giữa preview và stable models

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

- Kiểm tra OAuth2 account có quyền Editor trên Drive folder
- Đảm bảo Google Drive API đã được enable trong Google Cloud Console
- Kiểm tra `GOOGLE_REFRESH_TOKEN` có hợp lệ không

### Lỗi authentication

- Kiểm tra Google Sheet có đúng format
- Đảm bảo OAuth2 account có quyền Editor trên Sheet
- Kiểm tra các biến môi trường trong `.env`
- Kiểm tra `GOOGLE_REFRESH_TOKEN` có hợp lệ không

### Lỗi Node.js version

Nếu gặp warning về Node.js version:
- Cài đặt Node.js v20.0.0 trở lên
- Sử dụng `nvm` để quản lý version:
  ```bash
  nvm install 20
  nvm use 20
  ```

### Frontend không kết nối được Backend

- Kiểm tra `VITE_API_BASE_URL` đã set đúng trên Vercel chưa
- Kiểm tra backend có đang chạy không (test endpoint `/api/test`)
- Kiểm tra CORS configuration trong `server.js`

### Lỗi Model không available

- Nếu thấy log "Preview model not available, falling back to stable model":
  - Đây là hành vi bình thường, hệ thống tự động fallback
  - Model preview có thể không available trong một số trường hợp
  - Hệ thống sẽ tự động dùng stable model để đảm bảo hoạt động
- Nếu cả hai model đều fail:
  - Kiểm tra `GEMINI_API_KEY` có hợp lệ không
  - Kiểm tra quota API có còn không
  - Xem log trong console để biết chi tiết lỗi

### Debug với Server Logging

- Xem log ở server console (terminal nơi chạy `npm run dev:server`)
- Tất cả thao tác sẽ được log với format: `[LOG] Tên-Mã-Email_Thao tác_Trạng thái: chi tiết`
- Frontend gửi log lên server qua API endpoint `/api/log` (fire-and-forget)
- Sử dụng log để:
  - Theo dõi tiến trình xử lý của user
  - Debug lỗi khi có vấn đề
  - Kiểm tra performance và timing
  - Xác minh user actions
  - Monitoring và analytics

**Lưu ý:**
- Log không hiển thị trong browser console của người dùng
- Chỉ developer/admin mới thấy log ở server console
- Frontend chỉ hiển thị `console.error` cho lỗi nghiêm trọng ngoài phạm vi quản lý

## 📄 License

MIT License

## 👥 Contributors

- ATHEA Team

---

Made with ❤️ by ATHEA
