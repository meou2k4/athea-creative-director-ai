
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FashionAIResponse, UserInput, ImageRef, Concept, Pose } from "../types";

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visual_analysis: {
      type: Type.OBJECT,
      properties: {
        color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
        form: { type: Type.STRING },
        material: { type: Type.STRING },
        style_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        vibe: { type: Type.STRING },
        target_audience: { type: Type.STRING },
        suggested_contexts: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_model_styles: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["color_palette", "form", "material", "style_keywords", "vibe", "target_audience", "suggested_contexts", "suggested_model_styles"]
    },
    concepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concept_name_vn: { type: Type.STRING },
          concept_name_en: { type: Type.STRING },
          sales_target: { type: Type.STRING },
          shoot_location: { type: Type.STRING },
          poses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pose_title: { type: Type.STRING },
                pose_description: { type: Type.STRING },
                pose_prompt: { 
                  type: Type.STRING, 
                  description: "JSON string: { 'subject_lock': '...', 'outfit_anchor': '...', 'pose_and_framing': '...', 'environment': '...', 'lighting_and_camera': '...', 'quality_specs': '...' }" 
                }
              },
              required: ["pose_title", "pose_description", "pose_prompt"]
            }
          },
          model_consistency: {
            type: Type.OBJECT,
            properties: {
              age_range: { type: Type.STRING },
              face_style: { type: Type.STRING },
              hair_style: { type: Type.STRING },
              makeup_style: { type: Type.STRING },
              attitude_vibe: { type: Type.STRING },
              personality_portrayal: { type: Type.STRING }
            },
            required: ["age_range", "face_style", "hair_style", "makeup_style", "attitude_vibe", "personality_portrayal"]
          },
          api_prompt_image_generation: {
            type: Type.OBJECT,
            properties: {
              short_prompt: { type: Type.STRING },
              detailed_prompt: { type: Type.STRING },
              negative_prompt: { type: Type.STRING }
            },
            required: ["short_prompt", "detailed_prompt", "negative_prompt"]
          }
        },
        required: ["concept_name_vn", "concept_name_en", "sales_target", "shoot_location", "poses", "model_consistency", "api_prompt_image_generation"]
      }
    }
  },
  required: ["visual_analysis", "concepts"]
};

const SYSTEM_INSTRUCTION = `
Bạn là AI Fashion Creative Director & Senior Prompt Engineer tối cao cho thương hiệu thời trang xa hoa ATHEA.
Nhiệm vụ: Phân tích sâu các ảnh tham chiếu để tạo ra 03 Concept chụp ảnh đẳng cấp thế giới.

QUY TẮC NHẤT QUÁN DANH TÍNH (STRICT IDENTITY LOCK):
1. PRODUCT_IMAGES: Phải phân tích mọi chi tiết: đường kim mũi chỉ, độ bóng của vải, phom dáng chiết eo, phụ kiện đi kèm. Tuyệt đối không thay đổi màu sắc hay cấu trúc sản phẩm.
2. FACE_REFERENCE: Giữ nguyên 100% đặc điểm nhận dạng gương mặt. Không làm biến dạng cấu trúc xương mặt.
3. FABRIC_REFERENCE: Tái hiện chính xác bề mặt chất liệu (ren, lụa, dạ, pinstripe).

YÊU CẦU BẮT BUỘC CHO 'pose_prompt' (PHẢI LÀ JSON STRING CHI TIẾT):
Mỗi 'pose_prompt' phải chứa đầy đủ các trường sau trong một chuỗi JSON:

- 'subject_lock': Mô tả chi tiết nhân dạng người mẫu dựa trên ảnh tham chiếu (kiểu tóc, màu mắt, thần thái).
- 'outfit_anchor': Mô tả cực kỳ chi tiết về trang phục đang mặc, nhấn mạnh các điểm bán hàng (VD: "grey pinstripe blazer with sharp shoulders", "white silk turtleneck inner").
- 'pose_and_framing': Chỉ định dáng đứng nghệ thuật và bố cục khung hình (VD: "Dynamic high-fashion pose, leaning against a luxury car", "Full body shot, slightly low angle to enhance stature"). Chỉ định tiêu cự ống kính (VD: 85mm f/1.2 for portraits, 35mm for environmental editorial).
- 'environment': Mô tả chi tiết bối cảnh xung quanh dựa trên Concept được chọn (VD: "Parisian street at golden hour, blurred Eiffel Tower in background, sleek black luxury sedan parked on cobblestones").
- 'lighting_and_camera': Sơ đồ ánh sáng phức tạp (VD: "Rim lighting to separate subject from dark background, soft butterfly lighting on face, Kodak Portra 400 film aesthetic, cinematic color grading, rich shadows, soft bokeh").
- 'quality_specs': Các từ khóa chất lượng cao nhất (VD: "8k resolution, highly detailed textures, masterwork, masterpiece, photorealistic, sharp focus").

PHONG CÁCH TỔNG THỂ: Editorial Magazine (Vogue, Harper's Bazaar style). Tránh các pose phổ thông, hãy tạo ra những khoảnh khắc lifestyle đắt giá.`;

