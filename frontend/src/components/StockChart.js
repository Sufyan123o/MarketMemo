import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import Plot from 'react-plotly.js';

const StockChart = ({ stockData }) => {
  if (!stockData || Object.keys(stockData).length === 0) {
    return null;
  }

  const traces = Object.keys(stockData).map((ticker, index) => {
    const data = stockData[ticker];
    const colors = ['#36D1DC', '#5B86E5', '#8A2BE2', '#FF6B6B'];
    
    return {
      x: data.dates,
      y: data.normalized_prices || data.close_prices,
      type: 'scatter',
      mode: 'lines',
      name: ticker,
      line: {
        color: colors[index % colors.length],
        width: 3,
      },
    };
  });

  const layout = {
    title: {
      text: 'Stock Price Comparison',
      font: { color: 'white', size: 18 },
    },
    xaxis: {
      title: 'Date',
      color: 'white',
      gridcolor: 'rgba(255, 255, 255, 0.1)',
    },
    yaxis: {
      title: Object.keys(stockData).length > 1 ? 'Normalized Price' : 'Price ($)',
      color: 'white',
      gridcolor: 'rgba(255, 255, 255, 0.1)',
    },
    paper_bgcolor: 'rgba(26, 32, 44, 0.9)',
    plot_bgcolor: 'rgba(26, 32, 44, 0.9)',
    font: { color: 'white' },
    legend: {
      font: { color: 'white' },
    },
    margin: { l: 60, r: 60, t: 60, b: 60 },
  };

  return (
    <Card sx={{ 
      background: 'rgba(26, 32, 44, 0.9)', 
      border: '1px solid rgba(255, 255, 255, 0.1)' 
    }}>
      <CardContent>
        <Plot
          data={traces}
          layout={layout}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '400px' }}
        />
      </CardContent>
    </Card>
  );
};

export default StockChart;
