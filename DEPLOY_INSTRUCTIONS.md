# 🚀 Hướng dẫn kết nối Frontend (Vercel) với Backend (Google Cloud Run)

## ✅ Backend đã deploy thành công!

**Backend URL:** `https://your-backend-service-xxxxx.run.app`

> ⚠️ **Lưu ý bảo mật**: Thay thế URL thực tế bằng URL của bạn. Không commit URL thực tế vào Git.

---

## 📝 Bước tiếp theo: Cấu hình Frontend trên Vercel

### Set Environment Variable trên Vercel (Bắt buộc)

1. Vào project trên [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn **Settings** → **Environment Variables**
3. Thêm biến mới:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-service-xxxxx.run.app` (thay bằng URL thực tế của bạn)
   - **Environment**: Production, Preview, Development (chọn tất cả)
4. Click **Save**
5. **Redeploy** project để áp dụng thay đổi

> ⚠️ **Lưu ý**: Biến `VITE_API_BASE_URL` là **BẮT BUỘC** trong production. Nếu không set, frontend sẽ báo lỗi.

### Cách 2: Tạo file `.env.production` (Local testing)

Tạo file `.env.production` trong thư mục gốc (không commit vào Git):

```env
VITE_API_BASE_URL=https://your-backend-service-xxxxx.run.app
```

Sau đó build và test:
```bash
npm run build
npm run preview
```

---

## 🧪 Kiểm tra kết nối

### 1. Test Backend trực tiếp
Mở browser và truy cập:
```
https://your-backend-service-xxxxx.run.app/api/test
```

Kết quả mong đợi:
```json
{
  "message": "Server is running!",
  "timestamp": "2024-..."
}
```

### 2. Test từ Frontend
1. Mở website frontend (Vercel)
2. Mở **Developer Tools** (F12) → **Network** tab
3. Thử đăng nhập hoặc thực hiện action bất kỳ
4. Kiểm tra các API calls có gọi đúng URL backend không:
   - ✅ Đúng: `https://your-backend-service-xxxxx.run.app/api/...`
   - ❌ Sai: Nếu thấy lỗi "Backend API URL is not configured" → chưa set `VITE_API_BASE_URL`

---

## 🔍 Troubleshooting

### Lỗi CORS
Nếu gặp lỗi CORS, kiểm tra:
- ✅ Backend đã cho phép domain frontend (đã cấu hình trong `server.js`)
- ✅ Frontend đang gọi đúng backend URL

### API không kết nối được
1. Kiểm tra `VITE_API_BASE_URL` đã set đúng chưa
2. Kiểm tra backend có đang chạy không (test endpoint `/api/test`)
3. Kiểm tra Network tab trong browser để xem lỗi cụ thể

### Backend trả về 404
- Kiểm tra URL có đúng format không: `https://...run.app/api/endpoint`
- Đảm bảo không có dấu `/` thừa ở cuối URL

---

## ✅ Checklist

- [ ] Backend đã deploy và test thành công (`/api/test`)
- [ ] Đã set `VITE_API_BASE_URL` trên Vercel/Netlify
- [ ] Đã redeploy frontend
- [ ] Test đăng nhập/đăng ký từ frontend
- [ ] Kiểm tra Network tab - API calls đúng URL

---

## 📞 Thông tin Backend

- **URL Format**: `https://your-service-name-xxxxx-xx.run.app`
- **Test endpoint**: `/api/test`

> 💡 **Tip**: Lưu URL backend thực tế vào file `.env.production` (local) hoặc Vercel Environment Variables (production). Không commit URL thực tế vào Git.

