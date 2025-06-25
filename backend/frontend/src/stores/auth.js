import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode' // Ensure this import is correct

const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null, // Store user info
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    // decodedAccessToken: (state) => state.accessToken ? jwtDecode(state.accessToken) : null,
    // decodedRefreshToken: (state) => state.refreshToken ? jwtDecode(state.refreshToken) : null,
  },
  actions: {
    setTokens(access, refresh) {
      this.accessToken = access;
      this.refreshToken = refresh;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      this.decodeAndSetUser(access);
    },
    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    decodeAndSetUser(token) {
      if (token) {
        try {
          const decoded = jwtDecode(token);
          this.user = {
            id: decoded.user_id,
            username: decoded.username,
            email: decoded.email,
            full_name: decoded.full_name, // Assuming you add this to your JWT payload
            user_type: decoded.user_type, // e.g., 'customer', 'merchant_admin'
            is_staff: decoded.is_staff,
            is_superuser: decoded.is_superuser,
          };
          localStorage.setItem('user', JSON.stringify(this.user));
        } catch (error) {
          console.error("Error decoding JWT or setting user:", error);
          this.clearTokens();
        }
      } else {
        this.clearTokens();
      }
    },
    async initializeAuth() {
      // On app load, attempt to re-authenticate if refresh token exists
      if (!this.isAuthenticated && this.refreshToken) {
        console.log("Attempting to refresh token on app load...");
        await this.refreshAccessToken();
      } else if (this.accessToken) {
        // If access token exists, ensure user data is decoded and set
        this.decodeAndSetUser(this.accessToken);
      }
    },
    async login(username, password) {
      try {
        const response = await axios.post(`${API_URL}/token/`, { username, password });
        this.setTokens(response.data.access, response.data.refresh);
        return true;
      } catch (error) {
        this.clearTokens();
        throw error; // Re-throw to be handled by component
      }
    },
    async register(userData) {
      try {
        // Assuming your register endpoint is at /api/users/register/
        const response = await axios.post(`${API_URL}/users/register/`, userData);
        // After successful registration, you might want to auto-login or redirect to login
        // For now, just return success
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    async refreshAccessToken() {
      if (!this.refreshToken) {
        this.clearTokens();
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: this.refreshToken });
        this.setTokens(response.data.access, response.data.refresh);
      } catch (error) {
        console.error("Failed to refresh token:", error);
        this.clearTokens(); // Clear tokens if refresh fails
        throw error;
      }
    },
    logout() {
      this.clearTokens();
      // Optionally, make an API call to blacklist the refresh token if your backend supports it
      console.log("Logged out.");
    },
  },
});