/**
 * Utility function to handle retries for 429 (Resource Exhausted) errors
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 6): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      const isQuotaError = errorMessage.includes("429") || 
                          errorMessage.includes("RESOURCE_EXHAUSTED") ||
                          errorMessage.includes("quota");
      
      if (isQuotaError && i < maxRetries - 1) {
        // More robust exponential backoff: 4s, 8s, 16s, 32s...
        const waitTime = Math.pow(2, i + 2) * 1000 + Math.random() * 2000;
        console.warn(`Quota exceeded (429). Retrying in ${Math.round(waitTime/1000)}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const analyzeImage = async (input: UserInput): Promise<FashionAIResponse> => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];
    
    if (input.productImages && input.productImages.length > 0) {
      parts.push({ text: "PRODUCT REFERENCE IMAGES (Multiple angles/details):" });
      input.productImages.forEach((img, idx) => {
        if (img.data) {
          parts.push({ text: `Product Angle ${idx + 1}:` });
          parts.push({ inlineData: { mimeType: img.mimeType!, data: img.data } });
        }
      });
    }

    if (input.faceReference.data) {
      parts.push({ text: "FACE IDENTITY REFERENCE:" });
      parts.push({ inlineData: { mimeType: input.faceReference.mimeType!, data: input.faceReference.data } });
    }
    if (input.fabricReference.data) {
      parts.push({ text: "FABRIC & TEXTURE REFERENCE:" });
      parts.push({ inlineData: { mimeType: input.fabricReference.mimeType!, data: input.fabricReference.data } });
    }

    const promptText = `HÃY PHÂN TÍCH VÀ SÁNG TẠO CONCEPT THỜI TRANG ĐẲNG CẤP CHO ATHEA:
Bối cảnh chủ đạo: "${input.context}".
Yêu cầu riêng: ${input.customDescription || 'Luxury editorial'}.
Khóa ánh sáng: ${input.lock_lighting ? "Có" : "Không"}.

YÊU CẦU: Tạo 03 concept sáng tạo nhất, mỗi concept 5 poses.
LƯU Ý QUAN TRỌNG: 'pose_prompt' PHẢI là một chuỗi JSON hợp lệ chứa đầy đủ các chi tiết kỹ thuật nhiếp ảnh, ánh sáng và bối cảnh để tạo ra bức ảnh bìa tạp chí hoàn hảo nhất.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as FashionAIResponse;
      data.concepts = data.concepts.map((c, i) => ({ ...c, id: `concept-${i}` }));
      return data;
    }
    throw new Error("No response from AI.");
  });
};

export const regeneratePosePrompt = async (
  concept: Concept,
  pose: Pose,
  userInput: UserInput
): Promise<{ pose_title: string, pose_description: string, pose_prompt: string }> => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const promptSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      pose_title: { type: Type.STRING },
      pose_description: { type: Type.STRING },
      pose_prompt: { type: Type.STRING }
    },
    required: ["pose_title", "pose_description", "pose_prompt"]
  };

  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const promptText = `HÃY TẠO LẠI MỘT POSE KHÁC CHO CONCEPT NÀY.
Concept: "${concept.concept_name_vn}" / "${concept.concept_name_en}".
Mục tiêu: "${concept.sales_target}".
Địa điểm: "${concept.shoot_location}".
Pose hiện tại (cần thay đổi): "${pose.pose_title}".

YÊU CẦU ĐẶC BIỆT TỪ GIÁM ĐỐC SÁNG TẠO:
1. Sáng tạo vượt bậc: Tạo một pose mới mang tính điện ảnh hoặc thời trang cao cấp (High-Fashion), phá vỡ sự rập khuôn của pose cũ.
2. Mô tả truyền cảm hứng: Viết lại 'pose_description' (Tiếng Việt) cực kỳ hấp dẫn. Hãy mô tả nó như một tác phẩm nghệ thuật: cách người mẫu biểu đạt linh hồn bộ trang phục, sự tương tác đầy cảm xúc với bối cảnh, và các thuật ngữ chuyên môn về chuyển động, bố cục.
3. Kỹ thuật hoàn hảo: 'pose_prompt' (Tiếng Anh) phải là một tập hợp các chỉ dẫn kỹ thuật cực kỳ chi tiết cho AI (lighting, lens choice, mood, character identity coherence) để tạo ra bức ảnh đẳng cấp nhất.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: promptText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\nBạn là một Giám đốc Sáng tạo đầy tham vọng. Hãy tạo ra những nội dung thực sự khác biệt và đẳng cấp. Trả về JSON cho một pose duy nhất.",
        responseMimeType: "application/json",
        responseSchema: promptSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Failed to regenerate pose prompt.");
  });
};

export const generateFashionImage = async (
  prompt: string, 
  userInput: UserInput,
  options?: { faceLock?: boolean, outfitLock?: boolean }
): Promise<string> => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];

    if (userInput.productImages && userInput.productImages.length > 0) {
      userInput.productImages.forEach(img => {
        if (img.data) {
          parts.push({ inlineData: { mimeType: img.mimeType!, data: img.data } });
        }
      });
    }
    
    if (userInput.faceReference.data && (options?.faceLock !== false)) {
      parts.push({ inlineData: { mimeType: userInput.faceReference.mimeType!, data: userInput.faceReference.data } });
    }
    if (userInput.fabricReference.data && (options?.outfitLock !== false)) {
      parts.push({ inlineData: { mimeType: userInput.fabricReference.mimeType!, data: userInput.fabricReference.data } });
    }

    let technicalPrompt = prompt;
    try {
      const json = JSON.parse(prompt);
      technicalPrompt = `Create a high fashion editorial photo. 
        Subject Identity: ${json.subject_lock}. 
        Outfit & Details: ${json.outfit_anchor}. 
        Pose & Camera: ${json.pose_and_framing}. 
        Environment: ${json.environment || 'Luxurious'}. 
        Lighting: ${json.lighting_and_camera}.
        STRICT: Keep the face from the face reference image and the outfit details from ALL product images exactly as shown.`;
    } catch (e) {}

    parts.push({ text: technicalPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image was returned from the model.");
  });
};

export const refineFashionImage = async (imageBase64: string, instruction: string): Promise<string> => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || 'image/png';

  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Refine this fashion photograph while keeping the model and clothing exactly the same. Task: ${instruction}.` }
        ]
      }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Image refinement failed.");
  });
};
