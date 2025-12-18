
// User interface - giữ lại từ code cũ
export interface User {
  name: string;
  email: string;
}

// Types mới từ Downloads
export interface VisualAnalysis {
  color_palette: string[];
  form: string;
  material: string;
  style_keywords: string[];
  vibe: string;
  target_audience: string;
  suggested_contexts: string[]; // AI gợi ý bối cảnh
  suggested_model_styles: string[]; // AI gợi ý phong cách mẫu
}

export interface Pose {
  pose_title: string;
  pose_description: string;
  pose_prompt: string; // Prompt cụ thể để tạo ảnh cho dáng này
  generated_image?: string; // URL/Base64 của ảnh đã tạo (nếu có)
  is_face_locked?: boolean;
  is_outfit_locked?: boolean;
}

export interface ModelConsistency {
  age_range: string;
  face_style: string;
  hair_style: string;
  makeup_style: string;
  attitude_vibe: string;
  personality_portrayal: string;
}

export interface ApiPrompt {
  short_prompt: string;
  detailed_prompt: string;
  negative_prompt: string;
}

export interface Concept {
  id: string; // frontend generated
  concept_name_vn: string;
  concept_name_en: string;
  sales_target: string;
  shoot_location: string;
  poses: Pose[];
  model_consistency: ModelConsistency;
  api_prompt_image_generation: ApiPrompt;
}

export interface FashionAIResponse {
  visual_analysis: VisualAnalysis;
  concepts: Concept[];
}

export interface LoadingState {
  status: 'idle' | 'uploading' | 'analyzing' | 'suggesting' | 'complete' | 'error';
  message?: string;
}

export interface ImageRef {
  data: string | null;
  mimeType: string | null;
}

export interface UserInput {
  productImages: ImageRef[]; // Changed from productImage: ImageRef
  faceReference: ImageRef;
  fabricReference: ImageRef;
  context: string;
  modelStyle: string;
  suggestions: string;
  customDescription: string;
  modelOrigin: string; // 'VN' | 'KR' | 'US'
  lock_lighting: boolean;
}
