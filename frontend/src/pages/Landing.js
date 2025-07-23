import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  Insights,
  BarChart,
  Search,
  AccountBalanceWallet,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: "Side-by-Side Analysis",
      description: "Compare performance, financials, and news sentiment for multiple stocks on one screen.",
    },
    {
      icon: <BarChart sx={{ fontSize: 40 }} />,
      title: "Advanced Charting & Prediction",
      description: "Use technical indicators and AI-powered price forecasts to inform your strategy.",
    },
    {
      icon: <Insights sx={{ fontSize: 40 }} />,
      title: "AI-Generated Insights",
      description: "Get simple summaries or expert 'Bull vs. Bear' cases, tailored to your investing style.",
    },
    {
      icon: <Search sx={{ fontSize: 40 }} />,
      title: "AI-Powered Stock Screener",
      description: "Use natural language to discover new investment opportunities based on your criteria.",
    },
    {
      icon: <AccountBalanceWallet sx={{ fontSize: 40 }} />,
      title: "Portfolio & Watchlist",
      description: "Track your personal holdings with real-time profit/loss and monitor your favorite stocks.",
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: "Secure & Personalised",
      description: "Your data is your own. Secure login ensures your portfolio and watchlist remain private.",
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0F1419 0%, #1A202C 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(circle at 25% 25%, rgba(54, 209, 220, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(91, 134, 229, 0.1) 0%, transparent 50%)
            `,
            animation: 'rotate 20s linear infinite',
          },
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        {/* Hero Section */}
        <MotionBox
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center', mb: 12 }}
        >
          <Typography
            variant="h1"
            sx={{
              mb: 3,
              background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
            }}
          >
            Navigate the Market with AI-Powered Clarity
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              mb: 4,
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            QuantView AI combines real-time data, news sentiment, and advanced AI to give you 
            a complete picture of the stocks you care about. Move beyond the noise and make 
            data-driven decisions.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
              px: 4,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 30px rgba(54, 209, 220, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Get Started For Free
          </Button>
        </MotionBox>

        {/* Features Section */}
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          sx={{ mb: 8 }}
        >
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              color: 'white',
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Everything You Need to Invest with Confidence
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <MotionCard
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="feature-card"
                  sx={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: '#36D1DC',
                      boxShadow: '0 10px 30px rgba(54, 209, 220, 0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(54, 209, 220, 0.1)',
                        color: '#36D1DC',
                        width: 80,
                        height: 80,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, color: 'white', fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </MotionBox>
      </Container>

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
};

export default Landing;
