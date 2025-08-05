import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  Star,
  BusinessCenter,
  Search,
  SportsEsports,
  MenuBook,
  ExpandMore,
  Assessment,
  Analytics,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [journalAnchorEl, setJournalAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleJournalMenu = (event) => {
    setJournalAnchorEl(event.currentTarget);
  };

  const handleJournalClose = () => {
    setJournalAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { label: 'Watchlist', path: '/watchlist', icon: <Star /> },
    { label: 'Portfolio', path: '/portfolio', icon: <BusinessCenter /> },
    { label: 'Screener', path: '/screener', icon: <Search /> },
    { label: 'Playground', path: '/playground', icon: <SportsEsports /> },
  ];

  const journalItems = [
    { label: 'Dashboard', path: '/journal', icon: <Assessment /> },
    { label: 'Analytics', path: '/journal-analytics', icon: <Analytics /> },
  ];

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(15, 20, 25, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
          onClick={() => navigate('/')}
        >
          💡 SufsTrading AI
        </Typography>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color: location.pathname === item.path ? '#36D1DC' : 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(54, 209, 220, 0.1)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
            
            {/* Journal Dropdown */}
            <Button
              color="inherit"
              startIcon={<MenuBook />}
              endIcon={<ExpandMore />}
              onClick={handleJournalMenu}
              sx={{
                color: journalItems.some(item => location.pathname === item.path) ? '#36D1DC' : 'inherit',
                '&:hover': {
                  backgroundColor: 'rgba(54, 209, 220, 0.1)',
                },
              }}
            >
              Journal
            </Button>
            <Menu
              anchorEl={journalAnchorEl}
              open={Boolean(journalAnchorEl)}
              onClose={handleJournalClose}
              MenuListProps={{
                'aria-labelledby': 'journal-button',
              }}
              PaperProps={{
                sx: {
                  background: 'rgba(15, 20, 25, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {journalItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    handleJournalClose();
                  }}
                  sx={{
                    color: location.pathname === item.path ? '#36D1DC' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'rgba(54, 209, 220, 0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.icon}
                    {item.label}
                  </Box>
                </MenuItem>
              ))}
            </Menu>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                {user.email}
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}

        {!user && (
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            sx={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(54, 209, 220, 0.1)',
                borderColor: '#36D1DC',
              },
            }}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
