import axios from 'axios';
import { useAuthStore } from '@/stores/auth'; // Adjust path if needed

// Base API URL from Vite environment variable, with a fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const FASTAPI_RECOMMENDATION_BASE_URL = import.meta.env.VITE_FASTAPI_RECOMMENDATION_BASE_URL || '/api/recommend';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const recommendationApi = axios.create({
  baseURL: FASTAPI_RECOMMENDATION_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Django API
api.interceptors.request.use(async config => {
  const authStore = useAuthStore();
  const token = authStore.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for Django API to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && originalRequest._retry !== true) {
      originalRequest._retry = true; // Mark request as retried
      try {
        await authStore.refreshAccessToken(); // Attempt to refresh token
        // Update the original request's authorization header with the new token
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
        return api(originalRequest); // Retry the original request
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        authStore.logout();
        // You might want to redirect to login here, e.g., router.push('/login')
        window.location.href = '/login'; // Simple redirect for now
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


// Request interceptor for Recommendation API (FastAPI)
recommendationApi.interceptors.request.use(async config => {
  const authStore = useAuthStore();
  const token = authStore.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for Recommendation API (FastAPI) to handle token refresh
recommendationApi.interceptors.response.use(
  response => response,
  async error => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest._retry !== true) {
      originalRequest._retry = true;
      try {
        await authStore.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
        return recommendationApi(originalRequest); // Retry the original request
      } catch (refreshError) {
        authStore.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);


export { api, recommendationApi };
