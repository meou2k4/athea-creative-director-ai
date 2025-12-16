
export interface User {
  name: string;
  email: string;
}

export enum ImageSize {
  Size1K = "1K",
  Size2K = "2K",
  Size4K = "4K",
}

export interface ShootingPlanState {
  image: string | null; // Base64 Main Product
  closeupImage: string | null; // Base64 Close-up material
  faceImage: string | null; // Base64 Model Face reference
  
  context: string;
  modelStyle: string;
  planResult: string | null;
  isLoadingPlan: boolean;
  generatedImage: string | null;
  isGeneratingImage: boolean;
  imageSize: ImageSize;
  error: string | null;
  
  // Context Suggestions
  suggestedContexts: string[];
  isSuggestingContexts: boolean;

  // Model Style Suggestions
  suggestedModelStyles: string[];
  isSuggestingModelStyles: boolean;

  // Key: "lineIndex", Value: JSON string of the prompt
  posePrompts: Record<string, string>; 
  // ID of the pose currently generating a prompt
  generatingPosePromptId: string | null; 
  // Key: "lineIndex", Value: Base64 image string
  poseImages: Record<string, string>;
  // ID of the pose currently generating an image
  generatingPoseImageId: string | null;
}
