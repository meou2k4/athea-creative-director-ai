import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "../types";

// --- [CONFIG] CẤU HÌNH MODEL THEO DANH SÁCH CỦA BẠN ---

// 1. Danh sách model Text để thử lần lượt (Ưu tiên bản 2.5 Flash Stable)
const TEXT_MODELS = [
  'gemini-2.5-flash',              // Stable – ưu tiên số 1
  'gemini-flash-latest',           // Alias auto-upgrade
  'gemini-2.5-flash-lite',         // Nhẹ – nhưng vẫn 2.5
  'gemini-2.0-flash-001'           // Fallback cuối
];


// 2. Model tạo ảnh (Dùng Imagen 4.0 từ danh sách của bạn)
const IMAGE_MODEL = 'imagen-4.0-generate-001';

const SYSTEM_INSTRUCTION_TEXT = `VAI TRÒ (ROLE):
Bạn là 'Giám đốc Sáng tạo tại ATHEA', chuyên gia hàng đầu về nhiếp ảnh thương mại, thời trang và xây dựng thương hiệu. Nhiệm vụ của bạn là phân tích hình ảnh sản phẩm được tải lên và các tham số đầu vào (Bối cảnh, Người mẫu) để tạo ra một bản kế hoạch chụp ảnh (Shooting Plan) chi tiết.

QUY TRÌNH XỬ LÝ:
1. Phân tích hình ảnh: Nhận diện loại trang phục, chất liệu, màu sắc và cảm xúc mà sản phẩm mang lại. Nếu có ảnh cận chất liệu, hãy phân tích kỹ cấu trúc vải. Nếu có ảnh gương mặt mẫu, hãy đề xuất phong cách trang điểm (makeup) và thần thái phù hợp với gương mặt đó.
2. Kết hợp tham số: Dựa vào 'Bối cảnh' (ví dụ: Tiệc cưới) và 'Phong cách người mẫu' (ví dụ: Người Việt Nam) mà người dùng cung cấp.
3. Định hình phong cách: Chọn 2 tính từ mô tả chính xác nhất phong cách sẽ thực hiện (ví dụ: Thanh lịch & Hiện đại).

ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT):
Bắt buộc sử dụng Markdown, trình bày chuyên nghiệp, giọng văn hào hứng, sang trọng.

CẤU TRÚC PHẢN HỒI:

[PHẦN 1: LỜI CHÀO & ĐỊNH HƯỚNG]
- Lời chào: 'Chào bạn! Dựa trên phân tích sản phẩm và bối cảnh [Bối cảnh nhập vào]...'
- Xác nhận phong cách: 'Tôi đã quyết định chọn phong cách chụp ảnh là [Tính từ 1] và [Tính từ 2] để làm nổi bật sự [Đặc điểm sản phẩm]...'

[PHẦN 2: 3 CONCEPT CHIẾN LƯỢC]
Hãy đề xuất 3 Concept khác nhau. Mỗi Concept phải tuân thủ cấu trúc sau:

Concept [X]: [Tên Concept Tiếng Việt] ([Tên Concept Tiếng Anh])
* Mục tiêu Bán hàng: Giải thích ngắn gọn tại sao concept này thu hút khách hàng.
* Bối cảnh: Mô tả chi tiết không gian, ánh sáng, đạo cụ.
* Chi tiết thực hiện (Bộ 5 Poses):
  - Pose 1 - Toàn thân [Tên pose] ([English Name]): Mô tả dáng đứng, tay, chân, thần thái.
  - Pose 2 - Trung cảnh [Tên pose] ([English Name]): Tập trung vào chi tiết thân trên/áo, hướng mặt.
  - Pose 3 - Cận cảnh [Tên pose] ([English Name]): Biểu cảm gương mặt, chi tiết cổ/vai hoặc trang sức.
  - Pose 4 - Khoảnh khắc ngồi/Tự nhiên [Tên pose] ([English Name]): Dáng ngồi hoặc tương tác với đạo cụ.
  - Pose 5 - Chuyển động/Nghệ thuật [Tên pose] ([English Name]): Dáng bước đi hoặc góc chụp nghệ thuật, tạo hiệu ứng thị giác.

LƯU Ý QUAN TRỌNG:
- Ngôn ngữ: Tiếng Việt (kèm chú thích tiếng Anh cho thuật ngữ chuyên môn).
- Luôn tạo ra đúng 5 Poses cho mỗi Concept.
- Tập trung vào việc làm nổi bật sản phẩm trong ảnh.`;

