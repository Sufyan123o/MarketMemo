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
    LinearProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Tab,
    Tabs,
    Avatar,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Upload,
    FileDownload,
    Analytics,
    ShowChart,
    Timeline,
    Assessment,
    Close,
    Refresh,
    CalendarToday,
    Add,
    Edit,
    Info,
    AccountBalance,
    PieChart,
} from '@mui/icons-material';
import { portfolioAPI } from '../services/api';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

const Journal = () => {
    const [tradeHistory, setTradeHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [tabValue, setTabValue] = useState(0);
    const [dateRange, setDateRange] = useState('all');
    const [portfolioStats, setPortfolioStats] = useState({
        totalPnL: 52347.69,
        profitFactor: 2.6,
        winningTrades: 62.5,
        winningDays: 66.7,
        avgWinLoss: 436.23
    });

    // Sample trade data - replace with actual API calls
    const [trades] = useState([
        {
            id: 1,
            time: '8:30 AM',
            date: '01/28/2023',
            symbol: 'BTC/USD',
            side: 'BUY',
            quantity: 0.5,
            price: 65000,
            pnl: 2481.43,
            notes: 'Watching BTC/USD. If the price breaks above 65,000, I will consider a long position'
        },
        {
            id: 2,
            time: '10:30 AM',
            date: '01/28/2023',
            symbol: 'AAPL',
            side: 'BUY',
            quantity: 100,
            price: 175,
            pnl: -1250.45,
            notes: 'Bought 100 shares of AAPL @ $175. Expecting quarterly earnings release in 3 days'
        },
        {
            id: 3,
            time: '11:53 AM',
            date: '01/29/2023',
            symbol: 'ETH',
            side: 'SELL',
            quantity: 2,
            price: 3800,
            pnl: 313.77,
            notes: 'Taking profits on ETH. Resistance at 3,800 - a pullback is possible'
        },
        {
            id: 4,
            time: '12:20 AM',
            date: '01/29/2023',
            symbol: 'AAPL',
            side: 'BUY',
            quantity: 100,
            price: 175,
            pnl: 1894.10,
            notes: 'Bought 100 shares of AAPL @ $175. Expecting quarterly earnings release in 3 days'
        }
    ]);

    // Sample open positions
    const [openPositions] = useState([
        { time: '07/05/2024', symbol: 'EURCHF', side: 'BUY', pnl: 2481.43 },
        { time: '07/04/2024', symbol: 'EURCHF', side: 'SELL', pnl: -1760.42 },
        { time: '07/03/2024', symbol: 'EURCHF', side: 'BUY', pnl: 2652.86 },
        { time: '07/02/2024', symbol: 'EURCHF', side: 'BUY', pnl: 3646.80 }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    const formatPercentage = (value) => {
        return `${value}%`;
    };

    const getTradeColor = (pnl) => {
        return pnl >= 0 ? '#4CAF50' : '#f44336';
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <LinearProgress />
            </Container>
        );
    }

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Load platform trade history
    const loadTradeHistory = async () => {
        try {
            setLoading(true);
            const response = await portfolioAPI.getTradeHistory();
            setTradeHistory(response.data.data || []);
        } catch (error) {
            console.error('Error loading trade history:', error);
            setSnackbar({
                open: true,
                message: 'Failed to load trade history',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Parse CSV file
    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const trades = [];

        for (let i = 1; i < lines.length; i++) {
            const values = [];
            let currentValue = '';
            let inQuotes = false;

            for (let j = 0; j < lines[i].length; j++) {
                const char = lines[i][j];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());

            if (values.length === headers.length) {
                const trade = {};
                headers.forEach((header, index) => {
                    trade[header] = values[index];
                });
                trades.push(trade);
            }
        }

        return trades;
    };

    // Handle CSV import
    const handleImport = async () => {
        if (!importFile) return;

        setImporting(true);
        try {
            const text = await importFile.text();
            const trades = parseCSV(text);

            // Validate that this looks like our trade format
            const requiredFields = ['trade_id', 'symbol', 'side', 'quantity', 'price', 'trade_date'];
            const hasRequiredFields = requiredFields.every(field =>
                trades.length > 0 && trades[0].hasOwnProperty(field)
            );

            if (!hasRequiredFields) {
                throw new Error('Invalid CSV format. Please use the export format from this platform.');
            }

            setImportedTrades(trades);
            setImportDialogOpen(false);
            setSnackbar({
                open: true,
                message: `Successfully imported ${trades.length} trades`,
                severity: 'success'
            });
        } catch (error) {
            setSnackbar({
                open: true,
                message: `Import failed: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setImporting(false);
        }
    };

    // Calculate cumulative P&L over time
    const calculateCumulativePnL = (trades) => {
        if (!trades || trades.length === 0) return { dates: [], pnl: [], totalPnL: 0 };

        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => {
            const dateA = new Date(a.trade_date || a.timestamp);
            const dateB = new Date(b.trade_date || b.timestamp);
            return dateA - dateB;
        });

        const dates = [];
        const pnl = [];
        let cumulativePnL = 0;

        sortedTrades.forEach(trade => {
            const tradeDate = new Date(trade.trade_date || trade.timestamp);
            const realizedPnL = parseFloat(trade.realized_pnl || 0);

            // Add realized P&L only for sell trades
            if (trade.side === 'SELL' || trade.action === 'sell') {
                cumulativePnL += realizedPnL;
            }

            dates.push(tradeDate.toLocaleDateString());
            pnl.push(cumulativePnL);
        });

        return { dates, pnl, totalPnL: cumulativePnL };
    };

    // Filter trades by time range
    const filterTradesByTimeRange = (trades, range) => {
        if (range === 'all') return trades;

        const now = new Date();
        let cutoffDate;

        switch (range) {
            case '1m':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3m':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6m':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case '1y':
                cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                return trades;
        }

        return trades.filter(trade => {
            const tradeDate = new Date(trade.trade_date || trade.timestamp);
            return tradeDate >= cutoffDate;
        });
    };

    // Generate chart data
    const generateChartData = () => {
        const filteredTradeHistory = filterTradesByTimeRange(tradeHistory, timeRange);
        const filteredImportedTrades = filterTradesByTimeRange(importedTrades, timeRange);
        
        const platformData = calculateCumulativePnL(filteredTradeHistory);
        const importedData = calculateCumulativePnL(filteredImportedTrades);
        const combinedTrades = [...filteredTradeHistory, ...filteredImportedTrades];
        const combinedData = calculateCumulativePnL(combinedTrades);

        const data = {
            labels: combinedData.dates,
            datasets: [
                {
                    label: 'Cumulative P&L',
                    data: combinedData.pnl,
                    borderColor: '#5B86E5',
                    backgroundColor: 'rgba(91, 134, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                }
            ]
        };

        if (tradeHistory.length > 0 && importedTrades.length > 0) {
            // Show separate lines for platform vs imported trades
            data.datasets = [
                {
                    label: 'Platform Trades P&L',
                    data: platformData.pnl,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                },
                {
                    label: 'Imported Trades P&L',
                    data: importedData.pnl,
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 2,
                },
                {
                    label: 'Combined P&L',
                    data: combinedData.pnl,
                    borderColor: '#5B86E5',
                    backgroundColor: 'rgba(91, 134, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                }
            ];
        }

        setChartData(data);

        // Calculate portfolio stats
        setPortfolioStats({
            totalTrades: combinedTrades.length,
            platformTrades: filteredTradeHistory.length,
            importedTrades: filteredImportedTrades.length,
            totalPnL: combinedData.totalPnL,
            platformPnL: platformData.totalPnL,
            importedPnL: importedData.totalPnL,
        });
    };

    // Generate P&L heatmap by weekday and hour
    const generateHeatmapData = () => {
        const filteredTradeHistory = filterTradesByTimeRange(tradeHistory, timeRange);
        const filteredImportedTrades = filterTradesByTimeRange(importedTrades, timeRange);
        const combinedTrades = [...filteredTradeHistory, ...filteredImportedTrades];

        // Only process SELL trades for P&L
        const sellTrades = combinedTrades.filter(trade => 
            (trade.side === 'SELL' || trade.action === 'sell')
        );

        // Initialize weekday/hour grid
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const heatmapGrid = {};

        weekdays.forEach(day => {
            heatmapGrid[day] = {};
            hours.forEach(hour => {
                heatmapGrid[day][hour] = { pnl: 0, count: 0 };
            });
        });

        // Aggregate P&L by weekday and hour
        sellTrades.forEach(trade => {
            let tradeDate;
            let hour;
            
            // Try to get hour from timestamp first, then fall back to trade_time
            if (trade.timestamp) {
                tradeDate = new Date(trade.timestamp);
                hour = tradeDate.getHours();
            } else if (trade.trade_time) {
                // Parse trade_time format "HH:MM:SS"
                const timeParts = trade.trade_time.split(':');
                hour = parseInt(timeParts[0]);
                tradeDate = new Date(trade.trade_date || trade.timestamp);
            } else {
                // Fallback to a default trade date
                tradeDate = new Date(trade.trade_date || trade.timestamp);
                hour = tradeDate.getHours();
            }
            
            const weekday = weekdays[tradeDate.getDay()];
            
            // Parse realized_pnl more carefully
            let realizedPnL = 0;
            if (trade.realized_pnl !== undefined && trade.realized_pnl !== null) {
                realizedPnL = parseFloat(trade.realized_pnl);
                if (isNaN(realizedPnL)) {
                    console.warn(`Invalid P&L for trade ${trade.trade_id}:`, trade.realized_pnl);
                    realizedPnL = 0;
                }
            }

            if (weekday && hour >= 0 && hour <= 23) {
                heatmapGrid[weekday][hour].pnl += realizedPnL;
                heatmapGrid[weekday][hour].count += 1;
            }
        });

        // Convert to heatmap format
        const heatmapData = [];
        let totalPnLPoints = 0;
        let totalTradeCount = 0;
        
        weekdays.forEach((day, dayIndex) => {
            hours.forEach(hour => {
                const data = heatmapGrid[day][hour];
                // Include all points that have trades, regardless of P&L
                if (data.count > 0) {
                    heatmapData.push({
                        x: hour,
                        y: dayIndex,
                        v: data.pnl,
                        count: data.count,
                        day: day,
                        hour: hour
                    });
                    totalPnLPoints += data.pnl;
                    totalTradeCount += data.count;
                }
            });
        });

        if (heatmapData.length === 0) {
            setHeatmapData(null);
            return;
        }

        const data = {
            datasets: [{
                label: 'P&L by Time',
                data: heatmapData,
                backgroundColor: (ctx) => {
                    const value = ctx.parsed ? ctx.parsed.v : (ctx.raw ? ctx.raw.v : 0);
                    
                    if (value > 0) {
                        const intensity = Math.min(Math.abs(value) / 100, 1); // Scale to max $100 for full intensity
                        return `rgba(76, 175, 80, ${0.3 + intensity * 0.7})`;
                    } else if (value < 0) {
                        const intensity = Math.min(Math.abs(value) / 100, 1);
                        return `rgba(244, 67, 54, ${0.3 + intensity * 0.7})`;
                    }
                    return 'rgba(128, 128, 128, 0.4)'; // Gray for zero P&L
                },
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1,
                pointRadius: (ctx) => {
                    // Handle different context structures from Chart.js
                    let count = 1;
                    if (ctx.parsed && ctx.parsed.count !== undefined) {
                        count = ctx.parsed.count;
                    } else if (ctx.raw && ctx.raw.count !== undefined) {
                        count = ctx.raw.count;
                    } else if (ctx.element && ctx.element.$context && ctx.element.$context.raw) {
                        count = ctx.element.$context.raw.count || 1;
                    }
                    return Math.max(8, Math.min(count * 3, 20)); // Size based on trade count
                },
            }]
        };

        setHeatmapData(data);
    };

    // Generate P&L by instrument (symbol) bar chart
    const generateInstrumentData = () => {
        const filteredTradeHistory = filterTradesByTimeRange(tradeHistory, timeRange);
        const filteredImportedTrades = filterTradesByTimeRange(importedTrades, timeRange);
        const combinedTrades = [...filteredTradeHistory, ...filteredImportedTrades];

        // Track P&L by individual symbol
        const symbolPnL = {};

        combinedTrades.forEach(trade => {
            if (trade.side === 'SELL' || trade.action === 'sell') {
                const symbol = trade.symbol || trade.ticker;
                const realizedPnL = parseFloat(trade.realized_pnl || 0);
                
                if (!symbolPnL[symbol]) {
                    symbolPnL[symbol] = 0;
                }
                symbolPnL[symbol] += realizedPnL;
            }
        });

        const labels = Object.keys(symbolPnL);
        const values = Object.values(symbolPnL);

        const data = {
            labels: labels,
            datasets: [{
                label: 'P&L by Symbol',
                data: values,
                backgroundColor: values.map(value => 
                    value >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
                ),
                borderColor: values.map(value => 
                    value >= 0 ? '#4CAF50' : '#F44336'
                ),
                borderWidth: 2,
            }]
        };

        setInstrumentData(data);
    };

    // Generate Win Rate vs Win/Loss Ratio scatter chart
    const generateWinRateData = () => {
        const filteredTradeHistory = filterTradesByTimeRange(tradeHistory, timeRange);
        const filteredImportedTrades = filterTradesByTimeRange(importedTrades, timeRange);
        const combinedTrades = [...filteredTradeHistory, ...filteredImportedTrades];

        console.log('Total combined trades:', combinedTrades.length);

        // Only process closed trades (SELL trades with P&L data)
        const closedTrades = combinedTrades.filter(trade => {
            // Include SELL trades with P&L data
            const isSellTrade = (trade.side === 'SELL' || trade.action === 'sell');
            const hasPnLData = trade.realized_pnl !== undefined && 
                              trade.realized_pnl !== null && 
                              trade.realized_pnl !== '' &&
                              trade.realized_pnl !== 0; // Exclude zero P&L trades
            return isSellTrade && hasPnLData;
        });

        console.log('Closed trades with P&L:', closedTrades.length);
        console.log('Sample closed trades:', closedTrades.slice(0, 3));

        // Group by symbol and calculate metrics
        const symbolMetrics = {};

        closedTrades.forEach(trade => {
            const symbol = trade.symbol || trade.ticker;
            const pnl = parseFloat(trade.realized_pnl || 0);

            if (!symbolMetrics[symbol]) {
                symbolMetrics[symbol] = {
                    symbol: symbol,
                    totalTrades: 0,
                    wins: 0,
                    losses: 0,
                    winAmounts: [],
                    lossAmounts: [],
                    totalPnL: 0
                };
            }

            symbolMetrics[symbol].totalTrades++;
            symbolMetrics[symbol].totalPnL += pnl;

            if (pnl > 0) {
                symbolMetrics[symbol].wins++;
                symbolMetrics[symbol].winAmounts.push(pnl);
            } else if (pnl < 0) {
                symbolMetrics[symbol].losses++;
                symbolMetrics[symbol].lossAmounts.push(Math.abs(pnl));
            }
        });

        console.log('Symbol metrics:', symbolMetrics);

        // Calculate final metrics for each symbol
        const scatterData = [];
        let maxRatio = 0;

        Object.values(symbolMetrics).forEach(metrics => {
            // Reduce minimum trades requirement to 1 to see all symbols
            if (metrics.totalTrades < 1) return; 

            const totalDecisiveTrades = metrics.wins + metrics.losses;
            if (totalDecisiveTrades === 0) return; // Skip if no wins or losses

            // Calculate win rate (0-100%)
            const winRate = (metrics.wins / totalDecisiveTrades) * 100;

            // Calculate average win and loss amounts
            const avgWin = metrics.winAmounts.length > 0 
                ? metrics.winAmounts.reduce((sum, amount) => sum + amount, 0) / metrics.winAmounts.length 
                : 0;
            
            const avgLoss = metrics.lossAmounts.length > 0 
                ? metrics.lossAmounts.reduce((sum, amount) => sum + amount, 0) / metrics.lossAmounts.length 
                : 0;

            // Calculate win/loss ratio
            let winLossRatio;
            let isInfinite = false;

            if (metrics.losses === 0) {
                // No losses - infinite ratio
                winLossRatio = Infinity;
                isInfinite = true;
            } else if (metrics.wins === 0) {
                // No wins - ratio is 0
                winLossRatio = 0;
            } else {
                winLossRatio = avgWin / avgLoss;
            }

            if (!isInfinite) {
                maxRatio = Math.max(maxRatio, winLossRatio);
            }

            console.log(`${metrics.symbol}: Win Rate: ${winRate.toFixed(1)}%, Wins: ${metrics.wins}, Losses: ${metrics.losses}, Ratio: ${isInfinite ? '∞' : winLossRatio.toFixed(2)}`);

            scatterData.push({
                x: winRate,
                y: isInfinite ? null : winLossRatio, // Will handle infinite values separately
                symbol: metrics.symbol,
                totalTrades: metrics.totalTrades,
                wins: metrics.wins,
                losses: metrics.losses,
                winRate: winRate,
                winLossRatio: winLossRatio,
                avgWin: avgWin,
                avgLoss: avgLoss,
                totalPnL: metrics.totalPnL,
                isInfinite: isInfinite
            });
        });

        console.log('Scatter data points:', scatterData.length);
        console.log('Scatter data:', scatterData);

        if (scatterData.length === 0) {
            setWinRateData(null);
            return;
        }

        // Handle infinite ratios by placing them at the top of the chart
        const chartTopValue = Math.max(maxRatio * 1.1, 1); // Ensure minimum top value of 1
        scatterData.forEach(point => {
            if (point.isInfinite) {
                point.y = chartTopValue;
            }
        });

        const data = {
            datasets: [{
                label: 'Win % vs Win/Loss Ratio',
                data: scatterData,
                backgroundColor: (ctx) => {
                    const point = ctx.raw;
                    // Color based on total P&L
                    if (point.totalPnL > 0) {
                        return 'rgba(76, 175, 80, 0.8)'; // Green for profitable symbols
                    } else if (point.totalPnL < 0) {
                        return 'rgba(244, 67, 54, 0.8)'; // Red for losing symbols
                    }
                    return 'rgba(158, 158, 158, 0.8)'; // Gray for break-even
                },
                borderColor: (ctx) => {
                    const point = ctx.raw;
                    if (point.totalPnL > 0) {
                        return '#4CAF50';
                    } else if (point.totalPnL < 0) {
                        return '#F44336';
                    }
                    return '#9E9E9E';
                },
                borderWidth: 2,
                pointRadius: (ctx) => {
                    // Size based on total number of trades (min 6, max 20)
                    const point = ctx.raw;
                    return Math.max(6, Math.min(point.totalTrades * 1.5, 20));
                },
                pointHoverRadius: (ctx) => {
                    const point = ctx.raw;
                    return Math.max(8, Math.min(point.totalTrades * 1.5 + 2, 22));
                }
            }]
        };

        setWinRateData(data);
    };

    // Win Rate scatter chart options
    const winRateOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: 'white', font: { size: 12 } }
            },
            title: {
                display: true,
                text: 'Win Rate vs Win/Loss Ratio by Symbol',
                color: 'white',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 32, 44, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                callbacks: {
                    title: function(context) {
                        const point = context[0].raw;
                        return point.symbol;
                    },
                    label: function(context) {
                        const point = context.raw;
                        const ratioText = point.isInfinite ? '∞ (no losses)' : point.winLossRatio.toFixed(2);
                        
                        return [
                            `Total Trades: ${point.totalTrades}`,
                            `Wins: ${point.wins}, Losses: ${point.losses}`,
                            `Win Rate: ${point.winRate.toFixed(1)}%`,
                            `Win/Loss Ratio: ${ratioText}`,
                            `Avg Win: ${formatCurrency(point.avgWin)}`,
                            `Avg Loss: ${formatCurrency(point.avgLoss)}`,
                            `Total P&L: ${formatCurrency(point.totalPnL)}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: 0,
                max: 100,
                title: {
                    display: true,
                    text: 'Win Rate (%)',
                    color: 'white',
                    font: { size: 14, weight: 'bold' }
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
            y: {
                type: 'linear',
                min: 0,
                title: {
                    display: true,
                    text: 'Win/Loss Ratio',
                    color: 'white',
                    font: { size: 14, weight: 'bold' }
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { 
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                        return value.toFixed(1);
                    }
                }
            }
        },
        elements: {
            point: {
                hoverRadius: 8
            }
        }
    };

    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'white',
                    font: { size: 12 }
                }
            },
            title: {
                display: true,
                text: 'Cumulative P&L Over Time',
                color: 'white',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 32, 44, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function (value) {
                        return formatCurrency(value);
                    }
                }
            }
        }
    };

    // Heatmap chart options
    const heatmapOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'P&L Heatmap by Weekday & Hour',
                color: 'white',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 32, 44, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                callbacks: {
                    title: function(context) {
                        const point = context[0];
                        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const hour = point.parsed.x;
                        const day = weekdays[point.parsed.y];
                        return `${day} at ${hour}:00`;
                    },
                    label: function(context) {
                        const pnl = context.parsed.v || context.raw.v || 0;
                        const count = context.raw.count || 1;
                        
                        return [
                            `P&L: ${formatCurrency(pnl)}`,
                            `Trades: ${count}`,
                            `Avg P&L: ${formatCurrency(pnl / count)}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: 0,
                max: 23,
                ticks: { 
                    stepSize: 1,
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                        return value + ':00';
                    }
                },
                title: {
                    display: true,
                    text: 'Hour of Day',
                    color: 'white'
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
                type: 'linear',
                min: 0,
                max: 6,
                ticks: { 
                    stepSize: 1,
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return weekdays[value];
                    }
                },
                title: {
                    display: true,
                    text: 'Day of Week',
                    color: 'white'
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    // Bar chart options
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: 'white', font: { size: 12 } }
            },
            title: {
                display: true,
                text: 'P&L by Symbol',
                color: 'white',
                font: { size: 16, weight: 'bold' }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 32, 44, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        return `P&L: ${formatCurrency(context.parsed.y)}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.7)' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function(value) {
                        return formatCurrency(value);
                    }
                }
            }
        }
    };

    // Effects
    useEffect(() => {
        loadTradeHistory();
    }, []);

    useEffect(() => {
        const filteredTradeHistory = filterTradesByTimeRange(tradeHistory, timeRange);
        const filteredImportedTrades = filterTradesByTimeRange(importedTrades, timeRange);
        const filteredAllTrades = [...filteredTradeHistory, ...filteredImportedTrades];
        
        setAllTrades(filteredAllTrades);
        generateChartData();
        generateHeatmapData();
        generateInstrumentData();
        generateWinRateData();
    }, [tradeHistory, importedTrades, timeRange]);

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ color: 'white', mb: 3 }}>
                    Loading Journal...
                </Typography>
                <LinearProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 600 }}>
                    Trading Journal
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => setImportDialogOpen(true)}
                        sx={{ color: '#5B86E5', borderColor: '#5B86E5' }}
                    >
                        Import Trades
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={loadTradeHistory}
                        sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            {portfolioStats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Timeline sx={{ color: '#5B86E5', fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                                    {portfolioStats.totalTrades}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Total Trades
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                {portfolioStats.totalPnL >= 0 ? (
                                    <TrendingUp sx={{ color: '#4CAF50', fontSize: 40, mb: 1 }} />
                                ) : (
                                    <TrendingDown sx={{ color: '#F44336', fontSize: 40, mb: 1 }} />
                                )}
                                <Typography variant="h6" sx={{ color: portfolioStats.totalPnL >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                                    {formatCurrency(portfolioStats.totalPnL)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Total P&L
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <ShowChart sx={{ color: '#4CAF50', fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                                    {portfolioStats.platformTrades}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Platform Trades
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Upload sx={{ color: '#FF9800', fontSize: 40, mb: 1 }} />
                                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                                    {portfolioStats.importedTrades}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Imported Trades
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* P&L Chart */}
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)', mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                            P&L Performance
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Time Range</InputLabel>
                            <Select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' } }}
                            >
                                <MenuItem value="all">All Time</MenuItem>
                                <MenuItem value="1m">Last Month</MenuItem>
                                <MenuItem value="3m">Last 3 Months</MenuItem>
                                <MenuItem value="6m">Last 6 Months</MenuItem>
                                <MenuItem value="1y">Last Year</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {chartData ? (
                        <Box sx={{ height: 400 }}>
                            <Line data={chartData} options={chartOptions} />
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Assessment sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                No trade data available
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Start trading or import your trade history to see performance analysis
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Additional Analytics Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* P&L Heatmap */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                                P&L Heatmap by Time
                            </Typography>
                            {heatmapData ? (
                                <Box sx={{ height: 300 }}>
                                    <Scatter data={heatmapData} options={heatmapOptions} />
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        No data available for heatmap
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* P&L by Symbol */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                                P&L by Symbol
                            </Typography>
                            {instrumentData ? (
                                <Box sx={{ height: 300 }}>
                                    <Bar data={instrumentData} options={barOptions} />
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        No data available for instrument analysis
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Win Rate vs Win/Loss Ratio */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                                Win Rate vs Win/Loss Ratio
                            </Typography>
                            {winRateData ? (
                                <Box sx={{ height: 300 }}>
                                    <Scatter data={winRateData} options={winRateOptions} />
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        No data available for win rate analysis
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Trade History Table */}
            <Card sx={{ background: 'rgba(26, 32, 44, 0.9)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
                        Trade History ({allTrades.length} trades)
                    </Typography>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Symbol</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Side</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Quantity</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Price</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Value</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>P&L</TableCell>
                                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Source</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allTrades.slice(0, 50).map((trade, index) => {
                                    const isImported = importedTrades.includes(trade);
                                    const realizedPnL = parseFloat(trade.realized_pnl || 0);

                                    return (
                                        <TableRow key={trade.trade_id || index} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                                            <TableCell sx={{ color: 'white' }}>
                                                {formatDate(trade.trade_date || trade.timestamp)}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>
                                                {trade.symbol || trade.ticker}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={trade.side || trade.action?.toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: (trade.side === 'BUY' || trade.action === 'buy') ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                        color: (trade.side === 'BUY' || trade.action === 'buy') ? '#4CAF50' : '#F44336',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: 'white' }}>
                                                {parseInt(trade.quantity).toLocaleString()}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white' }}>
                                                {formatCurrency(parseFloat(trade.price))}
                                            </TableCell>
                                            <TableCell sx={{ color: 'white' }}>
                                                {formatCurrency(parseFloat(trade.gross_value || trade.value || 0))}
                                            </TableCell>
                                            <TableCell sx={{ color: realizedPnL >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                                                {realizedPnL !== 0 ? formatCurrency(realizedPnL) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isImported ? 'Imported' : 'Platform'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: isImported ? 'rgba(255, 152, 0, 0.2)' : 'rgba(91, 134, 229, 0.2)',
                                                        color: isImported ? '#FF9800' : '#5B86E5',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {allTrades.length > 50 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Showing first 50 trades of {allTrades.length} total
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Import Dialog */}
            <Dialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(26, 32, 44, 0.95)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Import Trade History
                    <IconButton onClick={() => setImportDialogOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                        Upload a CSV file in the same format as exported from this platform. The file should contain columns like:
                        trade_id, symbol, side, quantity, price, trade_date, realized_pnl, etc.
                    </Typography>

                    <Box
                        sx={{
                            border: '2px dashed rgba(255, 255, 255, 0.3)',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                bgcolor: 'rgba(255, 255, 255, 0.05)'
                            }
                        }}
                        onClick={() => document.getElementById('csv-file-input').click()}
                    >
                        <Upload sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                            {importFile ? importFile.name : 'Click to select CSV file'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Supported format: CSV (exported from this platform)
                        </Typography>
                    </Box>

                    <input
                        id="csv-file-input"
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={(e) => setImportFile(e.target.files[0])}
                    />
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setImportDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        sx={{ bgcolor: '#5B86E5', '&:hover': { bgcolor: '#4A73C2' } }}
                    >
                        {importing ? 'Importing...' : 'Import'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Journal;
