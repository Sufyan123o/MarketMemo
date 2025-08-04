import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Rating,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    TrendingUp,
    TrendingDown,
    Save,
    Today,
    DateRange,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const DailyJournaling = () => {
    const [journalEntries, setJournalEntries] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentEntry, setCurrentEntry] = useState({
        id: null,
        date: dayjs(),
        marketSentiment: '',
        personalMood: 5,
        keyObservations: '',
        tradesPlanned: '',
        tradesExecuted: '',
        lessonsLearned: '',
        tomorrowPlan: '',
        tags: [],
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadJournalEntries();
    }, []);

    const loadJournalEntries = () => {
        // Load from localStorage for now - you can replace with API calls
        const saved = localStorage.getItem('dailyJournalEntries');
        if (saved) {
            setJournalEntries(JSON.parse(saved));
        }
    };

    const saveJournalEntries = (entries) => {
        localStorage.setItem('dailyJournalEntries', JSON.stringify(entries));
        setJournalEntries(entries);
    };

    const handleSaveEntry = () => {
        const entryToSave = {
            ...currentEntry,
            id: currentEntry.id || Date.now(),
            date: selectedDate,
        };

        let updatedEntries;
        if (currentEntry.id) {
            // Update existing entry
            updatedEntries = journalEntries.map(entry => 
                entry.id === currentEntry.id ? entryToSave : entry
            );
        } else {
            // Add new entry
            updatedEntries = [...journalEntries, entryToSave];
        }

        saveJournalEntries(updatedEntries);
        setOpenDialog(false);
        setCurrentEntry({
            id: null,
            date: dayjs(),
            marketSentiment: '',
            personalMood: 5,
            keyObservations: '',
            tradesPlanned: '',
            tradesExecuted: '',
            lessonsLearned: '',
            tomorrowPlan: '',
            tags: [],
        });
        setSnackbar({ open: true, message: 'Journal entry saved successfully!', severity: 'success' });
    };

    const handleEditEntry = (entry) => {
        setCurrentEntry(entry);
        setSelectedDate(dayjs(entry.date));
        setOpenDialog(true);
    };

    const handleDeleteEntry = (id) => {
        const updatedEntries = journalEntries.filter(entry => entry.id !== id);
        saveJournalEntries(updatedEntries);
        setSnackbar({ open: true, message: 'Journal entry deleted', severity: 'info' });
    };

    const handleNewEntry = () => {
        setCurrentEntry({
            id: null,
            date: dayjs(),
            marketSentiment: '',
            personalMood: 5,
            keyObservations: '',
            tradesPlanned: '',
            tradesExecuted: '',
            lessonsLearned: '',
            tomorrowPlan: '',
            tags: [],
        });
        setSelectedDate(dayjs());
        setOpenDialog(true);
    };

    const formatDate = (date) => {
        return dayjs(date).format('dddd, MMMM D, YYYY');
    };

    const getMoodColor = (mood) => {
        if (mood <= 2) return '#f44336';
        if (mood <= 4) return '#ff9800';
        if (mood <= 6) return '#ffeb3b';
        if (mood <= 8) return '#8bc34a';
        return '#4caf50';
    };

    const getSentimentChip = (sentiment) => {
        const colors = {
            bullish: 'success',
            bearish: 'error',
            neutral: 'default',
            uncertain: 'warning',
        };
        return (
            <Chip 
                label={sentiment} 
                color={colors[sentiment] || 'default'} 
                size="small" 
            />
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ color: '#36D1DC', fontWeight: 700 }}>
                    Daily Trading Journal
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Track your daily trading thoughts, emotions, and lessons learned
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Quick Stats */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="h6">Total Entries</Typography>
                                <Typography variant="h4" color="primary">
                                    {journalEntries.length}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="h6">This Month</Typography>
                                <Typography variant="h4" color="secondary">
                                    {journalEntries.filter(entry => 
                                        dayjs(entry.date).month() === dayjs().month()
                                    ).length}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="h6">Average Mood</Typography>
                                <Typography variant="h4" sx={{ color: '#ff9800' }}>
                                    {journalEntries.length > 0 
                                        ? (journalEntries.reduce((acc, entry) => acc + entry.personalMood, 0) / journalEntries.length).toFixed(1)
                                        : '0.0'
                                    }
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleNewEntry}
                                    sx={{ background: 'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)' }}
                                >
                                    New Entry
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Journal Entries List */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Journal Entries
                            </Typography>
                            {journalEntries.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No journal entries yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Start documenting your daily trading journey
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={handleNewEntry}
                                    >
                                        Create First Entry
                                    </Button>
                                </Box>
                            ) : (
                                <List>
                                    {journalEntries
                                        .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
                                        .map((entry, index) => (
                                            <React.Fragment key={entry.id}>
                                                <ListItem alignItems="flex-start">
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                <Typography variant="h6">
                                                                    {formatDate(entry.date)}
                                                                </Typography>
                                                                {entry.marketSentiment && getSentimentChip(entry.marketSentiment)}
                                                                <Chip
                                                                    label={`Mood: ${entry.personalMood}/10`}
                                                                    size="small"
                                                                    sx={{ 
                                                                        backgroundColor: getMoodColor(entry.personalMood),
                                                                        color: 'white'
                                                                    }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Box>
                                                                {entry.keyObservations && (
                                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                                        <strong>Key Observations:</strong> {entry.keyObservations.substring(0, 100)}
                                                                        {entry.keyObservations.length > 100 && '...'}
                                                                    </Typography>
                                                                )}
                                                                {entry.lessonsLearned && (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        <strong>Lessons Learned:</strong> {entry.lessonsLearned.substring(0, 100)}
                                                                        {entry.lessonsLearned.length > 100 && '...'}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton onClick={() => handleEditEntry(entry)}>
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDeleteEntry(entry.id)}>
                                                            <Delete />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                                {index < journalEntries.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Journal Entry Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {currentEntry.id ? 'Edit Journal Entry' : 'New Journal Entry'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Date"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Market Sentiment</InputLabel>
                                <Select
                                    value={currentEntry.marketSentiment}
                                    onChange={(e) => setCurrentEntry({...currentEntry, marketSentiment: e.target.value})}
                                >
                                    <MenuItem value="bullish">Bullish</MenuItem>
                                    <MenuItem value="bearish">Bearish</MenuItem>
                                    <MenuItem value="neutral">Neutral</MenuItem>
                                    <MenuItem value="uncertain">Uncertain</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography component="legend">Personal Mood (1-10)</Typography>
                            <Rating
                                name="personal-mood"
                                value={currentEntry.personalMood}
                                max={10}
                                onChange={(event, newValue) => {
                                    setCurrentEntry({...currentEntry, personalMood: newValue});
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Key Market Observations"
                                value={currentEntry.keyObservations}
                                onChange={(e) => setCurrentEntry({...currentEntry, keyObservations: e.target.value})}
                                placeholder="What did you observe in the market today?"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Trades Planned"
                                value={currentEntry.tradesPlanned}
                                onChange={(e) => setCurrentEntry({...currentEntry, tradesPlanned: e.target.value})}
                                placeholder="What trades did you plan?"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Trades Executed"
                                value={currentEntry.tradesExecuted}
                                onChange={(e) => setCurrentEntry({...currentEntry, tradesExecuted: e.target.value})}
                                placeholder="What trades did you actually execute?"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Lessons Learned"
                                value={currentEntry.lessonsLearned}
                                onChange={(e) => setCurrentEntry({...currentEntry, lessonsLearned: e.target.value})}
                                placeholder="What did you learn today?"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Tomorrow's Plan"
                                value={currentEntry.tomorrowPlan}
                                onChange={(e) => setCurrentEntry({...currentEntry, tomorrowPlan: e.target.value})}
                                placeholder="What's your plan for tomorrow?"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button 
                        onClick={handleSaveEntry}
                        variant="contained"
                        startIcon={<Save />}
                    >
                        Save Entry
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({...snackbar, open: false})}
            >
                <Alert 
                    onClose={() => setSnackbar({...snackbar, open: false})} 
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DailyJournaling;