const POSE_PROMPT_EXAMPLE = `{
  "scene": {
    "description": "A photorealistic close-up shot focusing on the intricate details of the black high-collar midi dress with sheer mesh sleeves and yoke, worn by either the model or the mannequin, inside an elegant winter boutique. The warm yellow light from an interior lamp delicately highlights the fabric's texture, while the blurred background shows faint, cold white snowflakes falling outside a large window.",
    "environment": "An elegant boutique interior with warm oak wood flooring. The space is filled with a mix of cool natural light and warm yellow artificial light from a floor lamp. Outside, heavy snow falls on bare tree branches.",
    "mood": "Detail-oriented, sophisticated, and inviting, emphasizing the quality and warmth of the garment.",
    "aesthetic": {
      "style": "Photorealistic, clean, high-fashion editorial, ultra-high resolution, 4K",
      "look": "Warm interior light focused on the product, with a slightly cooler, blurred background. Soft contrast and rich, true-to-life colors. Minimal grain."
    }
  },
  "lighting": {
    "description": "A focused warm yellow light from an interior lamp dramatically highlights the product's texture and details. A soft, diffused cool light from the window subtly illuminates the blurred background."
  },
  "subject_model": {
    "description": "A captivating young adult Korean model with a slender build, embodying a relaxed and serene style. Her presence is implied if the product is on her.",
    "demographics": {
      "ethnicity": "Korean",
      "age": "Young adult",
      "build": "Slender"
    },
    "appearance": {
      "hair": "Not visible.",
      "skin": "Not visible or minimal."
    },
    "pose": {
      "type": "Close-up on garment detail",
      "action": "Focuses purely on the intricate details of the dress, specifically the sheer mesh sleeves and the high collar with the keyhole cutout. The model's form provides a natural drape.",
      "framing": "Close-up shot, focusing from chest to upper arm/shoulder."
    }
  },
  "subject_mannequin": {
    "style": "A sleek, matte white headless mannequin.",
    "pose": "Standing still, perfectly posed to display the garment's structure. (Alternative to model for this shot if preferred for product focus)."
  },
  "wardrobe_and_accessories": {
    "shared_product": "The exact black high-collar midi dress with sheer mesh long sleeves, a sheer mesh yoke, and a keyhole cutout at the front collar, as depicted in the provided product image. The dress has a solid black bodice and an A-line skirt."
  },
  "camera_technical": {
    "requirements": [
      "The product worn by the model and the mannequin MUST be identical to the one in the provided product image.",
      "Maintain the original, true-to-life color palette of the product on both the model and the mannequin.",
      "The scene environment and lighting must be 100% identical for all shots within the same concept."
    ],
    "capture": "Shot on DSLR with 100mm macro f/2.8 lens for detail, ISO-200, WB 4500K",
    "composition": "A tight close-up on the intricate fabric details (mesh, collar, bodice), with a soft bokeh background showing the blurred snowy scene, emphasizing texture and light interaction.",
    "retouching": "Clean minor blemishes only; preserve fabric micro-wrinkles and skin texture.",
    "avoid": [
      "Warped doors or lines",
      "Heavy vignettes",
      "Oversharpening",
      "Unrealistic, doll-like mannequins"
    ]
  }
}`;

// --- HELPER FUNCTIONS ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ensureApiKeySelected = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      try {
        await window.aistudio.openSelectKey();
        return true; 
      } catch (e) {
        console.error("Failed to open key selector", e);
        return false;
      }
    }
    return true;
  }
  return true; 
};

