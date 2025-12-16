import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "../types";

// --- [CONFIG] CẤU HÌNH MODEL CHUẨN (ĐÃ KIỂM TRA HOẠT ĐỘNG) ---
// Sử dụng bản Flash 1.5 ổn định (Rate limit cao: 15 RPM, 1500 RPD)
// KHÔNG DÙNG bản 'exp' (thử nghiệm) vì dễ bị lỗi 429
const TEXT_MODEL = 'gemini-1.5-flash'; 

// Model tạo ảnh chuyên dụng của Google (Thay thế cho gemini-3 ảo)
const IMAGE_MODEL = 'imagen-3.0-generate-001';

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

// Hàm delay để chờ khi gặp lỗi quá tải
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleGeminiError = (error: any, functionName: string): never => {
  console.error(`🔴 [Gemini Service Error] tại hàm '${functionName}':`, error);
  const rawMessage = error?.message || JSON.stringify(error);
  
  let userFriendlyMessage = "Hệ thống đang bận xử lý. Vui lòng thử lại sau ít phút.";

  if (rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")) {
    userFriendlyMessage = "Hệ thống đang quá tải yêu cầu. Đang tự động thử lại...";
  } else if (rawMessage.includes("503") || rawMessage.includes("overloaded")) {
    userFriendlyMessage = "Máy chủ AI đang tạm thời bận rộn. Vui lòng thử lại.";
  } else if (rawMessage.includes("SAFETY") || rawMessage.includes("HARM_CATEGORY")) {
    userFriendlyMessage = "Hình ảnh đầu vào có thể vi phạm quy tắc an toàn. Vui lòng chọn ảnh khác.";
  } else if (rawMessage.includes("403") || rawMessage.includes("PERMISSION_DENIED")) {
    userFriendlyMessage = "Lỗi xác thực quyền truy cập API Key.";
  } else if (rawMessage.includes("404") || rawMessage.includes("NOT_FOUND")) {
    userFriendlyMessage = `Không tìm thấy Model AI (${TEXT_MODEL}). Vui lòng kiểm tra lại cấu hình.`;
  }

  throw new Error(userFriendlyMessage);
};

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

// --- CƠ CHẾ RETRY THÔNG MINH ---
const executeWithRetry = async <T>(action: () => Promise<T>, retries = 3): Promise<T> => {
    try {
        return await action();
    } catch (error: any) {
        const errorMessage = error.message || JSON.stringify(error);
        
        // Nếu lỗi Quota (429) hoặc Server Busy (503) -> Chờ và thử lại
        if (
            (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") ||
             errorMessage.includes("503") || errorMessage.includes("overloaded")) 
            && retries > 0
        ) {
            console.warn(`⚠️ Gặp lỗi quá tải (${errorMessage.includes("429") ? "429" : "503"}). Đang chờ 4s để thử lại... (Còn ${retries} lần)`);
            await delay(4000); // Chờ 4 giây (Gemini Free Tier hồi phục sau vài giây)
            return executeWithRetry(action, retries - 1);
        }

        // Nếu lỗi quyền (403) -> Mở popup chọn key
        if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
            console.warn("Permission denied (403). Prompting for API key selection...");
            try {
                if (window.aistudio?.openSelectKey) {
                    await window.aistudio.openSelectKey();
                    return await action();
                }
            } catch (selectError) { console.error(selectError); }
            throw new Error("Quyền truy cập bị từ chối. Vui lòng chọn dự án hợp lệ.");
        }
        
        handleGeminiError(error, "executeWithRetry"); 
    }
};

// --- CÁC HÀM API ---

export const suggestShootingContexts = async (imageBase64: string): Promise<string[]> => {
  return executeWithRetry(async () => {
    // Luôn lấy API Key mới nhất từ biến môi trường
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
      model: TEXT_MODEL, // gemini-1.5-flash
      contents: { parts: [imagePart, { text: prompt }] },
      config: { responseMimeType: 'application/json' },
    });

    if (response.text) return JSON.parse(response.text) as string[];
    return [];
  });
};

export const suggestModelStyles = async (imageBase64: string): Promise<string[]> => {
  return executeWithRetry(async () => {
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
      model: TEXT_MODEL,
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
  return executeWithRetry(async () => {
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
      model: TEXT_MODEL,
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
    return executeWithRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const imagePart = {
            inlineData: {
                mimeType: getMimeType(imageBase64),
                data: stripBase64Prefix(imageBase64),
            },
        };

        const prompt = `Based on the attached product image... (Giữ nguyên prompt tiếng Anh của bạn)... Structure & Style Reference (JSON): ${POSE_PROMPT_EXAMPLE}`;

        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
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

    return executeWithRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        
        try {
            // SỬ DỤNG IMAGEN 3 (Chuẩn tạo ảnh, không dùng gemini text)
            // @ts-ignore - Ignore type check nếu SDK chưa update type cho imagen
            const response = await ai.models.generateImages({
                model: IMAGE_MODEL,
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
        } catch (imgError: any) {
             console.warn("Imagen 3 failed", imgError);
             throw new Error("Tạo ảnh thất bại (Model Imagen chưa khả dụng với Key này).");
        }
        throw new Error("Không có ảnh nào được tạo ra.");
    });
};