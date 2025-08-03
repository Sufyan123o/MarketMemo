import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API endpoints
export const stockAPI = {
  // Stock data
  getStockData: (ticker, startDate, endDate) =>
    api.get(`/api/stocks/data/${ticker}?start_date=${startDate}&end_date=${endDate}`),
  
  getStockInfo: (ticker) =>
    api.get(`/api/stocks/info/${ticker}`),
  
  // News and sentiment
  getStockNews: (ticker) =>
    api.get(`/api/stocks/news/${ticker}`),
  
  getNewsSentiment: (ticker) =>
    api.get(`/api/stocks/sentiment/${ticker}`),
  
  // AI analysis
  getAIAnalysis: (ticker, investorLevel = 'Beginner') =>
    api.post('/api/stocks/ai/analysis', { ticker, investor_level: investorLevel }),
  
  getAIComparison: (ticker1, ticker2, investorLevel = 'Beginner') =>
    api.post('/api/stocks/ai/comparison', { 
      ticker1, 
      ticker2, 
      investor_level: investorLevel 
    }),
  
  // Price prediction
  getPricePrediction: (ticker) =>
    api.get(`/api/stocks/prediction/${ticker}`),
  
  // Technical analysis
  getTechnicalIndicators: (ticker, startDate, endDate, indicators = []) =>
    api.post('/api/stocks/technical', {
      ticker,
      start_date: startDate,
      end_date: endDate,
      indicators
    }),
  
  // Stock screening
  screenStocks: (prompt) =>
    api.post('/api/stocks/screen', { prompt }),
};

export const authAPI = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (email, password) =>
    api.post('/api/auth/register', { email, password }),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  getProfile: () =>
    api.get('/api/auth/profile'),
};

export const portfolioAPI = {
  getPortfolio: () =>
    api.get('/api/portfolio'),
  
  getPortfolioStats: () =>
    api.get('/api/portfolio/stats'),
  
  executeTrade: (ticker, action, quantity, price, commission = 0) =>
    api.post('/api/portfolio/trade', {
      ticker,
      action,
      quantity,
      price,
      commission
    }),
  
  getTradeHistory: () =>
    api.get('/api/portfolio/trades'),
  
  getPnLBreakdown: () =>
    api.get('/api/portfolio/trades/pnl-breakdown'),
  
  exportTradeHistory: () =>
    api.get('/api/portfolio/trades/export', {
      responseType: 'blob'
    }),
  
  getLivePrice: (ticker) =>
    api.get(`/api/portfolio/live-price/${ticker}`),
  
  resetPortfolio: () =>
    api.delete('/api/portfolio/reset'),
};

export const watchlistAPI = {
  getWatchlist: () =>
    api.get('/api/watchlist'),
  
  addToWatchlist: (ticker) =>
    api.post('/api/watchlist', { ticker }),
  
  removeFromWatchlist: (ticker) =>
    api.delete(`/api/watchlist/${ticker}`),
};

export const playgroundAPI = {
  getPlaygroundPortfolio: () =>
    api.get('/api/playground/portfolio'),
  
  executeTrade: (ticker, quantity, price, action) =>
    api.post('/api/playground/trade', {
      ticker,
      quantity,
      price,
      action
    }),
  
  getHealthReport: () =>
    api.get('/api/playground/health-report'),
};

export default api;
