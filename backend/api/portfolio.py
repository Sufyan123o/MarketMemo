from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import json
import os
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
        
        if action not in ['buy', 'sell']:
            raise HTTPException(status_code=400, detail="Action must be 'buy' or 'sell'")
        
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        
        trade_value = quantity * price
        
        if action == 'buy':
            # Check if user has enough cash
            if portfolio.cash < trade_value:
                raise HTTPException(status_code=400, detail="Insufficient cash for this trade")
            
            # Deduct cash
            portfolio.cash -= trade_value
            
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
                    'first_purchase': datetime.now().isoformat()
                }
        
        elif action == 'sell':
            # Check if user has the position
            if ticker not in portfolio.positions:
                raise HTTPException(status_code=400, detail="You don't own this stock")
            
            current_position = portfolio.positions[ticker]
            if current_position['quantity'] < quantity:
                raise HTTPException(status_code=400, detail="Insufficient shares to sell")
            
            # Add cash
            portfolio.cash += trade_value
            
            # Update position
            new_quantity = current_position['quantity'] - quantity
            if new_quantity == 0:
                # Remove position completely
                del portfolio.positions[ticker]
            else:
                # Update quantity (keep same avg price)
                portfolio.positions[ticker]['quantity'] = new_quantity
        
        # Record the trade
        trade_record = {
            'ticker': ticker,
            'action': action,
            'quantity': quantity,
            'price': price,
            'value': trade_value,
            'timestamp': datetime.now().isoformat()
        }
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
