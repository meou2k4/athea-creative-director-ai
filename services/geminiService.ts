
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FashionAIResponse, UserInput, ImageRef, Concept, Pose } from "../types";
import fs from "fs";
import path from "path";

/**
 * =========================
 * MODEL SELECTION
 * =========================
 *
 * TEXT GENERATION (Content Creation):
 * - Model: gemini-2.5-flash (001)
 * - Reason: Stable version, fast response, 1M input tokens, 65K output tokens,
 *   supports thinking mode, multimodal (text + images), perfect for fashion concept analysis
 *
 * IMAGE GENERATION:
 * - Model: gemini-3-pro-image-preview (Nano Banana Pro)
 * - Reason: Advanced Gemini image generation model with highest quality
 * - Strategy: Aggressive retry with exponential backoff, no fallback to maintain quality
 */

/**
 * =========================
 * MASTER PHOTO PROFILE (GLOBAL)
 * =========================
 */
const MASTER_PROFILE = `
MASTER LIGHTING / COLOR / RENDERING PROFILE:
- Natural daylight only. Soft morning/afternoon (golden hour). No harsh midday sun.
- Side lighting (45-degree), very soft diffused shadows.
- Ambient fill light from environment reflections.
- Large aperture look (f/1.8–f/2.8), shallow depth of field, realistic bokeh.
- Warm-neutral color grade. Clean whites. Realistic skin texture.
- Photorealistic high-end fashion editorial quality.
`;

const IDENTITY_LOCK = `
STRICT IDENTITY & OUTFIT LOCK:
- Keep the SAME model face features and body proportions.
- Keep the EXACT SAME outfit design, fabric, color, and texture as provided in product images.
- NO variations in character or garment across images.
`;

const GLOBAL_NEGATIVE = "text, watermark, logo, extra fingers, deformed hands, bad anatomy, plastic skin, waxy skin, harsh overhead light, overexposure, blown highlights, oversaturation";

/**
 * Rate limiting for Google Cloud Free Tier optimization
 * Gemini API free tier: ~60 requests/minute, ~1000/day
 */
class RateLimiter {
  private lastRequestTime = 0;
  private requestCount = 0;
  private minuteStart = Date.now();

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceMinuteStart = now - this.minuteStart;

    // Reset counter every minute
    if (timeSinceMinuteStart > 60000) {
      this.requestCount = 0;
      this.minuteStart = now;
    }