const getMimeType = (base64String: string) => {
  if (base64String.startsWith('data:image/png')) return 'image/png';
  if (base64String.startsWith('data:image/jpeg')) return 'image/jpeg';
  if (base64String.startsWith('data:image/webp')) return 'image/webp';
  return 'image/jpeg';
};

const stripBase64Prefix = (base64String: string) => {
  return base64String.replace(/^data:image\/[a-z]+;base64,/, "");
};

// 
// --- CƠ CHẾ GỌI API THÔNG MINH (Smart Execute) ---
// Tự động thử lần lượt các model trong danh sách nếu gặp lỗi
const executeSmartModel = async <T>(
    apiCall: (modelName: string) => Promise<T>
): Promise<T> => {
    let lastError: any;

    for (const model of TEXT_MODELS) {
        try {
            return await apiCall(model);
        } catch (error: any) {
            lastError = error;
            const msg = error.message || JSON.stringify(error);
            
            // Xử lý lỗi Rate Limit (429) hoặc Server Busy (503)
            if (msg.includes("429") || msg.includes("503") || msg.includes("overloaded")) {
                console.warn(`⚠️ Model ${model} bị quá tải. Đang thử model tiếp theo...`);
                await delay(2000); // Chờ 2s trước khi chuyển model
                continue; 
            }

            // Xử lý lỗi 404 (Không tìm thấy model)
            if (msg.includes("404") || msg.includes("NOT_FOUND")) {
                console.warn(`⚠️ Model ${model} không khả dụng (404). Đang thử model tiếp theo...`);
                continue;
            }

            // Xử lý lỗi 403 (Quyền truy cập) - Lỗi này đổi model không sửa được
            if (msg.includes("403") || msg.includes("PERMISSION_DENIED")) {
                throw new Error("Lỗi quyền truy cập API Key. Vui lòng kiểm tra lại Key.");
            }

            console.warn(`⚠️ Model ${model} gặp lỗi: ${msg}. Đang thử model khác...`);
        }
    }

    console.error("❌ Tất cả các model đều thất bại.", lastError);
    throw new Error("Hệ thống đang bận. Vui lòng thử lại sau ít phút.");
};

// --- CÁC HÀM API ---

