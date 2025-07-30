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
} from '@mui/icons-material';
import { portfolioAPI, stockAPI } from '../services/api';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [tradeHistory, setTradeHistory] = useState([]);
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
  });

  const [formErrors, setFormErrors] = useState({});

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
      const response = await portfolioAPI.getPortfolio();
      setPortfolio(response.data.data);
      
      // Convert positions object to array with additional calculations
      if (response.data.data.positions) {
        const positionsArray = Object.entries(response.data.data.positions).map(([ticker, position]) => ({
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
      
      // If not custom price, fetch current price
      if (!tradeForm.customPrice) {
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
        } catch (error) {
          setSnackbar({
            open: true,
            message: 'Invalid ticker symbol or could not fetch price',
            severity: 'error'
          });
          return;
        }
      }

      const response = await portfolioAPI.executeTrade(
        tradeForm.ticker.toUpperCase(),
        tradeForm.action,
        parseInt(tradeForm.quantity),
        parseFloat(price)
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
      setTradeHistory(response.data.data);
    } catch (error) {
      console.error('Error loading trade history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load trade history',
        severity: 'error'
      });
    }
  };

  const handleHistoryOpen = () => {
    setHistoryDialogOpen(true);
    loadTradeHistory();
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
    if (!portfolio || !positions.length) return null;

    let totalValue = portfolio.cash;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    positions.forEach(position => {
      const currentPrice = currentPrices[position.ticker]?.price || 0;
      const invested = position.quantity * position.avg_price;
      const currentValue = position.quantity * currentPrice;
      
      totalInvested += invested;
      totalCurrentValue += currentValue;
      totalValue += currentValue;
    });

    const totalPL = totalCurrentValue - totalInvested;
    const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
      cash: portfolio.cash,
      totalInvested,
      totalCurrentValue,
      totalPL,
      totalPLPercent,
      totalValue
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
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
          My Portfolio
        </Typography>
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
                  P&L ({stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent.toFixed(2)}%)
                </Typography>
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
        </Grid>
      )}

      {/* Holdings Table */}
      <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
            📊 Your Holdings
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
                    const currentPrice = currentPrices[position.ticker]?.price || 0;
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
                        <TableCell sx={{ color: 'white' }}>
                          {currentPrice ? formatCurrency(currentPrice) : 'Loading...'}
                        </TableCell>
                        <TableCell sx={{ color: 'white' }}>{formatCurrency(currentValue)}</TableCell>
                        <TableCell sx={{ color: pl >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                          {formatCurrency(pl)}
                        </TableCell>
                        <TableCell sx={{ color: pl >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                          {pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
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
          <IconButton onClick={() => setHistoryDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close />
          </IconButton>
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
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Date</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Symbol</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Action</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Quantity</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Price</TableCell>
                    <TableCell sx={{ bgcolor: 'rgba(26, 32, 44, 0.9)', color: 'rgba(255, 255, 255, 0.7)' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradeHistory.map((trade, index) => (
                    <TableRow key={index} sx={{ bgcolor: 'rgba(26, 32, 44, 0.5)' }}>
                      <TableCell sx={{ color: 'white' }}>
                        {new Date(trade.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                        {trade.ticker}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.action.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: trade.action === 'buy' ? '#4CAF50' : '#F44336',
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{formatNumber(trade.quantity)}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{formatCurrency(trade.price)}</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                        {formatCurrency(trade.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
