// API Base URL configuration
// In development: uses Vite proxy (localhost:3001)
// In production: uses Render backend URL

const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // In development, use Vite proxy (relative path)
    return '';
  }
  
  // In production, use Render backend URL
  // Can be overridden by VITE_API_BASE_URL env variable
  return import.meta.env.VITE_API_BASE_URL || 'https://athea-creative-director-ai.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (API_BASE_URL) {
    // Ensure endpoint starts with /api
    const apiEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint : `api/${cleanEndpoint}`;
    return `${API_BASE_URL}/${apiEndpoint}`;
  }
  
  // In development with proxy, use relative path
  return `/${cleanEndpoint}`;
};

