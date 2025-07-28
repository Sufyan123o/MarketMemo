from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from api.auth import get_current_user

router = APIRouter()

# Mock playground database
user_playground_portfolios = {}

class TradeRequest(BaseModel):
    ticker: str
    quantity: float
    price: float
    action: str  # "buy" or "sell"

@router.get("/portfolio")
async def get_playground_portfolio(current_user: dict = Depends(get_current_user)):
    """Get user's playground portfolio."""
    uid = current_user["uid"]
    return user_playground_portfolios.get(uid, {"cash": 100000, "holdings": {}})

@router.post("/trade")
async def execute_trade(
    trade: TradeRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Execute a trade in the playground."""
    uid = current_user["uid"]
    
    if uid not in user_playground_portfolios:
        user_playground_portfolios[uid] = {"cash": 100000, "holdings": {}}
    
    portfolio = user_playground_portfolios[uid]
    total_cost = trade.quantity * trade.price
    
    if trade.action.lower() == "buy":
        if portfolio["cash"] < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        
        portfolio["cash"] -= total_cost
        if trade.ticker in portfolio["holdings"]:
            portfolio["holdings"][trade.ticker] += trade.quantity
        else:
            portfolio["holdings"][trade.ticker] = trade.quantity
            
        return {"message": f"Bought {trade.quantity} shares of {trade.ticker}"}
    
    elif trade.action.lower() == "sell":
        if trade.ticker not in portfolio["holdings"] or portfolio["holdings"][trade.ticker] < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        portfolio["cash"] += total_cost
        portfolio["holdings"][trade.ticker] -= trade.quantity
        
        if portfolio["holdings"][trade.ticker] == 0:
            del portfolio["holdings"][trade.ticker]
            
        return {"message": f"Sold {trade.quantity} shares of {trade.ticker}"}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'buy' or 'sell'")


#!This can be improved
@router.get("/health-report")
async def get_health_report(current_user: dict = Depends(get_current_user)):
    """Get portfolio health report."""
    uid = current_user["uid"]
    portfolio = user_playground_portfolios.get(uid, {"cash": 100000, "holdings": {}})
    
    # Mock health report
    return {
        "total_value": portfolio["cash"] + sum(portfolio["holdings"].values()) * 100,  # Mock calculation
        "cash": portfolio["cash"],
        "holdings_count": len(portfolio["holdings"]),
        "diversification_score": min(len(portfolio["holdings"]) * 20, 100),
        "risk_level": "Medium",
        "recommendations": [
            "Consider diversifying across more sectors",
            "Monitor your cash allocation"
        ]
    }
