import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('miracle_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const rToken = localStorage.getItem('miracle_refresh_token');
        if (!rToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: rToken,
        });

        localStorage.setItem('miracle_access_token', data.accessToken);
        localStorage.setItem('miracle_refresh_token', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        // Refresh token failed -> clear tokens and logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('miracle_access_token');
          localStorage.removeItem('miracle_refresh_token');
          // Optional: redirect to login if on private page
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);
