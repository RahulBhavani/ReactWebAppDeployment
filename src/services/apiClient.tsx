// src/services/apiClient.ts
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = 'https://c6a1-123-201-29-138.ngrok-free.app'; // <-- IMPORTANT: SET YOUR API BASE URL HERE

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// This will run before every request is sent
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      // Add the Bearer token to the Authorization header
      // Only add if the header doesn't already exist to avoid overriding custom auth for specific requests
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    console.log('Outgoing request config:', JSON.parse(JSON.stringify(config)));
    return config;
  },
  (error: AxiosError) => {
    // Handle request error here
    return Promise.reject(error);
  }
);

// --- Response Interceptor (Optional but Recommended) ---
// This will run after every response is received
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // You can process response data here before it's passed to then()
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Handle errors globally here
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);

      if (error.response.status === 401) {
        // Unauthorized: Token might be invalid or expired
        // You could trigger a logout action here
        // For example:
        // localStorage.removeItem('authToken');
        // window.location.href = '/login'; // Force redirect
        // Or use a more sophisticated method with your AuthContext
        console.warn('Unauthorized access (401). Token might be invalid or expired.');
        // Consider triggering logout from AuthContext here
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error); // Important to pass the error along
  }
);

export default apiClient;