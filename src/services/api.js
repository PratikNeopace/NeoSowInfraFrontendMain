import axios from 'axios';
import { isProduction } from './config';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return isProduction ? 'https://api.neosowinfra.com/api/v1' : 'http://localhost:8080/api/v1';
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refreshes
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Note: call raw axios to avoid infinite loops
          const res = await axios.post(
            `${API.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );
          if (res.status === 200) {
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            originalRequest.headers['Authorization'] = `Bearer ${res.data.accessToken}`;
            return API(originalRequest);
          }
        }
      } catch (err) {
        // Refresh token expired or invalid, force logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
