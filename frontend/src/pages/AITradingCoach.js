import React, { useState } from 'react';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    Divider,
    Paper
} from '@mui/material';
import {
    Psychology,
    AutoAwesome,
    TrendingUp,
    Lightbulb
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const AITradingCoach = () => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);

    const runAnalysis = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.post('/api/ai-coach/analyze');
            setAnalysis(response.data);
        } catch (err) {
            setError('Failed to generate AI analysis. Please try again.');
            console.error('AI Coach error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography 
                    variant="h3" 
                    sx={{ 
                        color: '#36D1DC', 
                        fontWeight: 700,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2
                    }}
                >
                    <Psychology sx={{ fontSize: 40 }} />
                    AI Trading Coach
                </Typography>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        maxWidth: 600,
                        mx: 'auto'
                    }}
                >
                    Get personalized insights and recommendations from AI analysis of your complete trading history
                </Typography>
            </Box>

            {/* Run Analysis Button */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={runAnalysis}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                    sx={{
                        background: 'linear-gradient(45deg, #36D1DC 30%, #5B86E5 90%)',
                        color: 'white',
                        px: 4,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        border: 0,
                        borderRadius: 3,
                        boxShadow: '0 3px 5px 2px rgba(54, 209, 220, .3)',
                        '&:hover': {
                            background: 'linear-gradient(45deg, #2BC1CC 30%, #4A75D6 90%)',
                        },
                        '&:disabled': {
                            background: 'rgba(54, 209, 220, 0.3)',
                        }
                    }}
                >
                    {loading ? 'Analyzing...' : 'RUN ANALYSIS'}
                </Button>
            </Box>

            {/* Error Display */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 3, backgroundColor: 'rgba(244, 67, 54, 0.1)' }}
                >
                    {error}
                </Alert>
            )}

            {/* Analysis Results */}
            {analysis && (
                <Card sx={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    border: '1px solid rgba(54, 209, 220, 0.3)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Lightbulb sx={{ color: '#36D1DC', mr: 2, fontSize: 28 }} />
                            <Typography variant="h5" sx={{ color: '#36D1DC', fontWeight: 600 }}>
                                AI Analysis Results
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3, borderColor: 'rgba(54, 209, 220, 0.2)' }} />

                        {/* Analysis Content */}
                        <Paper 
                            elevation={0}
                            sx={{
                                background: 'rgba(54, 209, 220, 0.05)',
                                border: '1px solid rgba(54, 209, 220, 0.2)',
                                borderRadius: 2,
                                p: 3
                            }}
                        >
                            <ReactMarkdown
                                components={{
                                    h2: ({ children }) => (
                                        <Typography variant="h5" sx={{ 
                                            color: '#36D1DC', 
                                            fontWeight: 600, 
                                            mb: 2, 
                                            mt: 3 
                                        }}>
                                            {children}
                                        </Typography>
                                    ),
                                    h3: ({ children }) => (
                                        <Typography variant="h6" sx={{ 
                                            color: '#5B86E5', 
                                            fontWeight: 600, 
                                            mb: 1.5, 
                                            mt: 2 
                                        }}>
                                            {children}
                                        </Typography>
                                    ),
                                    p: ({ children }) => (
                                        <Typography variant="body1" sx={{ 
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            lineHeight: 1.8,
                                            fontSize: '1.1rem',
                                            mb: 2
                                        }}>
                                            {children}
                                        </Typography>
                                    ),
                                    ul: ({ children }) => (
                                        <Box component="ul" sx={{ 
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            pl: 3,
                                            mb: 2
                                        }}>
                                            {children}
                                        </Box>
                                    ),
                                    li: ({ children }) => (
                                        <Typography component="li" variant="body1" sx={{ 
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            lineHeight: 1.6,
                                            mb: 0.5
                                        }}>
                                            {children}
                                        </Typography>
                                    ),
                                    blockquote: ({ children }) => (
                                        <Box sx={{
                                            borderLeft: '4px solid #36D1DC',
                                            pl: 2,
                                            py: 1,
                                            mb: 2,
                                            background: 'rgba(54, 209, 220, 0.1)',
                                            fontStyle: 'italic'
                                        }}>
                                            <Typography variant="body1" sx={{ 
                                                color: 'rgba(255, 255, 255, 0.9)',
                                                lineHeight: 1.6
                                            }}>
                                                {children}
                                            </Typography>
                                        </Box>
                                    ),
                                    strong: ({ children }) => (
                                        <Typography component="span" sx={{ 
                                            fontWeight: 700,
                                            color: '#36D1DC'
                                        }}>
                                            {children}
                                        </Typography>
                                    )
                                }}
                            >
                                {analysis.response_md || analysis.response}
                            </ReactMarkdown>
                        </Paper>

                        {/* Analysis Metadata */}
                        {analysis.metadata && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    Analysis based on {analysis.metadata.total_trades} trades • 
                                    Generated on {new Date(analysis.metadata.timestamp).toLocaleString()}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Loading State */}
            {loading && !analysis && (
                <Card sx={{
                    background: 'rgba(26, 32, 44, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                    py: 6
                }}>
                    <CardContent>
                        <CircularProgress 
                            size={60} 
                            sx={{ color: '#36D1DC', mb: 3 }} 
                        />
                        <Typography variant="h6" sx={{ color: '#36D1DC', mb: 1 }}>
                            AI Analysis in Progress
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Analyzing your trading patterns and performance...
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Info Card */}
            {!analysis && !loading && (
                <Card sx={{
                    background: 'rgba(26, 32, 44, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    mt: 4
                }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TrendingUp sx={{ color: '#36D1DC', mr: 2 }} />
                            <Typography variant="h6" sx={{ color: '#36D1DC' }}>
                                What will be analyzed?
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            Our AI will analyze your complete trading history including performance metrics, 
                            behavioral patterns, time-based trends, symbol performance, and provide personalized 
                            recommendations to improve your trading strategy.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default AITradingCoach;
