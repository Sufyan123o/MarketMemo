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

const Journal = () => {
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [tabValue, setTabValue] = useState(0);
    const [portfolioStats] = useState({
        totalPnL: 52347.69,
        profitFactor: 2.6,
        winningTrades: 62.5,
        winningDays: 66.7,
        avgWinLoss: 436.23
    });

    // Sample trade data
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

    return (
        <Container maxWidth="xl" sx={{ py: 3, px: 2 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: '#333', fontWeight: 600 }}>
                    Dashboard
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Jan 01,2024 - Jan 06, 2024</InputLabel>
                        <Select value="jan2024" label="Date Range">
                            <MenuItem value="jan2024">Jan 01,2024 - Jan 06, 2024</MenuItem>
                            <MenuItem value="feb2024">Feb 01,2024 - Feb 28, 2024</MenuItem>
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
                    <Card sx={{ height: '100%', backgroundColor: '#fff', boxShadow: 1 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <AccountBalance sx={{ color: '#666', mr: 1 }} />
                                <Tooltip title="Total Portfolio & Leverage">
                                    <Info sx={{ fontSize: 16, color: '#ccc' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                                {formatCurrency(portfolioStats.totalPnL)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Total P&L
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ height: '100%', backgroundColor: '#fff', boxShadow: 1 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <PieChart sx={{ color: '#666', mr: 1 }} />
                                <Tooltip title="Profit Factor">
                                    <Info sx={{ fontSize: 16, color: '#ccc' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                                {portfolioStats.profitFactor}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Profit Factor
                            </Typography>
                            <Box sx={{ mt: 1, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box 
                                    sx={{ 
                                        width: 60, 
                                        height: 60, 
                                        borderRadius: '50%',
                                        background: `conic-gradient(#4CAF50 0deg ${(portfolioStats.profitFactor / 5) * 360}deg, #e0e0e0 ${(portfolioStats.profitFactor / 5) * 360}deg 360deg)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Box sx={{ width: 40, height: 40, backgroundColor: '#fff', borderRadius: '50%' }} />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ height: '100%', backgroundColor: '#fff', boxShadow: 1 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <TrendingUp sx={{ color: '#666', mr: 1 }} />
                                <Tooltip title="Winning Trades %">
                                    <Info sx={{ fontSize: 16, color: '#ccc' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                                {formatPercentage(portfolioStats.winningTrades)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Winning Trades %
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                                <Box sx={{ 
                                    flex: portfolioStats.winningTrades, 
                                    height: 8, 
                                    backgroundColor: '#4CAF50', 
                                    borderRadius: 1 
                                }} />
                                <Box sx={{ 
                                    flex: 100 - portfolioStats.winningTrades, 
                                    height: 8, 
                                    backgroundColor: '#f44336', 
                                    borderRadius: 1 
                                }} />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {portfolioStats.winningTrades}% - {100 - portfolioStats.winningTrades}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ height: '100%', backgroundColor: '#fff', boxShadow: 1 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <CalendarToday sx={{ color: '#666', mr: 1 }} />
                                <Tooltip title="Winning Days %">
                                    <Info sx={{ fontSize: 16, color: '#ccc' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                                {formatPercentage(portfolioStats.winningDays)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Winning Days %
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.2, justifyContent: 'center' }}>
                                {Array.from({ length: 31 }, (_, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            backgroundColor: Math.random() > 0.33 ? '#4CAF50' : '#f44336',
                                            borderRadius: 0.5
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                75% - 25%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={2.4}>
                    <Card sx={{ height: '100%', backgroundColor: '#fff', boxShadow: 1 }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                <Analytics sx={{ color: '#666', mr: 1 }} />
                                <Tooltip title="Average Win/Loss $">
                                    <Info sx={{ fontSize: 16, color: '#ccc' }} />
                                </Tooltip>
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                                {formatCurrency(portfolioStats.avgWinLoss)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Avg Win/Loss $
                            </Typography>
                            <Box sx={{ mt: 1, height: 40, display: 'flex', alignItems: 'end', gap: 1, justifyContent: 'center' }}>
                                {Array.from({ length: 10 }, (_, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 6,
                                            height: Math.random() * 30 + 5,
                                            backgroundColor: '#4CAF50',
                                            borderRadius: 0.5
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                $3.06 - 500.00
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content Area */}
            <Grid container spacing={3}>
                {/* Left Side - Trades List and Calendar */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                <Tabs value={tabValue} onChange={handleTabChange}>
                                    <Tab label="Trades" />
                                    <Tab label="Notes" />
                                </Tabs>
                            </Box>

                            {tabValue === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6">Recent Trades</Typography>
                                        <Box>
                                            <Button variant="outlined" size="small" startIcon={<Add />} sx={{ mr: 1 }}>
                                                Add Note
                                            </Button>
                                            <Button variant="text" size="small">
                                                View Trading Day
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                        {trades.map((trade) => (
                                            <Box key={trade.id} sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                py: 1.5, 
                                                borderBottom: '1px solid #f0f0f0',
                                                '&:last-child': { borderBottom: 'none' }
                                            }}>
                                                <Box sx={{ mr: 2 }}>
                                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#5B86E5', fontSize: 12 }}>
                                                        {trade.symbol.charAt(0)}
                                                    </Avatar>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {trade.time} {trade.date}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {trade.notes}
                                                    </Typography>
                                                </Box>
                                                <IconButton size="small">
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Trading notes and observations will appear here.
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calendar View */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">February 2024</Typography>
                                <Box>
                                    <Button variant="outlined" size="small">
                                        Today
                                    </Button>
                                    <Tooltip title="Calendar Info">
                                        <IconButton size="small">
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>

                            {/* Calendar Grid */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                                {/* Day Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <Typography key={day} variant="caption" sx={{ textAlign: 'center', p: 1, fontWeight: 600 }}>
                                        {day}
                                    </Typography>
                                ))}
                                
                                {/* Calendar Days */}
                                {Array.from({ length: 35 }, (_, i) => {
                                    const dayNumber = i - 2; // Start from day 29 of previous month
                                    const isCurrentMonth = dayNumber > 0 && dayNumber <= 29;
                                    const hasTrading = isCurrentMonth && Math.random() > 0.7;
                                    const pnl = hasTrading ? (Math.random() - 0.5) * 5000 : 0;
                                    
                                    return (
                                        <Box
                                            key={i}
                                            sx={{
                                                minHeight: 60,
                                                p: 0.5,
                                                border: '1px solid #f0f0f0',
                                                backgroundColor: isCurrentMonth ? '#fff' : '#f8f9fa',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                cursor: hasTrading ? 'pointer' : 'default',
                                                '&:hover': hasTrading ? { backgroundColor: '#f5f5f5' } : {}
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ color: isCurrentMonth ? '#333' : '#999' }}>
                                                {dayNumber > 0 && dayNumber <= 29 ? dayNumber : (dayNumber <= 0 ? 28 + dayNumber : dayNumber - 29)}
                                            </Typography>
                                            {hasTrading && (
                                                <Box sx={{ mt: 0.5, textAlign: 'center' }}>
                                                    <Typography variant="caption" sx={{ 
                                                        color: pnl >= 0 ? '#4CAF50' : '#f44336',
                                                        fontWeight: 600,
                                                        fontSize: 10
                                                    }}>
                                                        {formatCurrency(pnl)}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: 8, color: '#666', display: 'block' }}>
                                                        {Math.floor(Math.random() * 5) + 1} Trades
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Side - Open Positions and Charts */}
                <Grid item xs={12} md={4}>
                    {/* Open Positions */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Open Position
                            </Typography>
                            <Tooltip title="Open Position Info">
                                <IconButton size="small" sx={{ float: 'right', mt: -5 }}>
                                    <Info />
                                </IconButton>
                            </Tooltip>
                            
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Open Time</TableCell>
                                            <TableCell>Symbol</TableCell>
                                            <TableCell>Order</TableCell>
                                            <TableCell align="right">Net P&L</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {openPositions.map((position, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{position.time}</TableCell>
                                                <TableCell>{position.symbol}</TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={position.side} 
                                                        size="small"
                                                        color={position.side === 'BUY' ? 'success' : 'error'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: getTradeColor(position.pnl) }}>
                                                    {formatCurrency(position.pnl)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Cumulative P&L Chart */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Cumulative P&L
                            </Typography>
                            <Box sx={{ height: 200, backgroundColor: '#f8f9fa', borderRadius: 1, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                    {/* Simple line chart visualization */}
                                    <svg width="100%" height="100%" viewBox="0 0 300 150">
                                        <polyline
                                            fill="none"
                                            stroke="#4CAF50"
                                            strokeWidth="2"
                                            points="0,120 50,110 100,80 150,90 200,60 250,50 300,40"
                                        />
                                        <circle cx="300" cy="40" r="3" fill="#4CAF50" />
                                    </svg>
                                    <Typography variant="caption" sx={{ position: 'absolute', bottom: 0, right: 0, color: '#4CAF50' }}>
                                        +{formatCurrency(portfolioStats.totalPnL)}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Net Daily P&L Chart */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Net Daily P&L
                                </Typography>
                                <Button variant="outlined" size="small">
                                    Click to open trade details for this date
                                </Button>
                            </Box>
                            <Box sx={{ height: 150, backgroundColor: '#f8f9fa', borderRadius: 1, p: 2, display: 'flex', alignItems: 'end', gap: 1, justifyContent: 'center' }}>
                                {Array.from({ length: 20 }, (_, i) => {
                                    const height = Math.random() * 80 + 10;
                                    const isPositive = Math.random() > 0.4;
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
        </Container>
    );
};

export default Journal;
