import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  Add,
  Close,
  OpenInNew,
  Info,
} from '@mui/icons-material';
import { watchlistAPI } from '../services/api';

const StockMetrics = ({ ticker, data, analysis }) => {
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Check if stock is in watchlist on component mount
  useEffect(() => {
    if (ticker) {
      checkWatchlistStatus();
    }
  }, [ticker]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await watchlistAPI.getWatchlist();
      const watchlist = response.data || [];
      setIsInWatchlist(watchlist.includes(ticker.toUpperCase()));
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      // If there's an auth error, assume not in watchlist
      setIsInWatchlist(false);
    }
  };

  const handleWatchlistToggle = async () => {
    setWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await watchlistAPI.removeFromWatchlist(ticker);
        setIsInWatchlist(false);
        setSnackbar({
          open: true,
          message: `${ticker} removed from watchlist`,
          severity: 'info'
        });
      } else {
        await watchlistAPI.addToWatchlist(ticker);
        setIsInWatchlist(true);
        setSnackbar({
          open: true,
          message: `${ticker} added to watchlist`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update watchlist. Please try again.',
        severity: 'error'
      });
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!data) return null;

  const currentPrice = data.current_price || data.close_prices?.[data.close_prices.length - 1];
  const changePercent = data.change_percent || 0;
  
  // Safely extract sentiment value with multiple fallback checks
  let sentiment = 0;
  if (analysis?.sentiment !== undefined && analysis?.sentiment !== null) {
    if (typeof analysis.sentiment === 'number') {
      sentiment = analysis.sentiment;
    } else if (typeof analysis.sentiment === 'object' && analysis.sentiment.sentiment !== undefined) {
      sentiment = Number(analysis.sentiment.sentiment) || 0;
    } else {
      sentiment = Number(analysis.sentiment) || 0;
    }
  }

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
              startIcon={isInWatchlist ? <Star /> : <StarBorder />}
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
              sx={{ 
                color: isInWatchlist ? '#FFD700' : '#36D1DC', 
                mr: 1,
                '&:hover': {
                  backgroundColor: isInWatchlist ? 'rgba(255, 215, 0, 0.1)' : 'rgba(54, 209, 220, 0.1)',
                }
              }}
            >
              {watchlistLoading ? 'Loading...' : isInWatchlist ? 'In Watchlist' : 'Watchlist'}
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                Change
              </Typography>
              <Tooltip
                title={
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      Daily Price Change
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      Shows the percentage change from the previous trading day's closing price.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Time Range: 1 trading day (24 hours during market hours)
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(26, 32, 44, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      maxWidth: 320,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(26, 32, 44, 0.95)',
                    },
                  },
                }}
              >
                <IconButton
                  size="small"
                  sx={{ 
                    ml: 0.5, 
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': { color: '#36D1DC' },
                    p: 0.3
                  }}
                >
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                News Sentiment
              </Typography>
              <Tooltip
                title={
                  <Box sx={{ p: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      News Sentiment Analysis
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      Measures whether recent news is positive or negative for the stock.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Score ranges from -1.0 (very negative) to +1.0 (very positive)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      • Uses AI to analyze news headlines and descriptions
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      • Higher scores suggest more favorable market conditions
                    </Typography>
                  </Box>
                }
                arrow
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(26, 32, 44, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      maxWidth: 320,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(26, 32, 44, 0.95)',
                    },
                  },
                }}
              >
                <IconButton
                  size="small"
                  sx={{ 
                    ml: 0.5, 
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': { color: '#36D1DC' },
                    p: 0.3
                  }}
                >
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Chip
              label={`${sentiment >= 0 ? 'Positive' : 'Negative'} (${Number(sentiment).toFixed(2)})`}
              color={sentiment >= 0 ? 'success' : 'error'}
              size="small"
            />
          </Grid>

          {analysis?.news && analysis.news.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  Latest News
                </Typography>
                <Button
                  size="small"
                  onClick={() => setNewsDialogOpen(true)}
                  sx={{ 
                    color: '#36D1DC', 
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    p: 0.5
                  }}
                >
                  Show More
                </Button>
              </Box>
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

      {/* News Articles Dialog */}
      <Dialog
        open={newsDialogOpen}
        onClose={() => setNewsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(26, 32, 44, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            📰 News Articles for {ticker}
          </Typography>
          <IconButton 
            onClick={() => setNewsDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <List sx={{ width: '100%' }}>
            {analysis?.news?.map((article, index) => (
              <ListItem
                key={index}
                sx={{
                  borderBottom: index < analysis.news.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                  cursor: 'pointer',
                }}
                onClick={() => window.open(article.url, '_blank')}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 500,
                          flex: 1
                        }}
                      >
                        {article.title}
                      </Typography>
                      <OpenInNew sx={{ color: '#36D1DC', fontSize: 16 }} />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}
                      >
                        {article.description}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#36D1DC',
                          fontWeight: 500
                        }}
                      >
                        Source: {article.source?.name || 'Unknown'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions sx={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2
        }}>
          <Button 
            onClick={() => setNewsDialogOpen(false)}
            sx={{ color: '#36D1DC' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for watchlist notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ 
            backgroundColor: snackbar.severity === 'success' ? '#4CAF50' : 
                             snackbar.severity === 'info' ? '#2196F3' : '#f44336',
            color: 'white'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default StockMetrics;
