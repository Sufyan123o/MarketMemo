import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { BusinessCenter } from '@mui/icons-material';

const Portfolio = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <BusinessCenter sx={{ color: '#36D1DC', mr: 1, fontSize: 32 }} />
        <Typography
          variant="h3"
          sx={{
            background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
        >
          My Portfolio
        </Typography>
      </Box>
      
      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        Portfolio page coming soon...
      </Typography>
    </Container>
  );
};

export default Portfolio;
