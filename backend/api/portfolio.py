from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
import json
import os
import csv
import io
import uuid
from datetime import datetime
from pydantic import BaseModel
from api.auth import get_current_user

router = APIRouter()

# Data models
class TradeRequest(BaseModel):
    ticker: str
    action: str  # 'buy' or 'sell'
    quantity: int
    price: float
    commission: Optional[float] = 0.0

class Portfolio(BaseModel):
    cash: float
    positions: Dict[str, Dict[str, Any]]
    trades: List[Dict[str, Any]]
    created_at: str
    updated_at: str

# Portfolio data storage
PORTFOLIOS_FILE = "portfolios.json"

def load_portfolios():
    """Load portfolios from file"""
    try:
        if os.path.exists(PORTFOLIOS_FILE):
            with open(PORTFOLIOS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading portfolios: {e}")
    return {}

def save_portfolios(portfolios_db):
    """Save portfolios to file"""
    try:
        with open(PORTFOLIOS_FILE, 'w') as f:
            json.dump(portfolios_db, f, indent=2)
    except Exception as e:
        print(f"Error saving portfolios: {e}")

# Load existing portfolios or create empty database
user_portfolios = load_portfolios()

def get_portfolio_data(user_id: str) -> Portfolio:
    """Load portfolio data for user or create default portfolio"""
    if user_id in user_portfolios:
        return Portfolio(**user_portfolios[user_id])
    
    # Create default portfolio with $100,000 starting cash
    default_portfolio = Portfolio(
        cash=100000.0,
        positions={},
        trades=[],
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
    user_portfolios[user_id] = default_portfolio.dict()
    return default_portfolio

def save_portfolio_data(user_id: str, portfolio: Portfolio):
    """Save portfolio data for user"""
    portfolio.updated_at = datetime.now().isoformat()
    user_portfolios[user_id] = portfolio.dict()
    save_portfolios(user_portfolios)  # Save to file

@router.get("/")
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    """Get current portfolio status"""
    try:
        print(f"Portfolio request from user: {current_user}")  # Debug line
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        return {
            "success": True,
            "data": portfolio.dict()
        }
    except Exception as e:
        print(f"Portfolio error: {str(e)}")  # Debug line
        raise HTTPException(status_code=500, detail=f"Error fetching portfolio: {str(e)}")

@router.post("/trade")
async def execute_trade(trade_request: TradeRequest, current_user: dict = Depends(get_current_user)):
    """Execute a buy or sell trade"""
    try:
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        ticker = trade_request.ticker.upper()
        action = trade_request.action.lower()
        quantity = trade_request.quantity
        price = trade_request.price
        
        # For market orders (when price is 0 or negative), get current market price
        if price <= 0:
            # Try to get live price from cache first
            cache_file = f"quote_symbol{ticker.replace(':', '')}.json"
            cache_path = os.path.join("cache", cache_file)
            if os.path.exists(cache_path):
                try:
                    with open(cache_path, 'r') as f:
                        cache_data = json.load(f)
                        cached_price = cache_data.get('data', {}).get('c', 0)
                        if cached_price > 0:
                            price = cached_price
                            print(f"Using cached market price for {ticker}: ${price}")
                except Exception as e:
                    print(f"Error reading cached price for {ticker}: {e}")
            
            if price <= 0:
                raise HTTPException(status_code=400, detail=f"Unable to get market price for {ticker}")
        
        if action not in ['buy', 'sell']:
            raise HTTPException(status_code=400, detail="Action must be 'buy' or 'sell'")
        
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        
        trade_value = quantity * price
        
        # Calculate realized P&L for sell trades using FIFO method
        realized_pnl = 0.0
        exchange = "Unknown"
        market_sector = "Unknown"
        matched_trade_ids = []  # Track which buy trades this sell matches against
        
        if action == 'sell' and ticker in portfolio.positions:
            current_position = portfolio.positions[ticker]
            # Simple P&L calculation: (sell_price - avg_cost) * quantity_sold
            realized_pnl = (price - current_position['avg_price']) * quantity
            
            # For more detailed tracking, find matching buy trades
            # This creates a paper trail for tax reporting
            remaining_to_match = quantity
            for trade in reversed(portfolio.trades):  # FIFO: match oldest buys first
                if (trade.get('symbol') == ticker and 
                    trade.get('side') == 'BUY' and 
                    remaining_to_match > 0):
                    
                    # Track which buy trades this sell is matched against
                    matched_trade_ids.append(trade.get('trade_id', ''))
                    buy_quantity = trade.get('quantity', 0)
                    
                    if buy_quantity <= remaining_to_match:
                        remaining_to_match -= buy_quantity
                    else:
                        remaining_to_match = 0
        
        # Try to get exchange and sector info from cache or API
        try:
            # Check if we have cached stock profile data
            cache_file = f"stockprofile2_symbol{ticker}.json"
            cache_path = os.path.join("cache", cache_file)
            if os.path.exists(cache_path):
                with open(cache_path, 'r') as f:
                    cache_data = json.load(f)
                    stock_data = cache_data.get('data', {})
                    exchange = stock_data.get('exchange', 'Unknown')
                    market_sector = stock_data.get('finnhubIndustry', 'Unknown')
        except Exception as e:
            print(f"Could not load stock profile for {ticker}: {e}")
        
        # Record the trade with comprehensive data first
        trade_timestamp = datetime.now()
        trade_record = {
            'trade_id': str(uuid.uuid4()),
            'account_id': uid,
            'symbol': ticker,
            'instrument_type': 'stock',  # Default to stock for now
            'side': 'BUY' if action == 'buy' else 'SELL',
            'quantity': quantity,
            'price': price,
            'trade_date': trade_timestamp.strftime('%Y-%m-%d'),
            'trade_time': trade_timestamp.strftime('%H:%M:%S'),
            'commission': trade_request.commission,
            'currency': 'USD',
            'gross_value': trade_value,
            'net_value': trade_value + (trade_request.commission if action == 'buy' else -trade_request.commission),
            'realized_pnl': realized_pnl,
            'matched_trade_ids': matched_trade_ids if action == 'sell' else [],  # Track buy/sell relationships
            'exchange': exchange,
            'market_sector': market_sector,
            # Legacy fields for backward compatibility
            'ticker': ticker,
            'action': action,
            'value': trade_value,
            'timestamp': trade_timestamp.isoformat()
        }
        
        # Apply commission to trade value
        actual_cost = trade_value + trade_request.commission
        actual_proceeds = trade_value - trade_request.commission
        
        if action == 'buy':
            # Check if user has enough cash including commission
            if portfolio.cash < actual_cost:
                raise HTTPException(status_code=400, detail="Insufficient cash for this trade including commission")
            
            # Deduct cash (including commission)
            portfolio.cash -= actual_cost
            
            # Update position
            if ticker in portfolio.positions:
                # Calculate new average price
                current_position = portfolio.positions[ticker]
                current_quantity = current_position['quantity']
                current_avg_price = current_position['avg_price']
                
                total_cost = (current_quantity * current_avg_price) + trade_value
                new_quantity = current_quantity + quantity
                new_avg_price = total_cost / new_quantity
                
                portfolio.positions[ticker] = {
                    'quantity': new_quantity,
                    'avg_price': new_avg_price,
                    'first_purchase': current_position['first_purchase']
                }
            else:
                # New position
                portfolio.positions[ticker] = {
                    'quantity': quantity,
                    'avg_price': price,
                    'first_purchase': trade_timestamp.isoformat()
                }
        
        elif action == 'sell':
            # Check if user has the position
            if ticker not in portfolio.positions:
                raise HTTPException(status_code=400, detail="You don't own this stock")
            
            current_position = portfolio.positions[ticker]
            if current_position['quantity'] < quantity:
                raise HTTPException(status_code=400, detail="Insufficient shares to sell")
            
            # Add cash (minus commission)
            portfolio.cash += actual_proceeds
            
            # Update position
            new_quantity = current_position['quantity'] - quantity
            if new_quantity == 0:
                # Remove position completely
                del portfolio.positions[ticker]
            else:
                # Update quantity (keep same avg price)
                portfolio.positions[ticker]['quantity'] = new_quantity
        portfolio.trades.append(trade_record)
        
        # Save updated portfolio
        save_portfolio_data(uid, portfolio)
        
        return {
            "success": True,
            "message": f"Successfully {action}ed {quantity} shares of {ticker} at ${price:.2f}",
            "trade": trade_record,
            "portfolio": portfolio.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing trade: {str(e)}")

@router.get("/trades/pnl-breakdown")
async def get_pnl_breakdown(current_user: dict = Depends(get_current_user)):
    """Get detailed P&L breakdown showing buy/sell matches"""
    try:
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        
        pnl_breakdown = []
        
        # Find all sell trades and their matched buys
        for trade in portfolio.trades:
            if trade.get('side') == 'SELL' and trade.get('matched_trade_ids'):
                sell_trade = trade
                matched_buys = []
                
                # Find the corresponding buy trades
                for buy_id in trade.get('matched_trade_ids', []):
                    for buy_trade in portfolio.trades:
                        if buy_trade.get('trade_id') == buy_id:
                            matched_buys.append(buy_trade)
                            break
                
                # Calculate detailed P&L for this sell
                pnl_breakdown.append({
                    'sell_trade_id': sell_trade.get('trade_id'),
                    'symbol': sell_trade.get('symbol'),
                    'sell_date': sell_trade.get('trade_date'),
                    'sell_price': sell_trade.get('price'),
                    'sell_quantity': sell_trade.get('quantity'),
                    'matched_buys': [
                        {
                            'buy_trade_id': buy.get('trade_id'),
                            'buy_date': buy.get('trade_date'),
                            'buy_price': buy.get('price'),
                            'buy_quantity': buy.get('quantity')
                        } for buy in matched_buys
                    ],
                    'realized_pnl': sell_trade.get('realized_pnl', 0),
                    'commission_total': sell_trade.get('commission', 0) + sum(buy.get('commission', 0) for buy in matched_buys)
                })
        
        return {
            "success": True,
            "data": pnl_breakdown
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating P&L breakdown: {str(e)}")

@router.get("/trades/export")
async def export_trades_csv(current_user: dict = Depends(get_current_user)):
    """Export trade history as CSV"""
    try:
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            'trade_id', 'account_id', 'symbol', 'instrument_type', 'side', 
            'quantity', 'price', 'trade_date', 'trade_time', 
            'commission', 'currency', 'gross_value', 'net_value', 'realized_pnl',
            'matched_trade_ids', 'exchange', 'market_sector'
        ]
        writer.writerow(headers)
        
        # Write trade data
        for trade in portfolio.trades:
            row = [
                trade.get('trade_id', ''),
                trade.get('account_id', uid),
                trade.get('symbol', trade.get('ticker', '')),
                trade.get('instrument_type', 'stock'),
                trade.get('side', trade.get('action', '').upper()),
                trade.get('quantity', 0),
                trade.get('price', 0),
                trade.get('trade_date', ''),
                trade.get('trade_time', ''),
                trade.get('commission', 0),
                trade.get('currency', 'USD'),
                trade.get('gross_value', trade.get('value', 0)),
                trade.get('net_value', trade.get('value', 0)),
                trade.get('realized_pnl', 0),
                ','.join(trade.get('matched_trade_ids', [])),  # Join IDs with commas
                trade.get('exchange', 'Unknown'),
                trade.get('market_sector', 'Unknown')
            ]
            writer.writerow(row)
        
        # Prepare response
        output.seek(0)
        response = StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename="trading_history_{uid}_{datetime.now().strftime("%Y%m%d")}.csv"'}
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting trades: {str(e)}")

@router.get("/trades")
async def get_trade_history(current_user: dict = Depends(get_current_user)):
    """Get trade history"""
    try:
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        return {
            "success": True,
            "data": portfolio.trades
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trade history: {str(e)}")

@router.get("/stats")
async def get_portfolio_stats(current_user: dict = Depends(get_current_user)):
    """Get comprehensive portfolio statistics including realized P&L"""
    try:
        uid = current_user["uid"]
        portfolio = get_portfolio_data(uid)
        
        # Calculate total realized P&L from all trades
        total_realized_pnl = sum(trade.get('realized_pnl', 0) for trade in portfolio.trades)
        
        # Calculate initial portfolio value (starting cash)
        initial_value = 100000.0  # Default starting amount
        
        # Calculate current portfolio value (cash + positions value)
        # Note: Frontend will add current position values using live prices
        current_cash = portfolio.cash
        
        return {
            "success": True,
            "data": {
                "cash": current_cash,
                "positions": portfolio.positions,
                "total_realized_pnl": total_realized_pnl,
                "initial_value": initial_value,
                "trade_count": len(portfolio.trades)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio stats: {str(e)}")

@router.get("/live-price/{ticker}")
async def get_live_price(ticker: str, current_user: dict = Depends(get_current_user)):
    """Get current live price for a ticker"""
    try:
        ticker = ticker.upper()
        
        # Try to get live price from cache
        cache_file = f"quote_symbol{ticker.replace(':', '')}.json"
        cache_path = os.path.join("cache", cache_file)
        
        if os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
                price_data = cache_data.get('data', {})
                current_price = price_data.get('c', 0)
                
                if current_price > 0:
                    return {
                        "success": True,
                        "data": {
                            "ticker": ticker,
                            "price": current_price,
                            "change": price_data.get('d', 0),
                            "change_percent": price_data.get('dp', 0),
                            "high": price_data.get('h', 0),
                            "low": price_data.get('l', 0),
                            "open": price_data.get('o', 0),
                            "previous_close": price_data.get('pc', 0),
                            "timestamp": cache_data.get('timestamp', '')
                        }
                    }
        
        raise HTTPException(status_code=404, detail=f"No price data available for {ticker}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching live price: {str(e)}")

@router.delete("/reset")
async def reset_portfolio(current_user: dict = Depends(get_current_user)):
    """Reset portfolio to initial state (for testing)"""
    try:
        uid = current_user["uid"]
        default_portfolio = Portfolio(
            cash=100000.0,
            positions={},
            trades=[],
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )
        save_portfolio_data(uid, default_portfolio)
        
        return {
            "success": True,
            "message": "Portfolio reset successfully",
            "data": default_portfolio.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting portfolio: {str(e)}")