export const suggestShootingContexts = async (imageBase64: string): Promise<string[]> => {
  return executeSmartModel(async (modelName) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const imagePart = {
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: stripBase64Prefix(imageBase64),
      },
    };

    const prompt = `Bạn là Giám đốc Sáng tạo. Hãy phân tích hình ảnh sản phẩm này và đề xuất 5 bối cảnh chụp ảnh (Shooting Context) cụ thể, sáng tạo và phù hợp nhất để làm nổi bật sản phẩm.
    Trả về kết quả TUYỆT ĐỐI chỉ là một JSON Array chứa các chuỗi string Tiếng Việt.
    Ví dụ: ["Studio phông nền màu be", "Đường phố Paris ngày nắng"]`;

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: { parts: [imagePart, { text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    if (response.text) return JSON.parse(response.text) as string[];
    return [];
  });
};

export const suggestModelStyles = async (imageBase64: string): Promise<string[]> => {
  return executeSmartModel(async (modelName) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const imagePart = {
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: stripBase64Prefix(imageBase64),
      },
    };

    const prompt = `Bạn là Giám đốc Sáng tạo. Hãy phân tích hình ảnh sản phẩm thời trang này và đề xuất 5 phong cách người mẫu (Model Style) phù hợp.
    Trả về kết quả TUYỆT ĐỐI chỉ là một JSON Array chứa các chuỗi string Tiếng Việt.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, { text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    if (response.text) return JSON.parse(response.text) as string[];
    return [];
  });
};

export const generateShootingPlan = async (
  imageBase64: string,
  context: string,
  modelStyle: string,
  closeupImageBase64?: string | null,
  faceImageBase64?: string | null
): Promise<string> => {
  return executeSmartModel(async (modelName) => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    const parts: any[] = [];
    
    parts.push({
      inlineData: {
        mimeType: getMimeType(imageBase64),
        data: stripBase64Prefix(imageBase64),
      },
    });
    parts.push({ text: "Đây là ảnh sản phẩm chính." });

    if (closeupImageBase64) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(closeupImageBase64),
          data: stripBase64Prefix(closeupImageBase64),
        },
      });
      parts.push({ text: "Đây là ảnh cận cảnh chất liệu vải." });
    }

    if (faceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: getMimeType(faceImageBase64),
          data: stripBase64Prefix(faceImageBase64),
        },
      });
      parts.push({ text: "Đây là ảnh gương mặt người mẫu tham khảo." });
    }

    const promptText = `Hãy phân tích các hình ảnh được cung cấp và lập kế hoạch chụp ảnh với:\nBối cảnh: ${context}\nNgười mẫu: ${modelStyle}`;
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_TEXT,
        temperature: 1.0,
      },
    });

    return response.text || "Không thể tạo kế hoạch.";
  });
};

export const generatePosePrompt = async (
    imageBase64: string,
    concept: string,
    poseDescription: string,
    userContext: string
): Promise<string> => {
    return executeSmartModel(async (modelName) => {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const imagePart = {
            inlineData: {
                mimeType: getMimeType(imageBase64),
                data: stripBase64Prefix(imageBase64),
            },
        };

        const prompt = `Based on the attached product image... (System Instruction của bạn)... Structure & Style Reference (JSON): ${POSE_PROMPT_EXAMPLE}`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: 'application/json',
                temperature: 0.7,
            },
        });

        return response.text || "{}";
    });
}

export const generateImageFromJsonPrompt = async (
  imageBase64: string,
  jsonPrompt: string,
  size: ImageSize
): Promise<string> => {
    await ensureApiKeySelected();

    let promptObj: any = {};
    try {
        const cleanJson = jsonPrompt.replace(/```json/g, '').replace(/```/g, '').trim();
        promptObj = JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("Dữ liệu prompt không hợp lệ.");
    }

    const constructedPrompt = `
    Fashion Photography: 8k resolution, photorealistic.
    SCENE: ${promptObj.scene?.description || ''}
    LIGHTING: ${promptObj.lighting?.description || ''}
    MODEL: ${promptObj.subject_model?.description || ''}
    POSE: ${promptObj.subject_model?.pose?.action || ''}
    FASHION ITEM: ${promptObj.wardrobe_and_accessories?.shared_product || ''}
    `;

    // Phần tạo ảnh: Gọi thẳng Imagen 4.0
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
    try {
        // @ts-ignore
        const response = await ai.models.generateImages({
            model: IMAGE_MODEL, // imagen-4.0-generate-001
            prompt: constructedPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "3:4", 
            }
        });

        const generatedImage = response.generatedImages?.[0]?.image;
        if (generatedImage?.imageBytes) {
            return `data:image/png;base64,${generatedImage.imageBytes}`;
        }
    } catch (error: any) {
        console.warn("Imagen 4 failed, trying fallback...", error);
        
        // Nếu Imagen 4 lỗi, thử fallback về bản 3.0 preview (cũng có trong list của bạn)
        try {
             // @ts-ignore
             const responseFallback = await ai.models.generateImages({
                model: 'gemini-3-pro-image-preview', // Model này cũng có trong list của bạn
                prompt: constructedPrompt,
                config: { numberOfImages: 1 }
            });
            const img = responseFallback.generatedImages?.[0]?.image;
            if (img?.imageBytes) return `data:image/png;base64,${img.imageBytes}`;
        } catch (e) {}

        throw new Error("Tạo ảnh thất bại. Hệ thống đang bận.");
    }
    throw new Error("Không có ảnh nào được tạo ra.");
};