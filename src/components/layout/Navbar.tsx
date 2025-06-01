// src/components/layout/Navbar.tsx
import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

// Import your icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

import { useTheme } from '@mui/material/styles'; // alpha removed if not used directly here

interface NavbarProps {
  drawerFullWidth: number;
  drawerMiniWidth: number;
  isDesktopDrawerMini: boolean;
  mobileOpen: boolean;
  handleMobileDrawerToggle: () => void;
  handleDesktopDrawerTypeToggle: () => void;
}

const navItemsPrimary = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Call Upload', icon: <CloudUploadIcon />, path: '/calls/upload' },
  { text: 'Call Listing', icon: <ListAltIcon />, path: '/calls/listing' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
];

const Navbar: React.FC<NavbarProps> = (props) => {
  const { 
    drawerFullWidth, 
    drawerMiniWidth,
    isDesktopDrawerMini, 
    mobileOpen, 
    handleMobileDrawerToggle, 
    handleDesktopDrawerTypeToggle 
  } = props;
  const { logout } = useAuth();
  const theme = useTheme();

  const currentDesktopDrawerWidth = isDesktopDrawerMini ? drawerMiniWidth : drawerFullWidth;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isDesktopDrawerMini ? 'center' : 'space-between',
          px: isDesktopDrawerMini ? 1 : 2.5,
          py: 1.5,
          minHeight: '64px !important',
        }}
      >
        {!isDesktopDrawerMini ? (
            <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }} // App name in primary blue
            >
                Call Analysis
            </Typography>
        ) : (
            <BubbleChartIcon sx={{ color: theme.palette.primary.main, fontSize: '2rem' }} />
        )}
        {!isDesktopDrawerMini && ( // Only show mobile close if desktop drawer is full
            <IconButton 
                onClick={handleMobileDrawerToggle} 
                sx={{ 
                    display: { xs: 'block', sm: 'none' }, 
                    color: theme.palette.action.active, // Standard icon color
                }}
            >
            <ChevronLeftIcon />
            </IconButton>
        )}
      </Toolbar>
      <Divider /> {/* Standard divider color */}

      <List sx={{ flexGrow: 1, py: 1, px: isDesktopDrawerMini ? 0.5 : 1.5 }}>
        {navItemsPrimary.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', py: 0.25 }}>
            <ListItemButton
              component={RouterNavLink}
              to={item.path}
              onClick={mobileOpen ? handleMobileDrawerToggle : undefined}
              sx={(theme) => ({
                '&.active':{
                  backgroundColor: theme.palette.action.selected,
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
                minHeight: 48,
                justifyContent: 'initial',
                px: isDesktopDrawerMini ? 1.5 : 2.5,
                mx: isDesktopDrawerMini ? 0.5 : 0,
                borderRadius: '8px', 
                // Selected styles are handled by theme override for MuiListItemButton
              })}
            >
              <ListItemIcon sx={{ 
                  minWidth: 0,
                  mr: isDesktopDrawerMini ? 0 : 2,
                  justifyContent: 'center',
                  // Color will be theme.palette.text.secondary by default for inactive
                  // and theme.palette.primary.main for active (from theme override)
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                    opacity: isDesktopDrawerMini ? 0 : 1, 
                    transition: theme.transitions.create('opacity', {
                        duration: theme.transitions.duration.shortest,
                    }),
                    whiteSpace: 'nowrap',
                    // Text color will be theme.palette.text.primary for inactive
                    // and theme.palette.primary.main for active (from selection state)
                }}
                primaryTypographyProps={{ fontSize: '0.9rem' }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box>
        <Divider sx={{ mx: isDesktopDrawerMini ? 0.5 : 1.5 }} />
        <List sx={{ py: 1, px: isDesktopDrawerMini ? 0.5 : 1.5 }}>
          <ListItem disablePadding sx={{ display: 'block', py: 0.25 }}>
            <ListItemButton
              onClick={() => {
                if (mobileOpen) handleMobileDrawerToggle();
                logout();
              }}
              sx={{
                minHeight: 48,
                justifyContent: 'initial',
                px: isDesktopDrawerMini ? 1.5 : 2.5,
                mx: isDesktopDrawerMini ? 0.5 : 0,
                borderRadius: '8px',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: isDesktopDrawerMini ? 0 : 2, justifyContent: 'center' }}>
                <LogoutOutlinedIcon /> {/* Will use default icon color */}
              </ListItemIcon>
              <ListItemText 
                primary="Log out" 
                sx={{ 
                    opacity: isDesktopDrawerMini ? 0 : 1,
                    transition: theme.transitions.create('opacity', {
                        duration: theme.transitions.duration.shortest,
                    }),
                    whiteSpace: 'nowrap',
                }} 
                primaryTypographyProps={{ fontSize: '0.9rem' }} 
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  const drawerPaperStyles = {
    boxSizing: 'border-box',
    // bgcolor: theme.palette.background.paper, // This is default for Paper, so Drawer is white
    // color: theme.palette.text.primary, // Text inside will use this by default
    borderRight: '1px solid rgba(0, 0, 0, 0.12)', // Standard MUI divider color for Drawer border
    overflowX: 'hidden',
    width: currentDesktopDrawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: isDesktopDrawerMini 
            ? theme.transitions.duration.leavingScreen
            : theme.transitions.duration.enteringScreen,
      }),
  };

  return (
    <Box sx={{ display: 'flex' }}> 
      <AppBar
        position="fixed"
        elevation={1} 
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: isDesktopDrawerMini 
                ? theme.transitions.duration.leavingScreen 
                : theme.transitions.duration.enteringScreen,
          }),
          width: { 
            xs: '100%', 
            sm: `calc(100% - ${currentDesktopDrawerWidth}px)` 
          },
          marginLeft: { 
            xs: 0, 
            sm: `${currentDesktopDrawerWidth}px` 
          },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label={isDesktopDrawerMini ? "Expand drawer" : "Collapse drawer"}
            edge="start"
            onClick={handleDesktopDrawerTypeToggle}
            sx={{ 
              mr: 2, 
              display: { xs: 'none', sm: 'block' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {isDesktopDrawerMini ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { xs: 'block', sm: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1,
              display: { xs: 'block', sm: 'none' },
              color: theme.palette.primary.main,
              fontWeight: 'bold',
            }}
          >
            Call Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDesktopDrawerWidth }, 
          flexShrink: { sm: 0 } 
        }}
        aria-label="Navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerFullWidth,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': drawerPaperStyles,
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
    </Box>
  );
};

export default Navbar;