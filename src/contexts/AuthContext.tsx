// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService'; // Import the service

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null; // Placeholder for user details, refine later
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean; // For login loading state
  error: string | null;   // For login error messages
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [user, setUser] = useState<any | null>(null); // Initialize user state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Effect to update isAuthenticated when token changes (e.g., from localStorage on init)
  useEffect(() => {
    setIsAuthenticated(!!token);
    if (token) {
        // Optional: Decode token to get user info or expiry, if it's a JWT
        // For simplicity, we're not doing this here yet.
        // You could also make an API call to /me or /userinfo to fetch user details
        // and setUser(userDetails);
    } else {
        setUser(null);
    }
  }, [token]);

  // If the token is cleared from localStorage by another tab/window
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        const newToken = event.newValue;
        setToken(newToken); // This will trigger the useEffect above
        if (!newToken) {
            navigate('/login', { replace: true }); // If token removed, navigate to login
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);


  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(username, password); // Call the real service
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        setToken(response.token);
        setIsAuthenticated(true);
        // Optionally, set user details if returned by login or fetch them
        // setUser(response.user || null); 
        navigate('/', { replace: true });
      } else {
        throw new Error("Login successful but no token received.");
      }
    } catch (err: any) {
      console.error("AuthContext login error:", err);
      // Try to get a more specific error message
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem('authToken');
      // No need to navigate here, user stays on login page to see error
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    // The request interceptor in apiClient will stop sending the token
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};