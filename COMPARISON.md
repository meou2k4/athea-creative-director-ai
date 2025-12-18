# So sánh Code: Downloads vs Workspace Hiện tại

## 📋 Tổng quan

Code trong thư mục **Downloads** là một phiên bản hoàn toàn khác, tập trung vào **UI/UX hiện đại với preset scenes và concept cards**, trong khi code **workspace hiện tại** là một **hệ thống có đăng nhập với shooting plan generation**.

---

## 🔴 THAY ĐỔI LỚN

### 1. **App.tsx** - HOÀN TOÀN KHÁC NHAU

#### Downloads (Mới):
- ✅ **Không có đăng nhập** - truy cập trực tiếp
- ✅ **UI hiện đại** với preset scenes (Floral Atelier, Paris Golden Hour, etc.)
- ✅ **Multi-product upload** (tối đa 4 ảnh sản phẩm)
- ✅ **Concept Cards** với khả năng generate ảnh cho từng pose
- ✅ **Collection tab** để lưu concepts
- ✅ **Scene selection** với 9 preset bối cảnh
- ✅ **Lock lighting** toggle
- ✅ **Model origin** selector (VN/KR/US)
- ✅ Sử dụng `lucide-react` icons

#### Workspace (Hiện tại):
- ✅ **Có hệ thống đăng nhập** (Login component)
- ✅ **Single product upload** (1 ảnh chính + 2 ảnh phụ)
- ✅ **Shooting plan generation** dạng markdown
- ✅ **Pose prompt generation** với JSON output
- ✅ **Image generation** từ JSON prompts
- ✅ **Context & Model style suggestions** tự động
- ✅ Custom SVG icons

---

### 2. **Components** - HOÀN TOÀN KHÁC

#### Downloads có:
- `AnalysisDisplay.tsx` - Hiển thị phân tích thị giác (màu sắc, vibe, chất liệu)
- `ConceptCard.tsx` - Card hiển thị concept với 5 poses, generate ảnh, refine ảnh
- `ImageUploader.tsx` - Component upload ảnh với drag & drop
- `RefineImageModal.tsx` - Modal để refine/chỉnh sửa ảnh đã generate

#### Workspace có:
- `Button.tsx` - Button component với variants
- `Login.tsx` - Form đăng nhập/đăng ký với API integration

---

### 3. **Services/geminiService.ts** - LOGIC KHÁC NHAU

#### Downloads:
```typescript
- analyzeImage() - Trả về FashionAIResponse với structured JSON schema
- generateFashionImage() - Generate ảnh từ pose_prompt JSON
- refineFashionImage() - Refine ảnh đã có với instruction
- Sử dụng Schema validation với Type.OBJECT
- Model: "gemini-3-pro-preview" cho analysis
- Model: "gemini-2.5-flash-image" cho image generation
```

#### Workspace:
```typescript
- generateShootingPlan() - Trả về markdown text
- suggestShootingContexts() - Gợi ý bối cảnh (JSON array)
- suggestModelStyles() - Gợi ý phong cách mẫu (JSON array)
- generatePosePrompt() - Tạo JSON prompt cho pose
- generateImageFromJsonPrompt() - Generate ảnh từ JSON prompt
- executeSmartModel() - Tự động fallback giữa các models
- Model: "gemini-2.5-flash", "gemini-flash-latest", etc.
- Model: "imagen-4.0-generate-001" cho image generation
```

---

### 4. **Types.ts** - ĐỊNH NGHĨA KHÁC

#### Downloads:
```typescript
- VisualAnalysis interface
- Concept interface (với poses, model_consistency, api_prompt_image_generation)
- FashionAIResponse interface
- UserInput interface (productImages: ImageRef[], faceReference, fabricReference)
- LoadingState interface
- ImageRef interface
```

#### Workspace:
```typescript
- User interface
- ImageSize enum
- ShootingPlanState interface (state management cho shooting plan)
- Không có VisualAnalysis, Concept, FashionAIResponse
```

---

### 5. **package.json** - DEPENDENCIES KHÁC

#### Downloads:
```json
{
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@google/genai": "^1.31.0",
    "lucide-react": "^0.556.0"  // ← Có lucide-react
  }
}
```

#### Workspace:
```json
{
  "dependencies": {
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "@google/genai": "^1.31.0",
    "google-auth-library": "^10.5.0",  // ← Có thêm
    "google-spreadsheet": "^5.0.2",     // ← Có thêm
    "nodemailer": "^7.0.11"             // ← Có thêm
  }
}
```

---

### 6. **index.html** - STYLING KHÁC

#### Downloads:
- Tailwind config với `fashion-black`, `fashion-accent` (gold)
- Font: Playfair Display (serif), Inter (sans)
- Background: `bg-gray-50` (light theme)
- Import `lucide-react` trong importmap

#### Workspace:
- Tailwind config với `brand-dark`, `brand-gold`, `brand-gray`
- Font: Playfair Display, Inter
- Background: `bg-brand-dark` (dark theme)
- Không có `lucide-react` trong importmap

---

### 7. **metadata.json** - THÔNG TIN KHÁC

#### Downloads:
```json
{
  "name": "Giám Đốc Sáng Tạo ATHEA",
  "description": "Giám đốc sáng tạo AI cao cấp giúp phân tích sản phẩm thời trang..."
}
```

#### Workspace:
```json
{
  "name": "Copy of ATHEA Creative Director AI",
  "description": "An AI-powered creative director tool that generates professional fashion shooting plans..."
}
```

---

### 8. **README.md** - NỘI DUNG KHÁC

#### Downloads:
- Link: `https://ai.studio/apps/drive/1VQaJ-10rIIx4voMYYd6-orZnJg1ZDH4X`

#### Workspace:
- Link: `https://copy-of-athea-creative-director-ai.vercel.app/`

---

### 9. **.gitignore** - KHÁC BIỆT NHỎ

#### Downloads:
- Không có `.vercel`

#### Workspace:
- Có `.vercel` trong gitignore

---

## 🎯 TÓM TẮT CHÍNH

| Tính năng | Downloads | Workspace |
|----------|-----------|-----------|
| **Đăng nhập** | ❌ Không có | ✅ Có (Login component) |
| **UI Theme** | Light (gray-50) | Dark (brand-dark) |
| **Icons** | lucide-react | Custom SVG |
| **Upload ảnh** | Multi (tối đa 4) | Single + 2 phụ |
| **Output** | Structured JSON (Concepts) | Markdown (Shooting Plan) |
| **Image Gen** | Từ Concept Cards | Từ Pose Prompts |
| **Preset Scenes** | ✅ 9 scenes | ❌ Không có |
| **Collection** | ✅ Lưu concepts | ❌ Không có |
| **Refine Image** | ✅ Có modal | ❌ Không có |
| **Analysis Display** | ✅ Visual analysis | ❌ Không có |

---

## 💡 KẾT LUẬN

**Downloads** là một **phiên bản UI/UX hiện đại hơn** với:
- Giao diện sáng, đẹp hơn
- Nhiều tính năng hơn (preset scenes, collection, refine)
- Structured data output (JSON schema)
- Multi-product support

**Workspace** là một **phiên bản có authentication** với:
- Hệ thống đăng nhập/đăng ký
- Shooting plan dạng markdown
- Smart model fallback
- Context/style suggestions tự động

Hai phiên bản này **KHÔNG TƯƠNG THÍCH** với nhau và cần quyết định merge hoặc chọn một phiên bản để phát triển tiếp.

