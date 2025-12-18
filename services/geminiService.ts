
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FashionAIResponse, UserInput, ImageRef } from "../types";

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
                  description: "JSON string: { 'subject_lock': '...', 'outfit_anchor': '...', 'pose_and_framing': '...', 'lighting_and_camera': '...', 'quality_specs': '...' }" 
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
Bạn là AI Fashion Creative Director & Senior Prompt Engineer.
Nhiệm vụ: Phân tích các ảnh tham chiếu (Nhiều ảnh Sản phẩm, Gương mặt, Chất liệu) để tạo 03 Concept thời trang.

QUY TẮC NHẤT QUÁN CỐT LÕI (CONSISTENCY RULES):
1. PRODUCT_IMAGES (Các ảnh sản phẩm): Tổng hợp các góc độ để giữ nguyên phom dáng, chi tiết thiết kế, phụ kiện và bảng màu.
2. FACE_REFERENCE (Nếu có): Giữ nguyên 100% nhân dạng (facial structure, eyes, skin tone). Không thay đổi sắc tộc.
3. FABRIC_REFERENCE (Nếu có): Giữ nguyên kết cấu vải, độ bóng, họa tiết thêu dệt.

Mỗi 'pose_prompt' là chuỗi JSON kỹ thuật (English) mô tả cách kết hợp các yếu tố này vào bối cảnh mới.
`;

export const analyzeImage = async (input: UserInput): Promise<FashionAIResponse> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [];
    
    // Support multiple product images
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

    const promptText = `HÃY PHÂN TÍCH VÀ SÁNG TẠO CONCEPT:
Bối cảnh chủ đạo: "${input.context}".
Yêu cầu riêng: ${input.customDescription || 'Luxury editorial'}.
Khóa ánh sáng: ${input.lock_lighting ? "Có" : "Không"}.

YÊU CẦU: Tạo 03 concept, mỗi concept 5 poses. Đảm bảo pose_prompt mô tả chi tiết cách duy trì sự nhất quán từ TẤT CẢ các ảnh sản phẩm và tham chiếu đã cung cấp.`;

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
    throw new Error("No response");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateFashionImage = async (
  prompt: string, 
  userInput: UserInput,
  options?: { faceLock?: boolean, outfitLock?: boolean }
): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [];

  // Add all product images for ultimate consistency during generation
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const refineFashionImage = async (imageBase64: string, instruction: string): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  const ai = new GoogleGenAI({ apiKey });
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || 'image/png';

  try {
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
    throw new Error("No image refined");
  } catch (error) {
    throw error;
  }
};