    // Free tier limit: ~60 requests/minute
    if (this.requestCount >= 50) { // Conservative limit
      const waitTime = 60000 - timeSinceMinuteStart + 1000; // Wait until next minute + buffer
      console.log(`[RATE LIMIT] Hit 50 requests/minute limit. Waiting ${Math.round(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.minuteStart = Date.now();
    }

    // Minimum 2 second gap between requests to avoid burst limits
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 2000) {
      const waitTime = 2000 - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

const rateLimiter = new RateLimiter();

/**
 * Free Tier Usage Monitor
 * Tracks usage to help stay within Google Cloud Free Tier limits
 */
class FreeTierMonitor {
  private startTime = Date.now();
  private requestCount = 0;
  private estimatedCost = 0;

  // Gemini pricing estimates (approximate)
  private readonly PRICING = {
    'gemini-2.5-flash': 0.0000015, // per token (text)
    'gemini-3-pro-image-preview': 0.005, // per image (conservative estimate)
  };

  trackRequest(model: string, isImageGeneration = false): void {
    this.requestCount++;

    if (isImageGeneration && this.PRICING[model]) {
      this.estimatedCost += this.PRICING[model];
    }

    // Log usage stats every 10 requests
    if (this.requestCount % 10 === 0) {
      this.logUsageStats();
    }
  }

  private logUsageStats(): void {
    const hoursRunning = (Date.now() - this.startTime) / (1000 * 60 * 60);
    const requestsPerHour = this.requestCount / hoursRunning;

    console.log(`[FREE TIER MONITOR] ${this.requestCount} requests, ~$${this.estimatedCost.toFixed(4)} spent`);
    console.log(`[FREE TIER MONITOR] Rate: ${requestsPerHour.toFixed(1)} req/hour`);

    // Warnings
    if (this.estimatedCost > 250) {
      console.warn(`[FREE TIER WARNING] Approaching $300 limit: $${this.estimatedCost.toFixed(2)} used`);
    }

    if (requestsPerHour > 50) {
      console.warn(`[FREE TIER WARNING] High request rate: ${requestsPerHour.toFixed(1)} req/hour`);
    }
  }

  getUsageReport(): { requests: number, estimatedCost: number, hoursRunning: number } {
    const hoursRunning = (Date.now() - this.startTime) / (1000 * 60 * 60);
    return {
      requests: this.requestCount,
      estimatedCost: this.estimatedCost,
      hoursRunning
    };
  }
}

const freeTierMonitor = new FreeTierMonitor();

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
        suggested_model_styles: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_poses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              pose_title: { type: Type.STRING },
              pose_description: { type: Type.STRING }
            },
            required: ["id", "pose_title", "pose_description"]
          }
        }
      },
      required: ["color_palette", "vibe", "material", "form", "style_keywords", "target_audience", "suggested_poses"]
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
Bạn là Giám Đốc Sáng Tạo Thời Trang AI của ATHEA. 
Nhiệm vụ: Phân tích sản phẩm và thiết kế 03 concept chụp ảnh thời trang cao cấp, mỗi concept 05 poses.

=== MASTER PROFILE ===
${MASTER_PROFILE}

=== IDENTITY LOCK ===
${IDENTITY_LOCK}

Mỗi pose_prompt phải là một mô tả kỹ thuật chi tiết cho AI tạo ảnh, bao gồm: ánh sáng, camera, góc máy, bối cảnh và các chi tiết về người mẫu/trang phục.
Trả về JSON đúng cấu trúc.
`;

/**
 * Utility function to handle retries for 429 (Resource Exhausted) errors
 * Optimized for Google Cloud Free Tier usage
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 8): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      const isQuotaError = errorMessage.includes("429") ||
                          errorMessage.includes("RESOURCE_EXHAUSTED") ||
                          errorMessage.includes("quota") ||
                          errorMessage.includes("RATE_LIMIT");

      if (isQuotaError && i < maxRetries - 1) {
        // Aggressive backoff for quota errors: 10s, 20s, 40s, 80s, 160s, 320s, 640s
        // This helps avoid hitting quota limits while staying under free tier
        const waitTime = Math.pow(2, i + 3) * 1000 + Math.random() * 5000; // Add jitter
        console.warn(`[QUOTA] Rate limit hit. Waiting ${Math.round(waitTime/1000)}s before retry ${i + 1}/${maxRetries}`);
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
    // Apply rate limiting for Google Cloud Free Tier optimization
    await rateLimiter.throttle();

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
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      freeTierMonitor.trackRequest('gemini-2.5-flash', false); // Text generation, not image
      const data = JSON.parse(response.text) as FashionAIResponse;
      data.concepts = (data.concepts || []).slice(0, 3).map((c, i) => ({
        ...c,
        id: `c-${Date.now()}-${i}`,
        poses: (c.poses || []).slice(0, 5).map(p => ({
          ...p,
          negative_prompt: GLOBAL_NEGATIVE,
          is_face_locked: true,
          is_outfit_locked: true,
          is_lighting_locked: !!input.lock_lighting
        }))
      }));
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
    // Apply rate limiting for Google Cloud Free Tier optimization
    await rateLimiter.throttle();

    const ai = new GoogleGenAI({ apiKey });
    
    // Đảm bảo có đầy đủ thông tin concept từ JSON đã lưu
    const conceptNameVn = concept.concept_name_vn || concept.concept_name_en || "Concept";
    const conceptNameEn = concept.concept_name_en || concept.concept_name_vn || "Concept";
    const salesTarget = concept.sales_target || "High-end fashion";
    const shootLocation = concept.shoot_location || "Luxury setting";
    const currentPoseTitle = pose.pose_title || "Current pose";
    
    // Chuẩn bị parts để gửi ảnh khuôn vào AI
    const parts: any[] = [];
    
    // Thêm product images (ảnh sản phẩm) từ JSON đã lưu
    if (userInput?.productImages && userInput.productImages.length > 0) {
      userInput.productImages.forEach((img, idx) => {
        if (img && img.data) {
          let imageData = img.data;
          let mimeType = img.mimeType;
          
          // Xử lý base64 string
          if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              imageData = matches[2];
            }
          }
          
          if (mimeType && imageData) {
            parts.push({ inlineData: { mimeType, data: imageData } });
          }
        }
      });
    }
    
    // Thêm face reference (ảnh khuôn mặt) từ JSON đã lưu
    if (userInput?.faceReference?.data) {
      let faceData = userInput.faceReference.data;
      let faceMimeType = userInput.faceReference.mimeType;
      
      if (typeof faceData === 'string' && faceData.startsWith('data:')) {
        const matches = faceData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          faceMimeType = matches[1];
          faceData = matches[2];
        }
      }
      
      if (faceMimeType && faceData) {
        parts.push({ inlineData: { mimeType: faceMimeType, data: faceData } });
      }
    }
    
    // Thêm fabric reference (ảnh vải) từ JSON đã lưu
    if (userInput?.fabricReference?.data) {
      let fabricData = userInput.fabricReference.data;
      let fabricMimeType = userInput.fabricReference.mimeType;
      
      if (typeof fabricData === 'string' && fabricData.startsWith('data:')) {
        const matches = fabricData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          fabricMimeType = matches[1];
          fabricData = matches[2];
        }
      }
      
      if (fabricMimeType && fabricData) {
        parts.push({ inlineData: { mimeType: fabricMimeType, data: fabricData } });
      }
    }
    
    // Tạo prompt text với thông tin concept từ JSON đã lưu
    const promptText = `HÃY TẠO LẠI MỘT POSE KHÁC CHO CONCEPT NÀY.

THÔNG TIN CONCEPT TỪ JSON ĐÃ LƯU:
- Concept: "${conceptNameVn}" / "${conceptNameEn}"
- Mục tiêu: "${salesTarget}"
- Địa điểm: "${shootLocation}"
- Pose hiện tại (cần thay đổi): "${currentPoseTitle}"

ẢNH KHUÔN ĐÃ ĐƯỢC GỬI KÈM:
${userInput?.productImages?.length ? `- ${userInput.productImages.length} ảnh sản phẩm (product images)` : '- Không có ảnh sản phẩm'}
${userInput?.faceReference?.data ? '- 1 ảnh khuôn mặt (face reference)' : '- Không có ảnh khuôn mặt'}
${userInput?.fabricReference?.data ? '- 1 ảnh vải (fabric reference)' : '- Không có ảnh vải'}

YÊU CẦU ĐẶC BIỆT TỪ GIÁM ĐỐC SÁNG TẠO:
1. Phân tích ảnh khuôn: Hãy xem xét kỹ các ảnh sản phẩm, khuôn mặt, và vải đã được gửi kèm. Pose mới phải tôn vinh và làm nổi bật các chi tiết trong ảnh khuôn này.
2. Sáng tạo vượt bậc: Tạo một pose mới mang tính điện ảnh hoặc thời trang cao cấp (High-Fashion), phá vỡ sự rập khuôn của pose cũ, nhưng vẫn giữ được bản sắc của concept.
3. Mô tả truyền cảm hứng: Viết lại 'pose_description' (Tiếng Việt) cực kỳ hấp dẫn. Hãy mô tả nó như một tác phẩm nghệ thuật: cách người mẫu biểu đạt linh hồn bộ trang phục, sự tương tác đầy cảm xúc với bối cảnh, và các thuật ngữ chuyên môn về chuyển động, bố cục.
4. Kỹ thuật hoàn hảo: 'pose_prompt' (Tiếng Anh) phải là một tập hợp các chỉ dẫn kỹ thuật cực kỳ chi tiết cho AI (lighting, lens choice, mood, character identity coherence) để tạo ra bức ảnh đẳng cấp nhất, đảm bảo giữ nguyên khuôn mặt và chi tiết trang phục từ ảnh khuôn.`;

    // Gửi cả text prompt và ảnh khuôn vào AI
    const contents = parts.length > 0 
      ? [...parts, promptText]  // Nếu có ảnh, gửi ảnh trước, text sau
      : promptText;              // Nếu không có ảnh, chỉ gửi text

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\nBạn là một Giám đốc Sáng tạo đầy tham vọng. Hãy phân tích kỹ các ảnh khuôn đã được gửi và tạo ra những nội dung thực sự khác biệt và đẳng cấp, phù hợp với concept và ảnh khuôn. Trả về JSON cho một pose duy nhất.",
        responseMimeType: "application/json",
        responseSchema: promptSchema,
      },
    });

    if (response.text) {
      freeTierMonitor.trackRequest('gemini-2.5-flash', false); // Text generation
      const out = JSON.parse(response.text);
      return {
        ...out,
        negative_prompt: GLOBAL_NEGATIVE,
        is_face_locked: true,
        is_outfit_locked: true,
        is_lighting_locked: !!userInput.lock_lighting
      };
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
    // Apply rate limiting for Google Cloud Free Tier optimization
    await rateLimiter.throttle();

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];

    if (userInput.productImages && userInput.productImages.length > 0) {
      userInput.productImages.forEach((img, idx) => {
        if (img && img.data) {
          // Kiểm tra xem data có phải base64 hợp lệ không
          let imageData = img.data;
          let mimeType = img.mimeType;
          
          // Nếu là base64 string (data:image/...), extract mimeType và data
          if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              imageData = matches[2]; // Chỉ lấy phần base64, không có data: prefix
            }
          }
          
          if (mimeType && imageData) {
            parts.push({ inlineData: { mimeType, data: imageData } });
          }
        }
      });
    }
    
    if (userInput.faceReference?.data && (options?.faceLock !== false)) {
      let faceData = userInput.faceReference.data;
      let faceMimeType = userInput.faceReference.mimeType;
      
      // Nếu là base64 string (data:image/...), extract mimeType và data
      if (typeof faceData === 'string' && faceData.startsWith('data:')) {
        const matches = faceData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          faceMimeType = matches[1];
          faceData = matches[2];
        }
      }
      
      if (faceMimeType && faceData) {
        parts.push({ inlineData: { mimeType: faceMimeType, data: faceData } });
      }
    }
    
    if (userInput.fabricReference?.data && (options?.outfitLock !== false)) {
      let fabricData = userInput.fabricReference.data;
      let fabricMimeType = userInput.fabricReference.mimeType;
      
      // Nếu là base64 string (data:image/...), extract mimeType và data
      if (typeof fabricData === 'string' && fabricData.startsWith('data:')) {
        const matches = fabricData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          fabricMimeType = matches[1];
          fabricData = matches[2];
        }
      }
      
      if (fabricMimeType && fabricData) {
        parts.push({ inlineData: { mimeType: fabricMimeType, data: fabricData } });
      }
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

    // Thêm yêu cầu chất lượng cao vào prompt — yêu cầu rõ ràng trả về inline image (PNG) ở full resolution
    const highQualityPrompt = `Generate a HIGH RESOLUTION fashion photograph with exceptional detail and quality at 1536x2048 pixels (3:4 aspect ratio).
    IMPORTANT (API RESPONSE REQUIREMENT): Return the full-resolution image as inline base64 image data (PNG) in the response parts, not only a text description or thumbnail.
    DO NOT downscale or compress the image. Output must be exactly 1536x2048 pixels with maximum photographic detail and ultra-high quality.
    Use ultra-high detail, professional photography standards, natural skin texture, and fabric micro-detail.
    Response format requirement: include an inlineData part with mimeType 'image/png' and the full base64 image payload.
    ${technicalPrompt}`;

    parts.push({ text: highQualityPrompt });

    // Aggressive retry strategy chỉ với gemini-3-pro-image-preview
    let response;
    let lastError: any;

    // Retry với exponential backoff: 2s, 4s, 8s, 16s, 32s, 64s (tổng 6 lần)
    const maxRetries = 6;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI] Thử tạo ảnh với gemini-3-pro-image-preview (lần ${attempt}/${maxRetries})`);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: "3:4"
            }
          }
        });
        freeTierMonitor.trackRequest('gemini-3-pro-image-preview', true);
        console.log(`[AI] Tạo ảnh thành công với gemini-3-pro-image-preview (lần ${attempt})`);
        break; // Thành công, thoát vòng lặp
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || '';

        // Kiểm tra các loại lỗi có thể retry
        const isRetryableError = errorMsg.includes('not found') ||
                                errorMsg.includes('not available') ||
                                errorMsg.includes('404') ||
                                errorMsg.includes('429') ||
                                errorMsg.includes('RESOURCE_EXHAUSTED') ||
                                errorMsg.includes('quota') ||
                                errorMsg.includes('timeout') ||
                                errorMsg.includes('internal');

        if (isRetryableError && attempt < maxRetries) {
          // Exponential backoff: 2^attempt giây (2s, 4s, 8s, 16s, 32s, 64s)
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`[AI] Lỗi retry-able: ${errorMsg}. Đợi ${waitTime/1000}s trước lần thử ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          // Lỗi không retry được hoặc đã hết lần thử
          console.error(`[AI] Lỗi không thể retry hoặc đã hết ${maxRetries} lần thử: ${errorMsg}`);
          throw error;
        }
      }
    }

    // Nếu sau tất cả retry vẫn không được
    if (!response) {
      throw new Error(`Model gemini-3-pro-image-preview không khả dụng sau ${maxRetries} lần thử. Chi tiết lỗi cuối: ${lastError?.message || 'Unknown error'}`);
    }
    
    // Trả về base64 để frontend hiển thị ngay
    // Ảnh sẽ được lưu vào Drive khi người dùng bấm "Lưu Concept"
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        try {
          // Save debug copy on server to inspect actual bytes and file size
          const outDir = path.join(process.cwd(), "tmp");
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          const ext = part.inlineData.mimeType && part.inlineData.mimeType.includes("png") ? "png" : (part.inlineData.mimeType && part.inlineData.mimeType.includes("jpeg") ? "jpg" : "bin");
          const filename = `ai_image_${Date.now()}.${ext}`;
          const outPath = path.join(outDir, filename);
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outPath, buffer);
          console.log(`[AI DEBUG] Saved generated image to ${outPath} (${buffer.length} bytes)`);
        } catch (err) {
          console.warn("[AI DEBUG] Failed to save generated image for inspection:", err);
        }
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image was returned from the model.");
  });
};

export const refineFashionImage = async (
  imageBase64: string,
  instruction: string
): Promise<string> => {
  const apiKey = (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || 'image/png';

  return callWithRetry(async () => {
    // Apply rate limiting for Google Cloud Free Tier optimization
    await rateLimiter.throttle();

    const ai = new GoogleGenAI({ apiKey });
    
    // Aggressive retry strategy chỉ với gemini-3-pro-image-preview cho refine
    let response;
    let lastError: any;

    // Thêm yêu cầu chất lượng cao cho refine — yêu cầu rõ ràng trả về inline image (PNG) ở full resolution
    const highQualityRefinePrompt = `Refine this fashion photograph while keeping the model and clothing exactly the same at 1536x2048 pixels (3:4 aspect ratio).
    IMPORTANT (API RESPONSE REQUIREMENT): Return the refined image as inline base64 image data (PNG) in the response parts, do NOT return only text or a thumbnail.
    DO NOT downscale or compress the image. Output must be exactly 1536x2048 pixels with maximum resolution and ultra-high detail quality.
    Ensure output includes an inlineData part with mimeType 'image/png' and the full base64 image payload.
    Task: ${instruction}.`;

    // Retry với exponential backoff: 2s, 4s, 8s, 16s, 32s, 64s (tổng 6 lần)
    const maxRetries = 6;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AI] Thử refine với gemini-3-pro-image-preview (lần ${attempt}/${maxRetries})`);
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: highQualityRefinePrompt }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "3:4"
            }
          }
        });
        freeTierMonitor.trackRequest('gemini-3-pro-image-preview', true);
        console.log(`[AI] Refine thành công với gemini-3-pro-image-preview (lần ${attempt})`);
        break; // Thành công, thoát vòng lặp
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || '';

        // Kiểm tra các loại lỗi có thể retry
        const isRetryableError = errorMsg.includes('not found') ||
                                errorMsg.includes('not available') ||
                                errorMsg.includes('404') ||
                                errorMsg.includes('429') ||
                                errorMsg.includes('RESOURCE_EXHAUSTED') ||
                                errorMsg.includes('quota') ||
                                errorMsg.includes('timeout') ||
                                errorMsg.includes('internal');

        if (isRetryableError && attempt < maxRetries) {
          // Exponential backoff: 2^attempt giây (2s, 4s, 8s, 16s, 32s, 64s)
          const waitTime = Math.pow(2, attempt) * 1000;
          console.warn(`[AI] Lỗi retry-able cho refine: ${errorMsg}. Đợi ${waitTime/1000}s trước lần thử ${attempt + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          // Lỗi không retry được hoặc đã hết lần thử
          console.error(`[AI] Lỗi không thể retry cho refine hoặc đã hết ${maxRetries} lần thử: ${errorMsg}`);
          throw error;
        }
      }
    }

    // Nếu sau tất cả retry vẫn không được
    if (!response) {
      throw new Error(`Model gemini-3-pro-image-preview không khả dụng cho refine sau ${maxRetries} lần thử. Chi tiết lỗi cuối: ${lastError?.message || 'Unknown error'}`);
    }
    
    // Trả về base64 để frontend hiển thị ngay
    // Ảnh sẽ được lưu vào Drive khi người dùng bấm "Lưu Concept"
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        try {
          // Save debug copy on server to inspect actual bytes and file size
          const outDir = path.join(process.cwd(), "tmp");
          if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
          const ext = part.inlineData.mimeType && part.inlineData.mimeType.includes("png") ? "png" : (part.inlineData.mimeType && part.inlineData.mimeType.includes("jpeg") ? "jpg" : "bin");
          const filename = `ai_refined_image_${Date.now()}.${ext}`;
          const outPath = path.join(outDir, filename);
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outPath, buffer);
          console.log(`[AI DEBUG] Saved refined image to ${outPath} (${buffer.length} bytes)`);
        } catch (err) {
          console.warn("[AI DEBUG] Failed to save refined image for inspection:", err);
        }
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image refinement failed.");
  });
};
