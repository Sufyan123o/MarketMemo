import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Screener from './pages/Screener';
import Playground from './pages/Playground';
import Journal from './pages/Journal';
import DailyJournal from './pages/DailyJournal';
import Analytics from './pages/Analytics';
import AITradingCoach from './pages/AITradingCoach';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/watchlist" 
          element={user ? <Watchlist /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/portfolio" 
          element={user ? <Portfolio /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/screener" 
          element={user ? <Screener /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/playground" 
          element={user ? <Playground /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/journal" 
          element={user ? <Journal /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/daily-journal" 
          element={user ? <DailyJournal /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/journal-analytics" 
          element={user ? <Analytics /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/ai-trading-coach" 
          element={user ? <AITradingCoach /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
