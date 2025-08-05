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

            const response = await portfolioAPI.getPortfolio();
            const trades = response.data?.data?.trades;

            if (trades?.length > 0) {
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

                if (filteredDays.length > 0) {
                    setDailyData(filteredDays);
                } else {
                    setDailyData(getMockData());
                }
            } else {
                setDailyData(getMockData());
            }
        } catch (error) {
            console.error('Error loading daily journal data:', error);
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

    const generateChartData = (trades, totalTrades) => {
        // If we have actual trades, use them
        if (trades && trades.length > 0) {
            let cumulative = 0;
            const data = trades.map(t => (cumulative += t.realized_pnl || 0));
            return {
                labels: trades.map((_, i) => `Trade ${i + 1}`),
                datasets: [
                    {
                        data,
                        borderColor: cumulative >= 0 ? '#4CAF50' : '#f44336',
                        backgroundColor:
                            cumulative >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                    },
                ],
            };
        }

        // If we only have totalTrades count, generate synthetic data for visualization
        if (totalTrades > 0) {
            const syntheticTrades = Array.from({ length: totalTrades }, (_, i) => {
                // Generate realistic P&L progression
                const baseValue = Math.random() * 200 - 100; // Random between -100 and 100
                return baseValue;
            });

            let cumulative = 0;
            const data = syntheticTrades.map(pnl => (cumulative += pnl));

            return {
                labels: syntheticTrades.map((_, i) => `Trade ${i + 1}`),
                datasets: [
                    {
                        data,
                        borderColor: cumulative >= 0 ? '#4CAF50' : '#f44336',
                        backgroundColor:
                            cumulative >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 1,
                        pointHoverRadius: 4,
                    },
                ],
            };
        }

        // Fallback empty chart
        return {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#36D1DC',
                backgroundColor: 'rgba(54, 209, 220, 0.1)',
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(15, 20, 25, 0.95)',
                titleColor: '#36D1DC',
                bodyColor: '#fff',
                borderColor: '#36D1DC',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    title: (context) => `Trade ${context[0].dataIndex + 1}`,
                    label: (context) => `P&L: $${context.parsed.y.toFixed(2)}`,
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            },
            y: {
                display: true,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            }
        },
        elements: { point: { radius: 3, hoverRadius: 6 } },
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

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <Typography key={day} variant="caption" sx={{
                                        textAlign: 'center',
                                        p: 1,
                                        fontWeight: 700,
                                        color: 'rgba(255, 255, 255, 0.8)',
                                        fontSize: 11,
                                        letterSpacing: '0.5px'
                                    }}>
                                        {day}
                                    </Typography>
                                ))}

                                {Array.from({ length: 31 }, (_, i) => {
                                    const day = i + 1;
                                    const dateStr = `2025-08-${day.toString().padStart(2, '0')}`;

                                    // Find if this date has trading data
                                    const dayTradeData = dailyData.find(d => d.date === dateStr);
                                    const hasTrades = !!dayTradeData;
                                    const isProfitable = dayTradeData?.totalPnL > 0;
                                    const isLoss = dayTradeData?.totalPnL < 0;

                                    // Color logic: Green for profit, Red for loss, Blue highlight for selected days with data
                                    let backgroundColor = 'transparent';
                                    let color = 'rgba(255, 255, 255, 0.7)';
                                    let borderColor = 'transparent';
                                    let boxShadow = 'none';

                                    if (hasTrades) {
                                        if (isProfitable) {
                                            backgroundColor = 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
                                            color = '#fff';
                                            boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
                                        } else if (isLoss) {
                                            backgroundColor = 'linear-gradient(135deg, #f44336 0%, #EF5350 100%)';
                                            color = '#fff';
                                            boxShadow = '0 2px 8px rgba(244, 67, 54, 0.3)';
                                        }
                                    }

                                    // Highlight current selected range (Jul 31 - Aug 4)
                                    const isInSelectedRange = [31].includes(day) || [1, 2, 3, 4].includes(day);
                                    if (isInSelectedRange && !hasTrades) {
                                        borderColor = '#36D1DC';
                                        backgroundColor = 'rgba(54, 209, 220, 0.1)';
                                        color = '#36D1DC';
                                    }

                                    return (
                                        <Box
                                            key={day}
                                            sx={{
                                                minHeight: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: 1,
                                                background: backgroundColor,
                                                color,
                                                cursor: hasTrades || isInSelectedRange ? 'pointer' : 'default',
                                                fontSize: 13,
                                                fontWeight: hasTrades ? 700 : 500,
                                                border: `1px solid ${borderColor}`,
                                                boxShadow,
                                                transition: 'all 0.2s ease-in-out',
                                                position: 'relative',
                                                '&:hover': (hasTrades || isInSelectedRange) ? {
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: hasTrades
                                                        ? (isProfitable
                                                            ? '0 4px 12px rgba(76, 175, 80, 0.4)'
                                                            : '0 4px 12px rgba(244, 67, 54, 0.4)')
                                                        : '0 2px 8px rgba(54, 209, 220, 0.3)',
                                                } : {},
                                                '&::after': hasTrades ? {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 2,
                                                    right: 2,
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                } : {}
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
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 20, 25, 0.95) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                overflow: 'hidden',
                                position: 'relative',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: dayData.totalPnL >= 0
                                        ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                                        : 'linear-gradient(90deg, #f44336, #EF5350)',
                                },
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                                    transition: 'all 0.3s ease-in-out',
                                }
                            }}>
                                <CardContent sx={{ pt: 3 }}>
                                    {/* Header with date and add notes button */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="body2" sx={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: 13,
                                            fontWeight: 500
                                        }}>
                                            {dayjs(dayData.date).format('dddd, MMM D, YYYY')}
                                        </Typography>

                                        <Button
                                            variant="contained"
                                            startIcon={<Add />}
                                            size="small"
                                            sx={{
                                                background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: 11,
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                '&:hover': {
                                                    background: 'linear-gradient(45deg, #5B86E5 30%, #36D1DC 90%)',
                                                    transform: 'scale(1.02)',
                                                }
                                            }}
                                        >
                                            Add notes
                                        </Button>
                                    </Box>

                                    {/* Main P&L Display */}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="h3" sx={{
                                            color: dayData.totalPnL >= 0 ? '#4CAF50' : '#f44336',
                                            fontWeight: 800,
                                            fontSize: '2.5rem',
                                            lineHeight: 1,
                                            mb: 0.5
                                        }}>
                                            {formatCurrency(dayData.totalPnL)}
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontSize: 12,
                                            fontWeight: 500
                                        }}>
                                            Net P&L
                                        </Typography>
                                    </Box>

                                    {/* Statistics Grid - Redesigned */}
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                <Typography variant="h5" sx={{
                                                    color: '#fff',
                                                    fontWeight: 700,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.totalTrades}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Total Trades
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(76, 175, 80, 0.2)'
                                            }}>
                                                <Typography variant="h5" sx={{
                                                    color: '#4CAF50',
                                                    fontWeight: 700,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.winners}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Winners
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(244, 67, 54, 0.2)'
                                            }}>
                                                <Typography variant="h5" sx={{
                                                    color: '#f44336',
                                                    fontWeight: 700,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.losers}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Losers
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                <Typography variant="h6" sx={{
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.lots}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Lots
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: 'rgba(54, 209, 220, 0.08)',
                                                borderRadius: 2,
                                                border: '1px solid rgba(54, 209, 220, 0.2)'
                                            }}>
                                                <Typography variant="h6" sx={{
                                                    color: '#36D1DC',
                                                    fontWeight: 600,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.gain.toFixed(2)}%
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Gain
                                                </Typography>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={4}>
                                            <Box sx={{
                                                textAlign: 'center',
                                                p: 1.5,
                                                backgroundColor: dayData.profitFactor >= 1
                                                    ? 'rgba(76, 175, 80, 0.08)'
                                                    : 'rgba(244, 67, 54, 0.08)',
                                                borderRadius: 2,
                                                border: dayData.profitFactor >= 1
                                                    ? '1px solid rgba(76, 175, 80, 0.2)'
                                                    : '1px solid rgba(244, 67, 54, 0.2)'
                                            }}>
                                                <Typography variant="h6" sx={{
                                                    color: dayData.profitFactor >= 1 ? '#4CAF50' : '#f44336',
                                                    fontWeight: 600,
                                                    mb: 0.5
                                                }}>
                                                    {dayData.profitFactor.toFixed(2)}
                                                </Typography>
                                                <Typography variant="caption" sx={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: 10,
                                                    fontWeight: 500
                                                }}>
                                                    Profit Factor
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {/* Interactive Chart Section */}
                                    <Box sx={{
                                        p: 2,
                                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: 2,
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <Typography variant="body2" sx={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            mb: 2,
                                            fontWeight: 600,
                                            fontSize: 13
                                        }}>
                                            Cumulative P&L
                                        </Typography>
                                        <Box sx={{ height: 120 }}>
                                            <Line
                                                data={generateChartData(dayData.trades, dayData.totalTrades)}
                                                options={chartOptions}
                                            />
                                        </Box>
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
