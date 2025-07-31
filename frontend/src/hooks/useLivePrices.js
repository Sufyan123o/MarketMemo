import { useState, useEffect } from 'react';
import FinnhubSocket from '../services/FinnhubSocket';

/**
 * Custom hook for live stock prices using WebSocket
 * @param {string[]} symbols - Array of stock symbols to watch
 * @returns {object} - { livePrices, isConnected, error }
 */
const useLivePrices = (symbols = []) => {
    const [livePrices, setLivePrices] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [socket, setSocket] = useState(null);

    // Setup WebSocket once on mount
    useEffect(() => {
        const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

        console.log('useLivePrices: Setting up WebSocket');

        if (!API_KEY) {
            setError('Finnhub API key not configured');
            return;
        }

        // Always create the socket, regardless of initial symbols
        const finnhubSocket = new FinnhubSocket({
            apiKey: API_KEY,
            symbols: [],
            onTrade: (tick) => {
                setLivePrices(prev => ({
                    ...prev,
                    [tick.symbol]: {
                        price: tick.price,
                        timestamp: tick.ts,
                        size: tick.size
                    }
                }));
                setIsConnected(true);
                setError(null);
            }
        });

        setSocket(finnhubSocket);

        return () => {
            if (finnhubSocket) {
                finnhubSocket.stop();
                setIsConnected(false);
            }
        };
    }, []);

    // Update symbols when they change
    useEffect(() => {
        console.log('useLivePrices: Symbol update effect triggered:', {
            hasSocket: !!socket,
            symbolsLength: symbols.length,
            symbols
        });

        if (socket && symbols.length > 0) {
            console.log('🔄 Updating live price symbols:', symbols);
            socket.updateSymbols(symbols);
            socket.start();
        }
    }, [socket, symbols]);

    return {
        livePrices,
        isConnected,
        error,
        /** Get live price for a specific symbol */
        getPriceFor: (symbol) => livePrices[symbol],
        /** Check if symbol has live data */
        isLive: (symbol) => !!livePrices[symbol],
        /** Get count of symbols with live data */
        liveCount: Object.keys(livePrices).length
    };
};

export default useLivePrices;
