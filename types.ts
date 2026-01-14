
// User interface - giữ lại từ code cũ
export interface User {
  id: string;
  name: string;
  email: string;
}

// =========================
// Core UI / State Types
// =========================
export type LoadingStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'suggesting'
  | 'complete'
  | 'error';

export interface LoadingState {
  status: LoadingStatus;
  message?: string;
}

export interface ImageRef {
  data: string | null;
  mimeType: string | null;
}

export type ModelOrigin = 'VN' | 'KR' | 'US' | 'JP' | 'CN' | 'Muse';

export interface UserInput {
  productImages: ImageRef[]; // multi-angle product images (max ~4)
  faceReference: ImageRef;   // optional face reference
  fabricReference: ImageRef; // optional fabric reference

  context: string;           // injected scene context + constraints
  modelStyle: string;        // optional hint
  suggestions: string;       // optional hint
  customDescription: string; // manual requirement
  modelOrigin: ModelOrigin;  // origin preference
  lock_lighting: boolean;    // strict lighting lock toggle
}

// =========================
// AI Output Types
// =========================
export type PosePurpose = 'hero' | 'editorial' | 'detail' | 'lifestyle';

export interface SuggestedPose {
  id: string;                 // e.g. "pose_01"
  purpose: PosePurpose;       // hero/editorial/detail/lifestyle
  pose_title: string;         // short name
  pose_description: string;   // explanation
  framing: string;            // full body / medium / close-up / 3/4
  camera: string;             // lens feel + angle
  micro_actions: string[];    // small pose cues: hands, gaze, posture
}

export interface VisualAnalysis {
  color_palette: string[];
  form: string;
  material: string;
  style_keywords: string[];
  vibe: string;
  target_audience: string;

  suggested_contexts: string[];      // AI suggested scenes
  suggested_model_styles: string[];  // AI suggested model styling

  // NEW: AI generated pose suggestions based on product analysis
  suggested_poses: SuggestedPose[];
}

// =========================
// Concept & Pose Types
// =========================
export interface Pose {
  pose_title: string;
  pose_description: string;

  /**
   * NOTE: This must be a JSON STRING (not an object),
   * because your generator expects string and parses JSON inside generateFashionImage().
   */
  pose_prompt: string;

  // NEW: per pose negative prompt for safer generations
  negative_prompt: string;

  // optional generated output (UI uses if you store images)
  generated_image?: string; // URL or base64
  generated_seed?: string;  // optional if your generator supports

  // lock flags (used by UI / generation logic)
  is_face_locked?: boolean;
  is_outfit_locked?: boolean;
  is_lighting_locked?: boolean;
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
