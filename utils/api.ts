// API Base URL configuration
// In development: uses Vite proxy (localhost:3001)
// In production: uses Google Cloud Run backend URL (must set VITE_API_BASE_URL)

const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    // In development, use Vite proxy (relative path)
    return '';
  }
  
  // In production: MUST set VITE_API_BASE_URL environment variable
  // Set this in Vercel dashboard: Settings → Environment Variables
  // Example: https://your-backend-service-xxxxx.run.app
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiUrl) {
    console.error('❌ VITE_API_BASE_URL is not set! Please configure it in Vercel environment variables.');
    throw new Error('Backend API URL is not configured. Please set VITE_API_BASE_URL environment variable.');
  }
  
  return apiUrl;
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

