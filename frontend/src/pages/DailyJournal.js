import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  NavigateNext,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import dayjs from 'dayjs';
import { portfolioAPI } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DailyJournal = () => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [selectedDateRange] = useState('Jul 31 - Aug 4, 2025');

  useEffect(() => {
    loadDailyJournalData();
  }, []);

  const loadDailyJournalData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading portfolio data for Daily Journal...');

      const response = await portfolioAPI.getPortfolio();
      console.log('📊 Full Portfolio response:', response);
      console.log('📊 Response.data:', response.data);
      console.log('📊 Response.data keys:', Object.keys(response.data || {}));
      console.log('📊 Response.data.data:', response.data?.data);
      console.log('📊 Response.data.data keys:', Object.keys(response.data?.data || {}));
      console.log('📊 Response.data.data.trades type:', typeof response.data?.data?.trades);
      console.log('📊 Response.data.data.trades value:', response.data?.data?.trades);
      console.log('📈 Response structure:', {
        hasData: !!response.data,
        hasNestedData: !!response.data?.data,
        hasTrades: !!response.data?.data?.trades,
        tradesLength: response.data?.data?.trades?.length || 0,
        sampleTrade: response.data?.data?.trades?.[0],
      });

      // Fix: Access trades from the correct nested path
      const trades = response.data?.data?.trades;
      if (trades?.length > 0) {
        console.log('✅ Found trades, processing...');

        const tradesByDate = {};
        trades.forEach(trade => {
          const date = trade.trade_date;
          if (!tradesByDate[date]) {
            tradesByDate[date] = {
              date,
              trades: [],
              totalPnL: 0,
              winners: 0,
              losers: 0,
              totalTrades: 0,
              lots: 0,
              gain: 0,
              profitFactor: 0,
            };
          }
          tradesByDate[date].trades.push(trade);
          tradesByDate[date].totalPnL += trade.realized_pnl || 0;
          tradesByDate[date].totalTrades += 1;
          tradesByDate[date].lots += trade.quantity || 0;
          if ((trade.realized_pnl || 0) >= 0) {
            tradesByDate[date].winners += 1;
          } else {
            tradesByDate[date].losers += 1;
          }
        });

        Object.values(tradesByDate).forEach(dayData => {
          const totalWins = dayData.trades
            .filter(t => (t.realized_pnl || 0) >= 0)
            .reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
          const totalLosses = Math.abs(
            dayData.trades
              .filter(t => (t.realized_pnl || 0) < 0)
              .reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
          );
          dayData.profitFactor =
            totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
          dayData.gain = (dayData.totalPnL / 100000) * 100;
        });

        const targetDates = [
          '2025-07-31',
          '2025-08-01',
          '2025-08-02',
          '2025-08-03',
          '2025-08-04',
        ];

        const filteredDays = Object.values(tradesByDate)
          .filter(dayData => targetDates.includes(dayData.date))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log('✅ Filtered daily data:', filteredDays);
        console.log('📊 Final data count:', filteredDays.length);

        if (filteredDays.length > 0) {
          console.log('🎉 Setting real data with', filteredDays.length, 'days');
          setDailyData(filteredDays);
        } else {
          console.log('⚠️ No trades found in target date range, using mock data');
          setDailyData(getMockData());
        }
      } else {
        console.log('❌ No trades found in API response, using mock data');
        setDailyData(getMockData());
      }
    } catch (error) {
      console.error('💥 Error loading daily journal data:', error);
      console.log('🔄 Falling back to mock data');
      setDailyData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => [
    {
      date: '2025-08-01',
      trades: [
        { realized_pnl: 1200, quantity: 100, symbol: 'AAPL' },
        { realized_pnl: 800, quantity: 50, symbol: 'MSFT' },
        { realized_pnl: -300, quantity: 75, symbol: 'TSLA' },
      ],
      totalPnL: 2134.74,
      winners: 4,
      losers: 2,
      totalTrades: 8,
      lots: 5,
      gain: 8.5,
      profitFactor: 1.96,
    },
    {
      date: '2025-08-02',
      trades: [
        { realized_pnl: -800, quantity: 100, symbol: 'AAPL' },
        { realized_pnl: -484.93, quantity: 50, symbol: 'TSLA' }
      ],
      totalPnL: -1284.93,
      winners: 4,
      losers: 1,
      totalTrades: 3,
      lots: 2.0,
      gain: 23.64,
      profitFactor: 2.94,
    },
    {
      date: '2025-08-03',
      trades: [
        { realized_pnl: 1000, quantity: 100, symbol: 'AAPL' },
        { realized_pnl: 754.83, quantity: 20, symbol: 'NVDA' }
      ],
      totalPnL: 1754.83,
      winners: 82,
      losers: 32,
      totalTrades: 120,
      lots: 8,
      gain: 3.64,
      profitFactor: 5.34,
    },
    {
      date: '2025-08-04',
      trades: [
        { realized_pnl: 500, quantity: 50, symbol: 'GOOGL' }
      ],
      totalPnL: 892.45,
      winners: 15,
      losers: 8,
      totalTrades: 25,
      lots: 3,
      gain: 2.1,
      profitFactor: 3.2,
    }
  ];

  const formatCurrency = amount => {
    const abs = Math.abs(amount);
    if (abs >= 1000) return `${amount >= 0 ? '+' : '-'}$${(abs / 1000).toFixed(2)}k`;
    return `${amount >= 0 ? '+' : ''}$${amount.toFixed(2)}`;
  };

  const generateChartData = trades => {
    let cumulative = 0;
    const data = trades.map(t => (cumulative += t.realized_pnl || 0));
    return {
      labels: trades.map((_, i) => i + 1),
      datasets: [
        {
          data,
          borderColor: cumulative >= 0 ? '#4CAF50' : '#f44336',
          backgroundColor:
            cumulative >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography sx={{ color: '#36D1DC' }}>Loading daily journal...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header & Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton sx={{ mr: 1, color: '#36D1DC' }} onClick={() => window.history.back()}>
            <ArrowBack />
          </IconButton>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Link underline="hover" color="inherit" href="/journal">Dashboard</Link>
            <Typography color="#36D1DC">Daily Journal</Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: '#36D1DC', fontWeight: 700 }}>
            Daily Journal
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {selectedDateRange}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>        
        <Grid item xs={12} md={3}>
          {/* Calendar sidebar */}
          <Card sx={{ 
            backgroundColor: 'rgba(15, 20, 25, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mb: 2
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2, textAlign: 'center' }}>
                August 2025
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Typography key={day} variant="caption" sx={{ 
                    textAlign: 'center', 
                    p: 0.5, 
                    fontWeight: 600, 
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 10
                  }}>
                    {day}
                  </Typography>
                ))}
                
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const hasData = [31].includes(day) || [1, 2, 3, 4].includes(day);
                  const isSelected = [31].includes(day) || [1, 2, 3, 4].includes(day);
                  
                  return (
                    <Box
                      key={day}
                      sx={{
                        minHeight: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 0.5,
                        backgroundColor: isSelected ? '#36D1DC' : 
                          hasData ? 'rgba(54, 209, 220, 0.2)' : 'transparent',
                        color: isSelected ? '#000' : '#fff',
                        cursor: hasData ? 'pointer' : 'default',
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 400,
                        '&:hover': hasData ? { backgroundColor: 'rgba(54, 209, 220, 0.3)' } : {}
                      }}
                    >
                      {day <= 31 ? day : ''}
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {/* Debug info */}
          <Box sx={{ mb: 2, p: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: '#36D1DC', fontWeight: 600 }}>
              Debug Info:
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff' }}>
              Daily Data Length: {dailyData.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff' }}>
              Loading: {loading.toString()}
            </Typography>
            {dailyData.length > 0 && (
              <Typography variant="body2" sx={{ color: '#fff' }}>
                Sample Date: {dailyData[0]?.date} | Trades: {dailyData[0]?.totalTrades} | P&L: ${dailyData[0]?.totalPnL}
              </Typography>
            )}
          </Box>

          {/* Daily entries */}
          {dailyData.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed rgba(255, 255, 255, 0.3)', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                No daily trading data available
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 1 }}>
                Check browser console for detailed API response
              </Typography>
            </Box>
          ) : (
            dailyData.map((dayData, index) => (
              <Card key={`${dayData.date}-${index}`} sx={{ 
                mb: 3,
                backgroundColor: 'rgba(15, 20, 25, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <CardContent>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    {dayjs(dayData.date).format('dddd, MMM D, YYYY')}
                  </Typography>

                  <Typography variant="h4" sx={{ 
                    color: dayData.totalPnL >= 0 ? '#4CAF50' : '#f44336',
                    fontWeight: 700,
                    mb: 1
                  }}>
                    {formatCurrency(dayData.totalPnL)}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                    Net P&L
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Total Trades
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {dayData.totalTrades}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Winners
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {dayData.winners}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Losers
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {dayData.losers}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Lots
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {dayData.lots}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Gain
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                        {dayData.gain.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Profit Factor
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: dayData.profitFactor >= 1 ? '#4CAF50' : '#f44336', 
                        fontWeight: 600 
                      }}>
                        {dayData.profitFactor.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ width: 300, height: 100 }}>
                      <Line 
                        data={generateChartData(dayData.trades)} 
                        options={chartOptions}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      sx={{
                        background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
                        color: '#fff',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5B86E5 30%, #36D1DC 90%)',
                        }
                      }}
                    >
                      Add notes
                    </Button>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: '#36D1DC',
                        color: '#000',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#5B86E5' }
                      }}
                    >
                      P&L Dynamics Chart
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' }
                      }}
                    >
                      Asset Details and Probability of Success
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default DailyJournal;
