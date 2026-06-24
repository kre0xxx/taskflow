import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api';

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