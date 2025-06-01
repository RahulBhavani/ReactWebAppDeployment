// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
// HomePage is now DashboardPage by default under MainLayout
// import HomePage from './pages/HomePage'; 
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import CallUploadPage from './pages/CallUploadPage';
import CallListingPage from './pages/CallListingPage';
import CallDetailPage from './pages/CallDetailPage';
import ReportsPage from './pages/ReportsPage';
import { useAuth } from './contexts/AuthContext';


function App() {
  const { isAuthenticated } = useAuth(); // Get auth state

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}> {/* Parent route for protection */}
        <Route path="/" element={<MainLayout />}> {/* Layout for authenticated area */}
          {/* Default child route for "/" */}
          <Route index element={<DashboardPage />} /> 
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calls/upload" element={<CallUploadPage />} />
          <Route path="calls/listing" element={<CallListingPage />} />
          <Route path="calls/detail/:callId" element={<CallDetailPage />} /> {/* Dynamic route for call ID */}
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Catch-all for undefined routes - could redirect to a 404 page */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;