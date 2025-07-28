import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Star, Delete, Info } from '@mui/icons-material';
import { watchlistAPI, stockAPI } from '../services/api';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await watchlistAPI.getWatchlist();
      const tickers = response.data;
      setWatchlist(tickers);

      // Fetch current prices for each stock
      const promises = tickers.map(async (ticker) => {
        try {
          const stockRes = await stockAPI.getStockInfo(ticker);
          return { ticker, data: stockRes.data };
        } catch (error) {
          return { ticker, data: null };
        }
      });

      const results = await Promise.all(promises);
      const newStockData = {};
      results.forEach(({ ticker, data }) => {
        if (data) newStockData[ticker] = data;
      });
      setStockData(newStockData);
    } catch (error) {
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (ticker) => {
    try {
      await watchlistAPI.removeFromWatchlist(ticker);
      setWatchlist(prev => prev.filter(t => t !== ticker));
      toast.success(`Removed ${ticker} from watchlist`);
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading watchlist...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Star sx={{ color: '#36D1DC', mr: 1, fontSize: 32 }} />
        <Typography
          variant="h3"
          sx={{
            background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}
        >
          My Watchlist
        </Typography>
      </Box>

      {watchlist.length === 0 ? (
        <Card sx={{ 
          background: 'rgba(26, 32, 44, 0.9)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          py: 4,
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Your watchlist is empty
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Go to the Dashboard to add stocks to your watchlist
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            You are watching {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''}
          </Typography>

          <Grid container spacing={3}>
            {watchlist.map((ticker) => {
              const data = stockData[ticker];
              return (
                <Grid item xs={12} sm={6} md={4} key={ticker}>
                  <Card sx={{ 
                    background: 'rgba(26, 32, 44, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          {data?.company_name || ticker}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => removeFromWatchlist(ticker)}
                        >
                          Remove
                        </Button>
                      </Box>

                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {ticker}
                      </Typography>

                      {data && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                            ${data.current_price?.toFixed(2) || 'N/A'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={`${data.change_percent >= 0 ? '+' : ''}${data.change_percent?.toFixed(2) || 0}%`}
                              color={data.change_percent >= 0 ? 'success' : 'error'}
                              size="small"
                            />
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
                                    • Calculated as: (Current Price - Previous Close) / Previous Close × 100
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                    • Time Range: 1 trading day (24 hours during market hours)
                                  </Typography>
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    • Updates in real-time during market hours
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
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  '&:hover': { color: '#36D1DC' },
                                  p: 0.3
                                }}
                              >
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                            Market Cap: ${data.market_cap ? `${(data.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Watchlist;
