import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Add,
  Remove,
  Refresh,
  History,
  AccountBalance,
  ShowChart,
  AttachMoney,
  Close,
  Download,
  FileDownload,
  Analytics,
  Link,
} from '@mui/icons-material';
import { portfolioAPI, stockAPI } from '../services/api';
import useLivePrices from '../hooks/useLivePrices';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [pnlDialogOpen, setPnlDialogOpen] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [pnlBreakdown, setPnlBreakdown] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Trade form state
  const [tradeForm, setTradeForm] = useState({
    ticker: '',
    action: 'buy',
    quantity: '',
    customPrice: false,
    price: '',
    commission: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Get symbols from portfolio positions for live prices
  const portfolioSymbols = portfolio?.positions ? Object.keys(portfolio.positions) : [];
  const { livePrices, liveCount } = useLivePrices(portfolioSymbols);

  useEffect(() => {
    loadPortfolio();

    // Listen for external trade requests
    const handleTradeRequest = (event) => {
      const { ticker } = event.detail;
      setTradeForm({
        ticker: ticker || '',
        action: 'buy',
        quantity: '',
        customPrice: false,
        price: '',
        commission: '',
      });
      setTradeDialogOpen(true);
    };

    window.addEventListener('openPortfolioTrade', handleTradeRequest);
    
    return () => {
      window.removeEventListener('openPortfolioTrade', handleTradeRequest);
    };
  }, []);

  useEffect(() => {
    if (portfolio && portfolio.positions) {
      const tickers = Object.keys(portfolio.positions);
      if (tickers.length > 0) {
        fetchCurrentPrices(tickers);
      }
    }
  }, [portfolio]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const [portfolioResponse, statsResponse] = await Promise.all([
        portfolioAPI.getPortfolio(),
        portfolioAPI.getPortfolioStats()
      ]);
      
      setPortfolio(portfolioResponse.data.data);
      setPortfolioStats(statsResponse.data.data);
      
      // Convert positions object to array with additional calculations
      if (portfolioResponse.data.data.positions) {
        const positionsArray = Object.entries(portfolioResponse.data.data.positions).map(([ticker, position]) => ({
          ticker,
          ...position,
        }));
        setPositions(positionsArray);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load portfolio',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPrices = async (tickers) => {
    try {
      setRefreshingPrices(true);
      const pricePromises = tickers.map(async (ticker) => {
        try {
          const response = await stockAPI.getStockInfo(ticker);
          return { 
            ticker, 
            price: response.data.current_price || response.data.close_prices?.[response.data.close_prices.length - 1] || 0,
            logo: response.data.logo,
            company_name: response.data.company_name
          };
        } catch (error) {
          console.error(`Error fetching price for ${ticker}:`, error);
          return { ticker, price: 0, logo: null, company_name: ticker };
        }
      });

      const priceResults = await Promise.all(pricePromises);
      const pricesMap = {};
      priceResults.forEach(({ ticker, price, logo, company_name }) => {
        pricesMap[ticker] = { price, logo, company_name };
      });
      
      setCurrentPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching current prices:', error);
    } finally {
      setRefreshingPrices(false);
    }
  };

  const handleTradeSubmit = async () => {
    // Validate form
    const errors = {};
    if (!tradeForm.ticker.trim()) errors.ticker = 'Ticker is required';
    if (!tradeForm.quantity || tradeForm.quantity <= 0) errors.quantity = 'Quantity must be positive';
    
    if (tradeForm.customPrice && (!tradeForm.price || tradeForm.price <= 0)) {
      errors.price = 'Price must be positive';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      let price = tradeForm.price;
      
      // If not custom price, use live price when available, otherwise fetch current price
      if (!tradeForm.customPrice) {
        // First try to use live WebSocket price
        const livePrice = livePrices[tradeForm.ticker.toUpperCase()]?.price;
        if (livePrice && livePrice > 0) {
          price = livePrice;
          console.log(`Using live WebSocket price for ${tradeForm.ticker}: $${price}`);
        } else {
          // Fallback to API fetch
          try {
            const response = await stockAPI.getStockInfo(tradeForm.ticker.toUpperCase());
            price = response.data.current_price || response.data.close_prices?.[response.data.close_prices.length - 1];
            if (!price) {
              setSnackbar({
                open: true,
                message: 'Could not fetch current price. Please use custom price.',
                severity: 'error'
              });
              return;
            }
            console.log(`Using API price for ${tradeForm.ticker}: $${price}`);
          } catch (error) {
            setSnackbar({
              open: true,
              message: 'Invalid ticker symbol or could not fetch price',
              severity: 'error'
            });
            return;
          }
        }
      }

      const commission = parseFloat(tradeForm.commission) || 0;

      const response = await portfolioAPI.executeTrade(
        tradeForm.ticker.toUpperCase(),
        tradeForm.action,
        parseInt(tradeForm.quantity),
        parseFloat(price),
        commission
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });

      // Reset form and close dialog
      setTradeForm({
        ticker: '',
        action: 'buy',
        quantity: '',
        customPrice: false,
        price: '',
        commission: '',
      });
      setFormErrors({});
      setTradeDialogOpen(false);
      
      // Reload portfolio
      loadPortfolio();
      
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Trade failed',
        severity: 'error'
      });
    }
  };

  const loadTradeHistory = async () => {
    try {
      const response = await portfolioAPI.getTradeHistory();
      // Sort trades by date/time - most recent first
      const sortedTrades = (response.data.data || []).sort((a, b) => {
        // Create comparable date strings
        const dateA = new Date(`${a.trade_date || a.timestamp} ${a.trade_time || ''}`);
        const dateB = new Date(`${b.trade_date || b.timestamp} ${b.trade_time || ''}`);
        
        // Sort by most recent first (descending order)
        return dateB.getTime() - dateA.getTime();
      });
      
      setTradeHistory(sortedTrades);
    } catch (error) {
      console.error('Error loading trade history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load trade history',
        severity: 'error'
      });
    }
  };

  const loadPnLBreakdown = async () => {
    try {
      const response = await portfolioAPI.getPnLBreakdown();
      setPnlBreakdown(response.data.data);
    } catch (error) {
      console.error('Error loading P&L breakdown:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load P&L breakdown',
        severity: 'error'
      });
    }
  };

  const handleExportTrades = async () => {
    try {
      const response = await portfolioAPI.exportTradeHistory();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trading_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({
        open: true,
        message: 'Trade history exported successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting trade history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export trade history',
        severity: 'error'
      });
    }
  };

  const handleHistoryOpen = () => {
    setHistoryDialogOpen(true);
    loadTradeHistory();
  };

  const handlePnLOpen = () => {
    setPnlDialogOpen(true);
    loadPnLBreakdown();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculatePortfolioStats = () => {
    if (!portfolio) return null;

    let totalValue = portfolio.cash || 0;
    let totalInvested = 0;
    let totalCurrentValue = 0;
    const positionBreakdown = [];

    // If we have positions, calculate their values
    if (positions && positions.length > 0) {
      positions.forEach(position => {
        // Use live price if available, otherwise fall back to static price
        const livePrice = livePrices[position.ticker]?.price;
        const currentPrice = livePrice || currentPrices[position.ticker]?.price || 0;
        
        const invested = position.quantity * position.avg_price;
        const currentValue = position.quantity * currentPrice;
        
        totalInvested += invested;
        totalCurrentValue += currentValue;
        totalValue += currentValue;

        // Add to position breakdown for composition
        positionBreakdown.push({
          ticker: position.ticker,
          currentValue,
          percentage: 0, // Will calculate after totalValue is known
          pl: currentValue - invested,
          plPercent: invested > 0 ? ((currentValue - invested) / invested) * 100 : 0
        });
      });
    }

    // Calculate percentages for composition
    positionBreakdown.forEach(pos => {
      pos.percentage = totalValue > 0 ? (pos.currentValue / totalValue) * 100 : 0;
    });

    // Calculate unrealized P&L (from current positions)
    const unrealizedPL = totalCurrentValue - totalInvested;
    const unrealizedPLPercent = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;
    
    // Get realized P&L from backend stats (fallback to 0 if not available)
    const realizedPL = portfolioStats?.total_realized_pnl || 0;
    
    // Calculate total P&L (realized + unrealized)
    const totalPL = realizedPL + unrealizedPL;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    
    // Calculate total return from initial investment
    const initialValue = portfolioStats?.initial_value || 100000;
    const totalReturn = totalValue - initialValue + realizedPL;
    const totalReturnPercent = (totalReturn / initialValue) * 100;

    return {
      cash: portfolio.cash || 0,
      totalInvested,
      totalCurrentValue,
      unrealizedPL,
      unrealizedPLPercent,
      realizedPL,
      totalPL,
      totalPLPercent,
      totalValue,
      totalReturn,
      totalReturnPercent,
      positionBreakdown: positionBreakdown.sort((a, b) => b.currentValue - a.currentValue),
      cashPercentage: totalValue > 0 ? ((portfolio.cash || 0) / totalValue) * 100 : 100
    };
  };

  const stats = calculatePortfolioStats();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', mb: 3 }}>
          Loading Portfolio...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
            My Portfolio
          </Typography>
          {liveCount > 0 && (
            <Chip
              label={`${liveCount} Live Updates`}
              size="small"
              sx={{
                mt: 1,
                background: 'rgba(76, 175, 80, 0.2)',
                color: '#4CAF50',
                border: '1px solid #4CAF50',
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={handleHistoryOpen}
            sx={{ color: '#36D1DC', borderColor: '#36D1DC' }}
          >
            Trade History
          </Button>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
            onClick={handlePnLOpen}
            sx={{ color: '#FF6B6B', borderColor: '#FF6B6B' }}
          >
            P&L Analysis
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchCurrentPrices(Object.keys(portfolio.positions || {}))}
            disabled={refreshingPrices}
            sx={{ color: '#5B86E5', borderColor: '#5B86E5' }}
          >
            {refreshingPrices ? 'Refreshing...' : 'Refresh Prices'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTradeDialogOpen(true)}
            sx={{ 
              background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
              fontWeight: 600
            }}
          >
            New Trade
          </Button>
        </Box>
      </Box>

      {/* Portfolio Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ color: '#4CAF50', fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {formatCurrency(stats.cash)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Cash Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalance sx={{ color: '#2196F3', fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {formatCurrency(stats.totalInvested)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Invested
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ShowChart sx={{ color: '#FF9800', fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {formatCurrency(stats.totalCurrentValue)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Current Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                {stats.totalPL >= 0 ? (
                  <TrendingUp sx={{ color: '#4CAF50', fontSize: 40, mb: 1 }} />
                ) : (
                  <TrendingDown sx={{ color: '#F44336', fontSize: 40, mb: 1 }} />
                )}
                <Typography variant="h6" sx={{ color: stats.totalPL >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                  {formatCurrency(stats.totalPL)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total P&L
                </Typography>
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="caption" sx={{ color: '#4CAF50', display: 'block' }}>
                    Realized: {formatCurrency(stats.realizedPL)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: stats.unrealizedPL >= 0 ? '#4CAF50' : '#F44336', display: 'block' }}>
                    Unrealized: {formatCurrency(stats.unrealizedPL)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: '#36D1DC', fontSize: 40, mb: 1 }}>💰</Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  {formatCurrency(stats.totalValue)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Portfolio Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: stats.totalReturn >= 0 ? '#4CAF50' : '#F44336', fontSize: 40, mb: 1 }}>
                  {stats.totalReturn >= 0 ? '📈' : '📉'}
                </Box>
                <Typography variant="h6" sx={{ color: stats.totalReturn >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                  {formatCurrency(stats.totalReturn)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Return ({stats.totalReturnPercent >= 0 ? '+' : ''}{stats.totalReturnPercent?.toFixed(2) || '0.00'}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Performance Analytics */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Portfolio Composition Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  📊 Portfolio Composition
                </Typography>
                
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pie
                    data={{
                      labels: [
                        '💵 Cash',
                        ...stats.positionBreakdown.slice(0, 5).map(pos => pos.ticker)
                      ],
                      datasets: [
                        {
                          data: [
                            stats.cashPercentage,
                            ...stats.positionBreakdown.slice(0, 5).map(pos => pos.percentage)
                          ],
                          backgroundColor: [
                            '#4CAF50',
                            '#36D1DC',
                            '#5B86E5',
                            '#FF9800',
                            '#E91E63',
                            '#9C27B0'
                          ],
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          borderWidth: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            color: 'white',
                            font: {
                              size: 12
                            },
                            padding: 15
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(26, 32, 44, 0.9)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderWidth: 1,
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              return `${label}: ${value?.toFixed(1) || '0.0'}%`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </Box>

                {/* Legend with values */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    Top Holdings:
                  </Typography>
                  {stats.positionBreakdown.slice(0, 3).map((position, index) => (
                    <Box key={position.ticker} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {position.ticker}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formatCurrency(position.currentValue)} ({position.percentage?.toFixed(1) || '0.0'}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                  Performance Analytics
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" sx={{ color: stats.totalPL >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                        {stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent?.toFixed(2) || '0.00'}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Today's P&L
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" sx={{ color: stats.totalReturn >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                        {stats.totalReturnPercent >= 0 ? '+' : ''}{stats.totalReturnPercent?.toFixed(2) || '0.00'}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Total Return
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                        {formatCurrency(stats.totalCurrentValue)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Invested Value
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                        {positions.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Holdings
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Holdings Table */}
      <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
            Your Holdings
          </Typography>
          
          {positions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                No holdings yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 3 }}>
                Start by making your first trade!
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setTradeDialogOpen(true)}
                sx={{ background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)' }}
              >
                Make First Trade
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Stock</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Quantity</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Avg. Price</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Current Price</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Current Value</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>P&L</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>P&L %</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position) => {
                    // Use live price if available, otherwise fall back to static price
                    const livePrice = livePrices[position.ticker]?.price;
                    const currentPrice = livePrice || currentPrices[position.ticker]?.price || 0;
                    const isLive = !!livePrice;
                    
                    const currentValue = position.quantity * currentPrice;
                    const invested = position.quantity * position.avg_price;
                    const pl = currentValue - invested;
                    const plPercent = invested > 0 ? (pl / invested) * 100 : 0;
                    const companyInfo = currentPrices[position.ticker];

                    return (
                      <TableRow key={position.ticker} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {companyInfo?.logo && (
                              <Avatar
                                src={companyInfo.logo}
                                sx={{ width: 32, height: 32, bgcolor: 'white' }}
                              >
                                {position.ticker[0]}
                              </Avatar>
                            )}
                            <Box>
                              <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                                {position.ticker}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {companyInfo?.company_name || position.ticker}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>{formatNumber(position.quantity)}</TableCell>
                        <TableCell sx={{ color: 'white' }}>{formatCurrency(position.avg_price)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              sx={{ 
                                color: isLive ? '#4CAF50' : 'white',
                                fontWeight: isLive ? 600 : 400
                              }}
                            >
                              {currentPrice ? formatCurrency(currentPrice) : 'Loading...'}
                            </Typography>
                            {isLive && (
                              <Chip
                                label="LIVE"
                                size="small"
                                sx={{
                                  background: 'rgba(76, 175, 80, 0.2)',
                                  color: '#4CAF50',
                                  border: '1px solid #4CAF50',
                                  fontSize: '0.65rem',
                                  height: '16px',
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>{formatCurrency(currentValue)}</TableCell>
                        <TableCell sx={{ color: pl >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                          {formatCurrency(pl)}
                        </TableCell>
                        <TableCell sx={{ color: pl >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                          {pl >= 0 ? '+' : ''}{plPercent?.toFixed(2) || '0.00'}%
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Buy More">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setTradeForm({
                                    ...tradeForm,
                                    ticker: position.ticker,
                                    action: 'buy'
                                  });
                                  setTradeDialogOpen(true);
                                }}
                                sx={{ color: '#4CAF50' }}
                              >
                                <Add />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sell">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setTradeForm({
                                    ...tradeForm,
                                    ticker: position.ticker,
                                    action: 'sell'
                                  });
                                  setTradeDialogOpen(true);
                                }}
                                sx={{ color: '#F44336' }}
                              >
                                <Remove />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <Dialog
        open={tradeDialogOpen}
        onClose={() => setTradeDialogOpen(false)}
        maxWidth="sm"
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
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          📈 Execute Trade
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ticker Symbol"
                value={tradeForm.ticker}
                onChange={(e) => setTradeForm({ ...tradeForm, ticker: e.target.value.toUpperCase() })}
                error={!!formErrors.ticker}
                helperText={formErrors.ticker}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#36D1DC' },
                    '&.Mui-focused fieldset': { borderColor: '#36D1DC' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Action</InputLabel>
                <Select
                  value={tradeForm.action}
                  onChange={(e) => setTradeForm({ ...tradeForm, action: e.target.value })}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#36D1DC' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#36D1DC' },
                  }}
                >
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={tradeForm.quantity}
                onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                error={!!formErrors.quantity}
                helperText={formErrors.quantity}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#36D1DC' },
                    '&.Mui-focused fieldset': { borderColor: '#36D1DC' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Use Market Price
                </Typography>
                <Button
                  size="small"
                  variant={!tradeForm.customPrice ? 'contained' : 'outlined'}
                  onClick={() => setTradeForm({ ...tradeForm, customPrice: false, price: '' })}
                  sx={{ color: '#36D1DC', borderColor: '#36D1DC' }}
                >
                  Market
                </Button>
                <Button
                  size="small"
                  variant={tradeForm.customPrice ? 'contained' : 'outlined'}
                  onClick={() => setTradeForm({ ...tradeForm, customPrice: true })}
                  sx={{ color: '#5B86E5', borderColor: '#5B86E5' }}
                >
                  Custom
                </Button>
              </Box>
              
              {/* Display current live price when available */}
              {tradeForm.ticker && livePrices[tradeForm.ticker.toUpperCase()] && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Live Price for {tradeForm.ticker.toUpperCase()}:
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                    ${formatNumber(livePrices[tradeForm.ticker.toUpperCase()].price)}
                  </Typography>
                  {!tradeForm.customPrice && (
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      This live price will be used for market orders
                    </Typography>
                  )}
                </Box>
              )}
              
              {tradeForm.customPrice && (
                <TextField
                  fullWidth
                  label="Price per Share"
                  type="number"
                  step="0.01"
                  value={tradeForm.price}
                  onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                  error={!!formErrors.price}
                  helperText={formErrors.price}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&:hover fieldset': { borderColor: '#36D1DC' },
                      '&.Mui-focused fieldset': { borderColor: '#36D1DC' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  }}
                />
              )}
              
              <TextField
                fullWidth
                label="Commission (optional)"
                type="number"
                step="0.01"
                value={tradeForm.commission}
                onChange={(e) => setTradeForm({ ...tradeForm, commission: e.target.value })}
                helperText="Trading commission and fees"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#36D1DC' },
                    '&.Mui-focused fieldset': { borderColor: '#36D1DC' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button onClick={() => setTradeDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleTradeSubmit}
            sx={{ 
              background: `linear-gradient(45deg, ${tradeForm.action === 'buy' ? '#4CAF50' : '#F44336'} 30%, ${tradeForm.action === 'buy' ? '#2E7D32' : '#C62828'} 90%)`,
              fontWeight: 600
            }}
          >
            {tradeForm.action === 'buy' ? 'Buy' : 'Sell'} {tradeForm.ticker}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trade History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
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
          <Typography variant="h6">📈 Trade History</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              onClick={handleExportTrades}
              sx={{
                color: '#36D1DC',
                borderColor: '#36D1DC',
                '&:hover': {
                  borderColor: '#4B9BFF',
                  backgroundColor: 'rgba(75, 155, 255, 0.1)'
                }
              }}
            >
              Export CSV
            </Button>
            <IconButton onClick={() => setHistoryDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {tradeHistory.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No trades yet
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Date/Time</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Symbol</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Side</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Qty</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Price</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Commission</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Realized P&L</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Net Value</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Exchange</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradeHistory.map((trade, index) => (
                    <TableRow key={trade.trade_id || index} sx={{ bgcolor: 'rgba(26, 32, 44, 0.5)' }}>
                      <TableCell sx={{ color: 'white', fontSize: '0.8rem' }}>
                        {trade.trade_date || new Date(trade.timestamp).toLocaleDateString()}
                        <br />
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          {trade.trade_time || new Date(trade.timestamp).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                        {trade.symbol || trade.ticker}
                        <br />
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          {trade.market_sector || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.side || trade.action?.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: (trade.side === 'BUY' || trade.action === 'buy') ? '#4CAF50' : '#F44336',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{formatNumber(trade.quantity)}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{formatCurrency(trade.price)}</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {formatCurrency(trade.commission || 0)}
                      </TableCell>
                      <TableCell sx={{ 
                        color: trade.realized_pnl > 0 ? '#4CAF50' : trade.realized_pnl < 0 ? '#F44336' : 'white',
                        fontWeight: 600 
                      }}>
                        {trade.realized_pnl ? formatCurrency(trade.realized_pnl) : '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                        {formatCurrency(trade.net_value || trade.value)}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                        {trade.exchange || 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* P&L Breakdown Dialog */}
      <Dialog
        open={pnlDialogOpen}
        onClose={() => setPnlDialogOpen(false)}
        maxWidth="lg"
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
          <Typography variant="h6">📊 P&L Analysis - Trade Matching</Typography>
          <IconButton onClick={() => setPnlDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {pnlBreakdown.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No sell trades with P&L yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1 }}>
                Execute some buy and sell trades to see detailed P&L analysis
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {pnlBreakdown.map((pnl, index) => (
                <Card key={index} sx={{ 
                  mb: 2, 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="SELL" 
                          size="small" 
                          sx={{ bgcolor: '#F44336', color: 'white', fontWeight: 600 }}
                        />
                        {pnl.symbol} - {pnl.sell_quantity} shares
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: pnl.realized_pnl > 0 ? '#4CAF50' : '#F44336',
                          fontWeight: 600 
                        }}
                      >
                        {formatCurrency(pnl.realized_pnl)}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          Sell Trade Details
                        </Typography>
                        <Box sx={{ p: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', borderRadius: 1, border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                            <strong>Date:</strong> {pnl.sell_date}
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                            <strong>Price:</strong> {formatCurrency(pnl.sell_price)}
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                            <strong>Quantity:</strong> {formatNumber(pnl.sell_quantity)}
                          </Typography>
                          <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                            <strong>Total:</strong> {formatCurrency(pnl.sell_price * pnl.sell_quantity)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          Matched Buy Trades
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                          {pnl.matched_buys.map((buy, buyIndex) => (
                            <Box 
                              key={buyIndex} 
                              sx={{ 
                                p: 1.5, 
                                mb: 1, 
                                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                borderRadius: 1,
                                border: '1px solid rgba(76, 175, 80, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <Link sx={{ color: '#4CAF50', fontSize: '1rem' }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ color: 'white', fontSize: '0.8rem' }}>
                                  {buy.buy_date} - {formatCurrency(buy.buy_price)} × {formatNumber(buy.buy_quantity)}
                                </Typography>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                                  ID: {buy.buy_trade_id.substring(0, 8)}...
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        Total Commissions: {formatCurrency(pnl.commission_total)}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        Trade ID: {pnl.sell_trade_id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            backgroundColor: snackbar.severity === 'success' ? '#4CAF50' : '#f44336',
            color: 'white'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Portfolio;
