// src/components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode; // Optional: for wrapping specific content
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If children are provided, render them (useful for specific inline protection)
  // Otherwise, render the <Outlet /> for nested routes (our main use case)
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;