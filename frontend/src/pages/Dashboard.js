import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import StockChart from '../components/StockChart';
import StockMetrics from '../components/StockMetrics';
import AIInsights from '../components/AIInsights';
import { stockAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MotionCard = motion(Card);

const Dashboard = () => {
  const { user } = useAuth();
  const [tickersInput, setTickersInput] = useState('TSLA');
  const [tickers, setTickers] = useState(['TSLA']);
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'month'));
  const [endDate, setEndDate] = useState(dayjs());
  const [investorLevel, setInvestorLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState({});
  const [analysisData, setAnalysisData] = useState({});

  const handleAnalyze = async () => {
    if (!tickersInput.trim()) return;

    setLoading(true);
    const tickerList = tickersInput.toUpperCase().split(',').map(t => t.trim()).filter(t => t);
    setTickers(tickerList);

    try {
      const promises = tickerList.map(async (ticker) => {
        const [stockRes, newsRes, sentimentRes] = await Promise.all([
          stockAPI.getStockData(ticker, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')),
          stockAPI.getStockNews(ticker),
          stockAPI.getNewsSentiment(ticker),
        ]);

        return {
          ticker,
          data: stockRes.data,
          news: newsRes.data,
          sentiment: sentimentRes.data,
        };
      });

      const results = await Promise.all(promises);
      const newStockData = {};
      const newAnalysisData = {};

      results.forEach(result => {
        newStockData[result.ticker] = result.data;
        newAnalysisData[result.ticker] = {
          news: result.news,
          sentiment: result.sentiment,
        };
      });

      setStockData(newStockData);
      setAnalysisData(newAnalysisData);

      // Get AI analysis
      if (tickerList.length === 1) {
        const aiRes = await stockAPI.getAIAnalysis(tickerList[0], investorLevel);
        setAnalysisData(prev => ({
          ...prev,
          [tickerList[0]]: {
            ...prev[tickerList[0]],
            aiAnalysis: aiRes.data,
          },
        }));
      } else if (tickerList.length === 2) {
        const comparisonRes = await stockAPI.getAIComparison(tickerList[0], tickerList[1], investorLevel);
        setAnalysisData(prev => ({
          ...prev,
          comparison: comparisonRes.data,
        }));
      }

      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to fetch stock data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h3"
        sx={{
          mb: 1,
          background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
        }}
      >
        QuantView AI
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
        Welcome, {user?.email}!
      </Typography>

      {/* Controls */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          mb: 4,
          background: 'rgba(26, 32, 44, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Stock Tickers"
                value={tickersInput}
                onChange={(e) => setTickersInput(e.target.value)}
                placeholder="e.g., AAPL,MSFT"
                helperText="Separate multiple tickers with commas"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#36D1DC' },
                    '&.Mui-focused fieldset': { borderColor: '#36D1DC' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' },
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Investor Level
                </InputLabel>
                <Select
                  value={investorLevel}
                  onChange={(e) => setInvestorLevel(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#36D1DC',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#36D1DC',
                    },
                  }}
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAnalyze}
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 5px 15px rgba(54, 209, 220, 0.3)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze Stocks'}
              </Button>
            </Grid>
          </Grid>

          {tickers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {tickers.map((ticker) => (
                <Chip
                  key={ticker}
                  label={ticker}
                  sx={{
                    mr: 1,
                    mb: 1,
                    background: 'rgba(54, 209, 220, 0.2)',
                    color: '#36D1DC',
                    border: '1px solid #36D1DC',
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* Charts and Analysis */}
      {Object.keys(stockData).length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StockChart stockData={stockData} />
          </Grid>

          {tickers.map((ticker) => (
            <Grid item xs={12} md={6} key={ticker}>
              <StockMetrics 
                ticker={ticker} 
                data={stockData[ticker]} 
                analysis={analysisData[ticker]} 
              />
            </Grid>
          ))}

          {analysisData.comparison && (
            <Grid item xs={12}>
              <AIInsights data={analysisData.comparison} type="comparison" />
            </Grid>
          )}

          {tickers.length === 1 && analysisData[tickers[0]]?.aiAnalysis && (
            <Grid item xs={12}>
              <AIInsights 
                data={analysisData[tickers[0]].aiAnalysis} 
                type="single" 
                ticker={tickers[0]}
              />
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;
