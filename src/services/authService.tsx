// src/services/authService.ts
import type { AxiosResponse } from 'axios';
import apiClient from './apiClient';

// Define the structure of the expected login response
interface LoginResponse {
  token: string;
  // Add other properties your login endpoint might return
}

const LOGIN_ENDPOINT = '/login'; // <-- Make sure this is correct

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      // Manually create the Basic Auth token
      // btoa() is a built-in browser function for Base64 encoding
      const basicAuthToken = btoa(`${username}:${password}`);

      const headers = {
        'Authorization': `Basic ${basicAuthToken}`,
        // 'Content-Type': 'application/json' // Axios usually sets this by default for object payloads
      };

      console.log('AuthService: Attempting to send with headers:', headers); // DEBUG LINE
      console.log('AuthService: Username:', username, 'Password:', password); // DEBUG LINE
      console.log('AuthService: Basic Auth Token:', basicAuthToken); // DEBUG LINE

      const response: AxiosResponse<LoginResponse> = await apiClient.post(
        LOGIN_ENDPOINT,
        {}, // Send an empty body, or any other data your endpoint might expect in the POST body
        { headers: headers } // Pass the constructed headers object
      );
      return response.data;
    } catch (error) {
      console.error('Login failed in authService:', error);
      throw error;
    }
  },
};