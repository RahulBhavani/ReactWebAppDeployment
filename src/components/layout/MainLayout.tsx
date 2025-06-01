// src/components/layout/MainLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Navbar from './Navbar';
import { useTheme } from '@mui/material/styles';

const drawerFullWidth = 240; // Standard full width
const drawerMiniWidth = 72;   // Width for the collapsed "mini" drawer (adjust as needed for icons)

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false); // For temporary mobile drawer
  const [isDesktopDrawerMini, setIsDesktopDrawerMini] = useState(false); // NEW: true if drawer is in mini mode
  const theme = useTheme();

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // This function now toggles between full and mini for the desktop drawer
  const handleDesktopDrawerTypeToggle = () => {
    setIsDesktopDrawerMini(!isDesktopDrawerMini);
  };
  
  // Calculate current desktop drawer width based on its state
  const currentDesktopDrawerWidth = isDesktopDrawerMini ? drawerMiniWidth : drawerFullWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        drawerFullWidth={drawerFullWidth}
        drawerMiniWidth={drawerMiniWidth}
        isDesktopDrawerMini={isDesktopDrawerMini} // Pass the new state
        mobileOpen={mobileOpen}
        handleMobileDrawerToggle={handleMobileDrawerToggle}
        handleDesktopDrawerTypeToggle={handleDesktopDrawerTypeToggle} // Pass the new handler
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: theme.transitions.create(['margin', 'width'], { // Smooth transition
            easing: theme.transitions.easing.sharp,
            duration: isDesktopDrawerMini 
                ? theme.transitions.duration.leavingScreen 
                : theme.transitions.duration.enteringScreen,
          }),
          width: { 
            xs: '100%', // Full width for mobile
            sm: `calc(100% - ${currentDesktopDrawerWidth}px)` // Adjusted width for desktop
          },
          marginTop: '64px', // Standard AppBar height
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;