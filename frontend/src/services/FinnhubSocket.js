/**
 * Simple WebSocket helper for Finnhub live market data
 * Rate limited to 10 seconds per symbol
 */
class FinnhubSocket {
  constructor({ apiKey, symbols, onTrade }) {
    this.apiKey = apiKey;
    this.symbols = symbols || [];
    this.onTrade = onTrade;
    this.socket = null;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.shouldConnect = true;
    
    // Rate limiting - only update UI every 10 seconds per symbol
    this.lastUpdate = {};
    this.RATE_LIMIT = 10000; // 10 seconds
  }

  start() {
    if (this.isConnecting || (this.socket?.readyState === WebSocket.OPEN)) {
      return;
    }
    
    this.shouldConnect = true;
    this.isConnecting = true;
    
    this.socket = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
    
    this.socket.onopen = () => {
      this.isConnecting = false;
      console.log('✅ Finnhub connected');
      this.symbols.forEach(symbol => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      });
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'ping') {
          this.socket?.send(JSON.stringify({ type: 'pong' }));
        }
        
        if (data.type === 'trade' && data.data) {
          data.data.forEach(trade => {
            const now = Date.now();
            const lastTime = this.lastUpdate[trade.s] || 0;
            
            // Only update UI every 10 seconds per symbol
            if (now - lastTime >= this.RATE_LIMIT) {
              this.lastUpdate[trade.s] = now;
              this.onTrade({
                symbol: trade.s,
                price: trade.p,
                ts: trade.t,
                size: trade.v
              });
            }
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
    };
    
    this.socket.onclose = (event) => {
      this.isConnecting = false;
      
      if (event.code !== 1000 && this.shouldConnect) {
        this.reconnectTimeout = setTimeout(() => {
          if (this.shouldConnect) {
            this.start();
          }
        }, 10000);
      }
    };
  }

  stop() {
    this.shouldConnect = false;
    this.isConnecting = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close(1000);
      this.socket = null;
    }
    
    this.lastUpdate = {};
  }

  updateSymbols(newSymbols) {
    this.symbols = newSymbols;
    this.lastUpdate = {}; // Reset rate limiting for new symbols
    
    console.log(`🔄 Updating symbols: ${newSymbols.join(', ')}`);
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      newSymbols.forEach(symbol => {
        this.socket.send(JSON.stringify({ type: 'subscribe', symbol }));
        console.log(`📊 Subscribed to ${symbol}`);
      });
    } else {
      console.warn('❌ Cannot subscribe - WebSocket not connected');
    }
  }
}

export default FinnhubSocket;
