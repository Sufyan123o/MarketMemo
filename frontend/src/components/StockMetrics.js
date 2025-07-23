import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  Add,
} from '@mui/icons-material';

const StockMetrics = ({ ticker, data, analysis }) => {
  if (!data) return null;

  const currentPrice = data.current_price || data.close_prices?.[data.close_prices.length - 1];
  const changePercent = data.change_percent || 0;
  const sentiment = analysis?.sentiment || 0;

  const formatNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num?.toFixed(2) || 'N/A'}`;
  };

  return (
    <Card sx={{ 
      background: 'rgba(26, 32, 44, 0.9)', 
      border: '1px solid rgba(255, 255, 255, 0.1)',
      height: '100%',
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
            {data.company_name || ticker}
          </Typography>
          <Box>
            <Button
              size="small"
              startIcon={<StarBorder />}
              sx={{ color: '#36D1DC', mr: 1 }}
            >
              Watchlist
            </Button>
            <Button
              size="small"
              startIcon={<Add />}
              sx={{ color: '#5B86E5' }}
            >
              Portfolio
            </Button>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {ticker}
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Current Price
            </Typography>
            <Typography variant="h6" sx={{ color: 'white' }}>
              ${currentPrice?.toFixed(2) || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Change
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {changePercent >= 0 ? (
                <TrendingUp sx={{ color: '#4CAF50', mr: 0.5 }} />
              ) : (
                <TrendingDown sx={{ color: '#F44336', mr: 0.5 }} />
              )}
              <Typography 
                variant="h6" 
                sx={{ color: changePercent >= 0 ? '#4CAF50' : '#F44336' }}
              >
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Market Cap
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {formatNumber(data.market_cap)}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              P/E Ratio
            </Typography>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {data.pe_ratio?.toFixed(2) || 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 1 }}>
              News Sentiment
            </Typography>
            <Chip
              label={`${sentiment >= 0 ? 'Positive' : 'Negative'} (${sentiment.toFixed(2)})`}
              color={sentiment >= 0 ? 'success' : 'error'}
              size="small"
            />
          </Grid>

          {analysis?.news && analysis.news.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 1 }}>
                Latest News
              </Typography>
              <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                {analysis.news.slice(0, 2).map((article, index) => (
                  <Typography 
                    key={index}
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      mb: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    • {article.title}
                  </Typography>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StockMetrics;
