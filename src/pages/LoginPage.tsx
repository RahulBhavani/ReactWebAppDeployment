// src/pages/LoginPage.tsx
import React, { useState } from 'react'; // Added useEffect
import { useAuth } from '../contexts/AuthContext';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress'; // For loading indicator
import Alert from '@mui/material/Alert'; // For displaying errors

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Local error for form validation, distinct from API error in AuthContext
  // const [formError, setFormError] = useState(''); 

  const { login, isLoading, error: authError } = useAuth(); // Get isLoading and error from context

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Basic client-side validation (optional, can be more complex)
    if (!username || !password) {
      // setFormError('Username and password are required.');
      // Or rely on TextField's required prop, but a general message can be good.
      // For now, we'll let the API handle missing fields if configured that way.
    }
    // AuthContext's login function now handles setting its own error state.
    await login(username, password);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            padding: (theme) => theme.spacing(3, 4),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>

          {authError && ( // Display authentication error from AuthContext
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {authError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading} // Disable when loading
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading} // Disable when loading
            />
            <Box sx={{ position: 'relative', mt: 3, mb: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading} // Disable button when loading
              >
                Sign In
              </Button>
              {isLoading && ( // Show spinner on the button
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'primary.main',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;