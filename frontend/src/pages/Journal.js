import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Tab,
    Tabs,
    Avatar,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from '@mui/material';
import {
    TrendingUp,
    CalendarToday,
    Add,
    Edit,
    Info,
    AccountBalance,
    PieChart,
    Analytics,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { portfolioAPI } from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend
);

const Journal = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [portfolioStats, setPortfolioStats] = useState(null);
    const [trades, setTrades] = useState([]);
    const [allTrades, setAllTrades] = useState([]); // Store all trades for filtering
    const [portfolio, setPortfolio] = useState(null);
    const [cumulativePnLData, setCumulativePnLData] = useState([]);
    const [dateRange, setDateRange] = useState('all'); // Add date range state
    const [calendarData, setCalendarData] = useState({}); // Add calendar data state
    const [currentCalendarMonth, setCurrentCalendarMonth] = useState(dayjs()); // Add calendar month state
    const [notes, setNotes] = useState([]); // Add notes state
    const [showAddNote, setShowAddNote] = useState(false); // Add note dialog state
    const [newNoteText, setNewNoteText] = useState(''); // Add note text state
    const [editingNoteIndex, setEditingNoteIndex] = useState(-1); // Add edit note state
    const [editNoteText, setEditNoteText] = useState(''); // Add edit note text state

    useEffect(() => {
        loadJournalData();
    }, []);

    // Filter trades when allTrades changes
    useEffect(() => {
        if (allTrades.length > 0) {
            filterTradesByDateRange(dateRange);
        }
    }, [allTrades]);

    const loadJournalData = async () => {
        try {
            setLoading(true);
            
            // Load portfolio stats and trade history
            const [statsRes, tradesRes, portfolioRes] = await Promise.all([
                portfolioAPI.getPortfolioStats(),
                portfolioAPI.getTradeHistory(),
                portfolioAPI.getPortfolio()
            ]);

            console.log('Journal Debug - Stats Response:', JSON.stringify(statsRes, null, 2));
            console.log('Journal Debug - Trades Response:', JSON.stringify(tradesRes, null, 2));
            console.log('Journal Debug - Portfolio Response:', JSON.stringify(portfolioRes, null, 2));

            // The actual data is nested: response.data.data (not just response.data)
            setPortfolioStats(statsRes.data.data);
            // Store all trades and set initial filtered trades
            const tradesData = Array.isArray(tradesRes.data.data) ? tradesRes.data.data : [];
            setAllTrades(tradesData);
            setTrades(tradesData); // Initially show all trades
            setPortfolio(portfolioRes.data.data);
            
            // Calculate cumulative P&L data for chart
            calculateCumulativePnL(tradesData);
            
            // Calculate calendar data
            calculateCalendarData(tradesData);
            
            // Load notes from localStorage
            loadNotes();
            
        } catch (error) {
            console.error('Error loading journal data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterTradesByDateRange = (dateRangeValue) => {
        if (!Array.isArray(allTrades)) return;

        const now = dayjs();
        let filteredTrades = allTrades;

        switch (dateRangeValue) {
            case 'today':
                filteredTrades = allTrades.filter(trade => 
                    dayjs(trade.trade_date).isSame(now, 'day')
                );
                break;
            case 'week':
                filteredTrades = allTrades.filter(trade => 
                    dayjs(trade.trade_date).isAfter(now.subtract(7, 'day'))
                );
                break;
            case 'month':
                filteredTrades = allTrades.filter(trade => 
                    dayjs(trade.trade_date).isAfter(now.subtract(1, 'month'))
                );
                break;
            case 'quarter':
                filteredTrades = allTrades.filter(trade => 
                    dayjs(trade.trade_date).isAfter(now.subtract(3, 'month'))
                );
                break;
            case 'year':
                filteredTrades = allTrades.filter(trade => 
                    dayjs(trade.trade_date).isAfter(now.subtract(1, 'year'))
                );
                break;
            case 'all':
            default:
                filteredTrades = allTrades;
                break;
        }

        setTrades(filteredTrades);
        calculateCumulativePnL(filteredTrades);
        calculateCalendarData(filteredTrades);
    };

    const calculateCalendarData = (tradesData) => {
        if (!Array.isArray(tradesData)) return;

        const calendarMap = {};
        
        tradesData.forEach(trade => {
            const date = trade.trade_date;
            if (!calendarMap[date]) {
                calendarMap[date] = {
                    totalPnL: 0,
                    tradeCount: 0,
                    trades: []
                };
            }
            
            calendarMap[date].totalPnL += (trade.realized_pnl || 0);
            calendarMap[date].tradeCount += 1;
            calendarMap[date].trades.push(trade);
        });

        setCalendarData(calendarMap);
    };

    const loadNotes = () => {
        const savedNotes = localStorage.getItem('tradingNotes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    };

    const addNote = (noteText) => {
        const newNote = {
            id: Date.now(),
            text: noteText,
            timestamp: dayjs().format('h:mm A MM/DD/YYYY'),
            date: dayjs().format('YYYY-MM-DD')
        };
        
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem('tradingNotes', JSON.stringify(updatedNotes));
        setShowAddNote(false);
    };

    const handleDateRangeChange = (event) => {
        const newDateRange = event.target.value;
        setDateRange(newDateRange);
        filterTradesByDateRange(newDateRange);
    };

    const calculateCumulativePnL = (tradesData) => {
        // Ensure tradesData is an array
        if (!Array.isArray(tradesData)) {
            console.log('Journal Debug - calculateCumulativePnL received non-array:', tradesData);
            setCumulativePnLData([]);
            return;
        }
        
        // Sort trades by date
        const sortedTrades = [...tradesData].sort((a, b) => 
            new Date(a.trade_date) - new Date(b.trade_date)
        );

        let cumulativePnL = 0;
        const chartData = [];
        
        sortedTrades.forEach((trade) => {
            const realizedPnL = trade.realized_pnl || 0;
            cumulativePnL += realizedPnL;
            
            chartData.push({
                date: trade.trade_date,
                cumulativePnL: cumulativePnL,
                trade: trade
            });
        });

        setCumulativePnLData(chartData);
    };

    const calculateActualStats = () => {
        console.log('Journal Debug - calculateActualStats called');
        console.log('Journal Debug - portfolioStats:', portfolioStats);
        console.log('Journal Debug - trades type:', typeof trades);
        console.log('Journal Debug - trades isArray:', Array.isArray(trades));
        console.log('Journal Debug - trades length:', trades?.length);
        console.log('Journal Debug - trades sample:', Array.isArray(trades) ? trades.slice(0, 3) : trades);
        
        if (!portfolioStats || !Array.isArray(trades) || trades.length === 0) {
            console.log('Journal Debug - No portfolioStats or no valid trades array, returning zeros');
            return {
                totalPnL: 0,
                profitFactor: 0,
                winningTrades: 0,
                winningDays: 0,
                avgWinLoss: 0
            };
        }

        // Filter for only closed trades (trades with non-zero realized P&L)
        const closedTrades = trades.filter(t => (t.realized_pnl || 0) !== 0);
        const winningTrades = trades.filter(t => (t.realized_pnl || 0) > 0);
        const losingTrades = trades.filter(t => (t.realized_pnl || 0) < 0);
        
        console.log('Journal Debug - Total trades:', trades.length);
        console.log('Journal Debug - Closed trades:', closedTrades.length);
        console.log('Journal Debug - Winning trades:', winningTrades.length);
        console.log('Journal Debug - Losing trades:', losingTrades.length);
        console.log('Journal Debug - portfolioStats.total_realized_pnl:', portfolioStats.total_realized_pnl);
        
        const totalWins = winningTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0));
        
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
        // Calculate win rate based only on closed trades (excluding open positions with 0.0 P&L)
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        
        // Calculate winning days based only on closed trades
        const tradesByDate = {};
        closedTrades.forEach(trade => {
            const date = trade.trade_date;
            if (!tradesByDate[date]) tradesByDate[date] = 0;
            tradesByDate[date] += (trade.realized_pnl || 0);
        });
        
        const tradingDays = Object.keys(tradesByDate);
        const winningDays = tradingDays.filter(date => tradesByDate[date] > 0);
        const winningDaysRate = tradingDays.length > 0 ? (winningDays.length / tradingDays.length) * 100 : 0;
        
        const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

        return {
            totalPnL: portfolioStats.total_realized_pnl || 0,
            profitFactor: profitFactor,
            winningTrades: winRate,
            winningDays: winningDaysRate,
            avgWinLoss: avgWin,
            avgWin: avgWin,
            avgLoss: avgLoss,
            totalTrades: trades.length,
            closedTrades: closedTrades.length,
            winningTradesCount: winningTrades.length,
            losingTradesCount: losingTrades.length,
            totalTradingDays: tradingDays.length,
            winningDaysCount: winningDays.length
        };
    };

    const actualStats = calculateActualStats();

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

    const handleEditNote = (index) => {
        setEditingNoteIndex(index);
        setEditNoteText(notes[index].text);
    };

    const handleSaveEditNote = () => {
        if (editNoteText.trim()) {
            const updatedNotes = [...notes];
            updatedNotes[editingNoteIndex] = {
                ...updatedNotes[editingNoteIndex],
                text: editNoteText.trim(),
                lastModified: new Date().toISOString()
            };
            setNotes(updatedNotes);
            localStorage.setItem('tradingNotes', JSON.stringify(updatedNotes));
            setEditingNoteIndex(-1);
            setEditNoteText('');
        }
    };

    const handleCancelEdit = () => {
        setEditingNoteIndex(-1);
        setEditNoteText('');
    };

    const handleAddNote = () => {
        if (newNoteText.trim()) {
            addNote(newNoteText.trim());
            setNewNoteText('');
            setShowAddNote(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={60} sx={{ color: '#36D1DC' }} />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#36D1DC', fontWeight: 700 }}>
                    Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button 
                        variant="outlined"
                        onClick={() => window.location.href = '/daily-journal'}
                        sx={{ 
                            borderColor: '#36D1DC',
                            color: '#36D1DC',
                            '&:hover': { borderColor: '#5B86E5', backgroundColor: 'rgba(54, 209, 220, 0.1)' }
                        }}
                    >
                        Daily Journal View
                    </Button>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Date Range</InputLabel>
                        <Select 
                            value={dateRange} 
                            label="Date Range"
                            onChange={handleDateRangeChange}
                        >
                            <MenuItem value="all">All Time</MenuItem>
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="week">Last 7 Days</MenuItem>
                            <MenuItem value="month">Last Month</MenuItem>
                            <MenuItem value="quarter">Last 3 Months</MenuItem>
                            <MenuItem value="year">Last Year</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>All Accounts</InputLabel>
                        <Select value="all" label="All Accounts">
                            <MenuItem value="all">All Accounts</MenuItem>
                            <MenuItem value="main">Main Account</MenuItem>
                            <MenuItem value="demo">Demo Account</MenuItem>
                        </Select>
                    </FormControl>
                    <IconButton sx={{ color: '#666' }}>
                        <CalendarToday />
                    </IconButton>
                    <IconButton sx={{ color: '#666' }}>
                        <Info />
                    </IconButton>
                </Box>
            </Box>

            {/* Key Metrics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ 
                        height: '100%', 
                        backgroundColor: 'rgba(15, 20, 25, 0.95)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <AccountBalance sx={{ color: '#36D1DC', mr: 1 }} />
                                <Tooltip title="Total Portfolio & Leverage">
                                    <Info sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: actualStats.totalPnL >= 0 ? '#4CAF50' : '#f44336' }}>
                                {formatCurrency(actualStats.totalPnL)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Total Realized P&L
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ 
                        height: '100%', 
                        backgroundColor: 'rgba(15, 20, 25, 0.95)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <PieChart sx={{ color: '#36D1DC', mr: 1 }} />
                                <Tooltip title={`For every dollar you lost, you made $${actualStats.profitFactor.toFixed(2)} in profits. Values > 1.0 indicate profitable trading performance.`}>
                                    <Info sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                {actualStats.profitFactor.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Profit Factor
                            </Typography>
                            <Box sx={{ mt: 1, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box 
                                    sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%',
                                        background: `conic-gradient(#4CAF50 0deg ${Math.min((Math.max(actualStats.profitFactor, 0) / 5) * 360, 360)}deg, rgba(255, 255, 255, 0.1) ${Math.min((Math.max(actualStats.profitFactor, 0) / 5) * 360, 360)}deg 360deg)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#fff'
                                    }}
                                >
                                    {actualStats.profitFactor.toFixed(1)}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ 
                        height: '100%', 
                        backgroundColor: 'rgba(15, 20, 25, 0.95)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <TrendingUp sx={{ color: '#36D1DC', mr: 1 }} />
                                <Tooltip title={`Out of ${actualStats.closedTrades} closed trades, you profited on ${actualStats.winningTradesCount} trades (${actualStats.winningTrades.toFixed(1)}%).`}>
                                    <Info sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                {actualStats.winningTrades.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Winning Trades %
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                                <Box sx={{ 
                                    width: `${actualStats.winningTrades}%`, 
                                    height: 8, 
                                    backgroundColor: '#4CAF50', 
                                    borderRadius: 1 
                                }} />
                                <Box sx={{ 
                                    width: `${100 - actualStats.winningTrades}%`, 
                                    height: 8, 
                                    backgroundColor: '#f44336', 
                                    borderRadius: 1 
                                }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1, display: 'block' }}>
                                {actualStats.winningTradesCount}W - {actualStats.losingTradesCount}L ({actualStats.closedTrades} closed / {actualStats.totalTrades} total)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ 
                        height: '100%', 
                        backgroundColor: 'rgba(15, 20, 25, 0.95)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <CalendarToday sx={{ color: '#36D1DC', mr: 1 }} />
                                <Tooltip title={`Out of ${actualStats.totalTradingDays} trading days, you profited on ${actualStats.winningDaysCount} days (${actualStats.winningDays.toFixed(1)}%).`}>
                                    <Info sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                {actualStats.winningDays.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Winning Days %
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.2, justifyContent: 'center', height: 32 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', height: 8 }}>
                                    <Box sx={{ 
                                        width: `${actualStats.winningDays}%`, 
                                        height: 8, 
                                        backgroundColor: '#4CAF50', 
                                        borderRadius: '4px 0 0 4px' 
                                    }} />
                                    <Box sx={{ 
                                        width: `${100 - actualStats.winningDays}%`, 
                                        height: 8, 
                                        backgroundColor: '#f44336', 
                                        borderRadius: '0 4px 4px 0' 
                                    }} />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}>
                                    {actualStats.winningDaysCount}W - {actualStats.totalTradingDays - actualStats.winningDaysCount}L days
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ 
                        height: '100%', 
                        backgroundColor: 'rgba(15, 20, 25, 0.95)', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <Analytics sx={{ color: '#36D1DC', mr: 1 }} />
                                <Tooltip title="Average Win/Loss $">
                                    <Info sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                                {formatCurrency(actualStats.avgWinLoss)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                Avg Win/Loss $
                            </Typography>
                            <Box sx={{ mt: 1, height: 40, display: 'flex', alignItems: 'end', gap: 0.5, justifyContent: 'center' }}>
                                {/* Visual representation of win vs loss ratio */}
                                <Box sx={{ 
                                    width: `${Math.max(20, Math.min(80, (actualStats.avgWin / Math.max(actualStats.avgWin, Math.abs(actualStats.avgLoss))) * 100))}%`, 
                                    height: 8, 
                                    backgroundColor: '#4CAF50', 
                                    borderRadius: 1 
                                }} />
                                <Box sx={{ 
                                    width: `${Math.max(20, Math.min(80, (Math.abs(actualStats.avgLoss) / Math.max(actualStats.avgWin, Math.abs(actualStats.avgLoss))) * 100))}%`, 
                                    height: 8, 
                                    backgroundColor: '#f44336', 
                                    borderRadius: 1 
                                }} />
                            </Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1, display: 'block' }}>
                                Win: {formatCurrency(actualStats.avgWin)} | Loss: {formatCurrency(actualStats.avgLoss)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content Area */}
            <Grid container spacing={3}>
                {/* Left Side - Trades List and Calendar */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ 
                        mb: 3,
                        backgroundColor: 'rgba(15, 20, 25, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent>
                            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange}
                                    sx={{
                                        '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                                        '& .Mui-selected': { color: '#36D1DC !important' },
                                        '& .MuiTabs-indicator': { backgroundColor: '#36D1DC' }
                                    }}
                                >
                                    <Tab label="Trades" />
                                    <Tab label="Notes" />
                                </Tabs>
                            </Box>

                            {tabValue === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#fff' }}>
                                            Recent Trades
                                            {dateRange !== 'all' && (
                                                <Typography component="span" variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', ml: 1 }}>
                                                    ({trades.length} trades in selected period)
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Box>
                                            <Button 
                                                variant="outlined" 
                                                size="small" 
                                                startIcon={<Add />}
                                                onClick={() => setShowAddNote(true)}
                                                sx={{ 
                                                    mr: 1,
                                                    borderColor: '#36D1DC',
                                                    color: '#36D1DC',
                                                    '&:hover': { borderColor: '#5B86E5', backgroundColor: 'rgba(54, 209, 220, 0.1)' }
                                                }}
                                            >
                                                Add Note
                                            </Button>
                                            <Button 
                                                variant="text" 
                                                size="small"
                                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                            >
                                                View Trading Day
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                        {(trades && Array.isArray(trades) ? trades.slice(0, 10) : []).map((trade, index) => (
                                            <Box key={trade.trade_id || index} sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                py: 1.5, 
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                '&:last-child': { borderBottom: 'none' }
                                            }}>
                                                <Box sx={{ mr: 2 }}>
                                                    <Chip 
                                                        label={trade.side} 
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: trade.side === 'BUY' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                                            color: trade.side === 'BUY' ? '#4CAF50' : '#f44336',
                                                            border: `1px solid ${trade.side === 'BUY' ? '#4CAF50' : '#f44336'}`,
                                                            fontWeight: 600,
                                                            fontSize: '10px'
                                                        }}
                                                    />
                                                </Box>
                                                <Box sx={{ mr: 2 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#36D1DC', fontSize: 11, fontWeight: 600 }}>
                                                        {trade.symbol.charAt(0)}
                                                    </Avatar>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#fff' }}>
                                                        {trade.symbol} • {trade.quantity} shares @ {formatCurrency(trade.price)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                        {trade.trade_date} {trade.trade_time}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right', mr: 1 }}>
                                                    <Typography variant="body2" sx={{ 
                                                        fontWeight: 600, 
                                                        color: getTradeColor(trade.realized_pnl || 0)
                                                    }}>
                                                        {formatCurrency(trade.realized_pnl || 0)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                        P&L
                                                    </Typography>
                                                </Box>
                                                <IconButton size="small" sx={{ color: '#36D1DC' }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                        {(!trades || !Array.isArray(trades) || trades.length === 0) && (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                                    No trades found
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box sx={{ p: 2 }}>
                                    {notes.length === 0 ? (
                                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                            No notes yet. Add your first trading note using the "Add Note" button above.
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {notes.map((note, index) => (
                                                <Paper 
                                                    key={index} 
                                                    sx={{ 
                                                        p: 2, 
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(note.timestamp).toLocaleString()}
                                                            {note.lastModified && (
                                                                <Typography component="span" variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', ml: 1 }}>
                                                                    (edited: {new Date(note.lastModified).toLocaleString()})
                                                                </Typography>
                                                            )}
                                                        </Typography>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={() => handleEditNote(index)}
                                                            sx={{ 
                                                                color: '#36D1DC',
                                                                '&:hover': { backgroundColor: 'rgba(54, 209, 220, 0.1)' }
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                        {note.text}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calendar View */}
                    <Card sx={{
                        backgroundColor: 'rgba(15, 20, 25, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    {currentCalendarMonth.format('MMMM YYYY')}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setCurrentCalendarMonth(prev => prev.subtract(1, 'month'))}
                                        sx={{ color: '#36D1DC' }}
                                    >
                                        <Typography variant="caption">‹</Typography>
                                    </IconButton>
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        onClick={() => {
                                            setCurrentCalendarMonth(dayjs());
                                            const today = dayjs().format('YYYY-MM-DD');
                                            if (calendarData[today]) {
                                                console.log('Today\'s trades:', calendarData[today]);
                                            }
                                        }}
                                        sx={{ 
                                            borderColor: '#36D1DC',
                                            color: '#36D1DC',
                                            '&:hover': { borderColor: '#5B86E5', backgroundColor: 'rgba(54, 209, 220, 0.1)' }
                                        }}
                                    >
                                        Today
                                    </Button>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setCurrentCalendarMonth(prev => prev.add(1, 'month'))}
                                        sx={{ color: '#36D1DC' }}
                                    >
                                        <Typography variant="caption">›</Typography>
                                    </IconButton>
                                    <Tooltip title="Shows P&L and trade count for each day">
                                        <IconButton size="small" sx={{ color: '#36D1DC' }}>
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Calendar Grid */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                                {/* Day Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <Typography key={day} variant="caption" sx={{ textAlign: 'center', p: 1, fontWeight: 600, color: '#fff' }}>
                                        {day}
                                    </Typography>
                                ))}
                                
                                {/* Calendar Days */}
                                {(() => {
                                    const today = dayjs();
                                    const startOfMonth = currentCalendarMonth.startOf('month');
                                    const startOfCalendar = startOfMonth.startOf('week');
                                    const endOfMonth = currentCalendarMonth.endOf('month');
                                    const endOfCalendar = endOfMonth.endOf('week');
                                    
                                    const days = [];
                                    let currentDay = startOfCalendar;
                                    
                                    while (currentDay.isBefore(endOfCalendar) || currentDay.isSame(endOfCalendar, 'day')) {
                                        days.push(currentDay);
                                        currentDay = currentDay.add(1, 'day');
                                    }
                                    
                                    return days.map((day, index) => {
                                        const dateStr = day.format('YYYY-MM-DD');
                                        const isCurrentMonth = day.isSame(currentCalendarMonth, 'month');
                                        const isToday = day.isSame(today, 'day');
                                        const dayData = calendarData[dateStr];
                                        const hasTrading = dayData && dayData.tradeCount > 0;
                                        
                                        return (
                                            <Box
                                                key={index}
                                                onClick={() => {
                                                    if (hasTrading) {
                                                        console.log(`Trades for ${dateStr}:`, dayData.trades);
                                                        // Could open a modal or navigate to detailed view
                                                    }
                                                }}
                                                sx={{
                                                    minHeight: 60,
                                                    p: 0.5,
                                                    border: isToday ? '2px solid #36D1DC' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    backgroundColor: isCurrentMonth ? 
                                                        (hasTrading ? 
                                                            (dayData.totalPnL >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)') 
                                                            : 'rgba(255, 255, 255, 0.05)') 
                                                        : 'rgba(255, 255, 255, 0.02)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    cursor: hasTrading ? 'pointer' : 'default',
                                                    '&:hover': hasTrading ? { backgroundColor: 'rgba(54, 209, 220, 0.2)' } : {},
                                                    borderRadius: 1
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ 
                                                    color: isCurrentMonth ? (isToday ? '#36D1DC' : '#fff') : 'rgba(255, 255, 255, 0.5)',
                                                    fontWeight: isToday ? 600 : 400
                                                }}>
                                                    {day.format('D')}
                                                </Typography>
                                                {hasTrading && (
                                                    <Box sx={{ mt: 0.5, textAlign: 'center' }}>
                                                        <Typography variant="caption" sx={{ 
                                                            color: dayData.totalPnL >= 0 ? '#4CAF50' : '#f44336',
                                                            fontWeight: 600,
                                                            fontSize: 10
                                                        }}>
                                                            {formatCurrency(dayData.totalPnL)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ 
                                                            fontSize: 8, 
                                                            color: 'rgba(255, 255, 255, 0.7)', 
                                                            display: 'block' 
                                                        }}>
                                                            {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    });
                                })()}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Side - Open Positions and Charts */}
                <Grid item xs={12} md={4}>
                    {/* Open Positions */}
                    <Card sx={{ 
                        mb: 3,
                        backgroundColor: 'rgba(15, 20, 25, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                Current Positions
                            </Typography>
                            <Tooltip title="Current Portfolio Positions">
                                <IconButton size="small" sx={{ float: 'right', mt: -5, color: '#36D1DC' }}>
                                    <Info />
                                </IconButton>
                            </Tooltip>
                            
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Symbol</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Qty</TableCell>
                                            <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Avg Price</TableCell>
                                            <TableCell align="right" sx={{ color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Value</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {portfolio?.positions && Object.entries(portfolio.positions).map(([symbol, position]) => (
                                            <TableRow key={symbol}>
                                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ width: 20, height: 20, bgcolor: '#36D1DC', fontSize: 10, mr: 1 }}>
                                                            {symbol.charAt(0)}
                                                        </Avatar>
                                                        {symbol}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    {position.quantity}
                                                </TableCell>
                                                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    {formatCurrency(position.avg_price)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#4CAF50', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                    {formatCurrency(position.quantity * position.avg_price)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!portfolio?.positions || Object.keys(portfolio.positions).length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', py: 3 }}>
                                                    No open positions
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            
                            {portfolio?.cash && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                            Available Cash:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                                            {formatCurrency(portfolio.cash)}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cumulative P&L Chart */}
                    <Card sx={{ 
                        mb: 3,
                        backgroundColor: 'rgba(15, 20, 25, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                                Cumulative Realized P&L
                            </Typography>
                            <Box sx={{ height: 300, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 1, p: 2 }}>
                                {cumulativePnLData.length > 0 ? (
                                    <Line 
                                        data={{
                                            labels: cumulativePnLData.map(item => {
                                                const date = new Date(item.date);
                                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            }),
                                            datasets: [{
                                                label: 'Cumulative P&L',
                                                data: cumulativePnLData.map(item => item.cumulativePnL),
                                                borderColor: (ctx) => {
                                                    const chart = ctx.chart;
                                                    const {ctx: canvasCtx, chartArea} = chart;
                                                    if (!chartArea) return '#36D1DC';
                                                    
                                                    const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                                    gradient.addColorStop(0, '#f44336');
                                                    gradient.addColorStop(0.5, '#ffeb3b');
                                                    gradient.addColorStop(1, '#4CAF50');
                                                    return gradient;
                                                },
                                                backgroundColor: 'rgba(54, 209, 220, 0.1)',
                                                borderWidth: 3,
                                                tension: 0.3,
                                                fill: true,
                                                pointBackgroundColor: '#36D1DC',
                                                pointBorderColor: '#fff',
                                                pointBorderWidth: 2,
                                                pointRadius: 4,
                                                pointHoverRadius: 6,
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(15, 20, 25, 0.95)',
                                                    titleColor: '#fff',
                                                    bodyColor: '#fff',
                                                    borderColor: '#36D1DC',
                                                    borderWidth: 1,
                                                    callbacks: {
                                                        label: function(context) {
                                                            const trade = cumulativePnLData[context.dataIndex].trade;
                                                            return [
                                                                `Cumulative P&L: ${formatCurrency(context.parsed.y)}`,
                                                                `Trade: ${trade.side} ${trade.quantity} ${trade.symbol}`,
                                                                `P&L: ${formatCurrency(trade.realized_pnl || 0)}`
                                                            ];
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    },
                                                    ticks: {
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        font: {
                                                            size: 11
                                                        }
                                                    }
                                                },
                                                y: {
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    },
                                                    ticks: {
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        font: {
                                                            size: 11
                                                        },
                                                        callback: function(value) {
                                                            return formatCurrency(value);
                                                        }
                                                    }
                                                }
                                            },
                                            interaction: {
                                                intersect: false,
                                                mode: 'index'
                                            }
                                        }}
                                    />
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            No trading data available for chart
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Based on realized P&L from completed trades
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    color: actualStats.totalPnL >= 0 ? '#4CAF50' : '#f44336',
                                    fontWeight: 600 
                                }}>
                                    Total: {formatCurrency(actualStats.totalPnL)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Net Daily P&L Chart */}
                    <Card sx={{
                        backgroundColor: 'rgba(15, 20, 25, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ color: '#fff' }}>
                                    Net Daily P&L
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    sx={{ 
                                        borderColor: '#36D1DC',
                                        color: '#36D1DC',
                                        fontSize: '0.7rem',
                                        '&:hover': { borderColor: '#5B86E5', backgroundColor: 'rgba(54, 209, 220, 0.1)' }
                                    }}
                                >
                                    Click to open trade details for this date
                                </Button>
                            </Box>
                            <Box sx={{ height: 150, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 1, p: 2, display: 'flex', alignItems: 'end', gap: 1, justifyContent: 'center' }}>
                                {/* Static bars for Net Daily P&L */}
                                {[35, 65, 25, 80, 45, 90, 30, 55, 70, 40, 85, 50, 75, 20, 95, 35, 60, 45, 80, 55].map((height, i) => {
                                    const isPositive = height > 50;
                                    return (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 8,
                                                height: height,
                                                backgroundColor: isPositive ? '#4CAF50' : '#f44336',
                                                borderRadius: 0.5,
                                                opacity: 0.8
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Note Dialog */}
            <Dialog 
                open={showAddNote} 
                onClose={() => setShowAddNote(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Add Trading Note
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Enter your trading note..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#36D1DC' }
                            },
                            '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                    <Button 
                        onClick={() => setShowAddNote(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddNote}
                        variant="contained"
                        disabled={!newNoteText.trim()}
                        sx={{
                            background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
                            '&:disabled': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        Add Note
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Note Dialog */}
            <Dialog 
                open={editingNoteIndex >= 0} 
                onClose={handleCancelEdit}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    Edit Trading Note
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Edit your trading note..."
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#36D1DC' }
                            },
                            '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
                    <Button 
                        onClick={handleCancelEdit}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveEditNote}
                        variant="contained"
                        disabled={!editNoteText.trim()}
                        sx={{
                            background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
                            '&:disabled': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Journal;
