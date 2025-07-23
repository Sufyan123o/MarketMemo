import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Psychology, Lightbulb } from '@mui/icons-material';

const AIInsights = ({ data, type, ticker }) => {
  if (!data) return null;

  return (
    <Card sx={{ 
      background: 'rgba(26, 32, 44, 0.9)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Psychology sx={{ color: '#36D1DC', mr: 1 }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {type === 'comparison' ? 'AI Stock Comparison' : `AI Analysis - ${ticker}`}
          </Typography>
          <Chip
            icon={<Lightbulb />}
            label="AI Generated"
            size="small"
            sx={{
              ml: 2,
              background: 'rgba(54, 209, 220, 0.2)',
              color: '#36D1DC',
              border: '1px solid #36D1DC',
            }}
          />
        </Box>

        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          background: 'rgba(54, 209, 220, 0.05)',
          border: '1px solid rgba(54, 209, 220, 0.2)',
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}
          >
            {data.summary || data.analysis || 'AI analysis not available.'}
          </Typography>
        </Box>

        {data.bull_case && data.bear_case && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Expert Analysis
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip
                label="Bull Case"
                sx={{
                  background: 'rgba(76, 175, 80, 0.2)',
                  color: '#4CAF50',
                  border: '1px solid #4CAF50',
                  mb: 1,
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  mt: 1,
                  pl: 2,
                }}
              >
                {data.bull_case}
              </Typography>
            </Box>

            <Box>
              <Chip
                label="Bear Case"
                sx={{
                  background: 'rgba(244, 67, 54, 0.2)',
                  color: '#F44336',
                  border: '1px solid #F44336',
                  mb: 1,
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  mt: 1,
                  pl: 2,
                }}
              >
                {data.bear_case}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
