import axios from 'axios';

// Determine API URL based on environment
const getApiBaseURL = () => {
  // Use explicit VITE_API_URL if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For VSCode tunnel and remote development
  // Construct API URL dynamically from current location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Extract backend port from env or use default
    const backendPort = import.meta.env.VITE_API_PORT || '5002';
    
    // For tunnel URLs, use the same hostname with backend port
    // For local development, use explicit localhost/API path
    if (hostname.includes('vscode.dev') || hostname.includes('tunnel')) {
      return `${protocol}//${hostname}:${backendPort}/api`;
    }
    
    // Default: use relative path for dev server proxy
    return '/api';
  }
  
  return '/api';
};

axios.defaults.baseURL = getApiBaseURL();

// Log API URL in development
if (import.meta.env.DEV) {
  console.log('[Axios] Base URL:', axios.defaults.baseURL);
}

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config.url);
    }
    return Promise.reject(error);
  }
);