// src/components/apiClient.ts

import axios from 'axios';
import { toast } from 'react-hot-toast'; // optional: for user feedback

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.clear();
      // Optional: clear any user context/state (see Step 2)
      
      // Show message (optional)
      toast.error('Session expired. Please log in again.');

      // Redirect to login
      window.location.href = '/login';

    }
    return Promise.reject(error);
  }
);

export default apiClient;