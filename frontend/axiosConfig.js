import axios from 'axios';

// Determine API URL based on environment.
// For tunnel/mobile access we prefer the same-origin /api path so Vite proxy handles it.
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return '/api';
};

axios.defaults.baseURL = getApiBaseURL();
axios.defaults.withCredentials = true;

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