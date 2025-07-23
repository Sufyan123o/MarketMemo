from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from api.auth import get_current_user

router = APIRouter()

# Mock portfolio database
user_portfolios = {}

class PortfolioItem(BaseModel):
    ticker: str
    shares: float
    purchase_price: float

class PortfolioHolding(BaseModel):
    id: str
    ticker: str
    shares: float
    purchase_price: float
    current_price: Optional[float] = None
    total_value: Optional[float] = None
    profit_loss: Optional[float] = None

@router.get("/", response_model=List[PortfolioHolding])
async def get_portfolio(current_user: dict = Depends(get_current_user)):
    """Get user's portfolio."""
    uid = current_user["uid"]
    holdings = user_portfolios.get(uid, [])
    
    # In a real implementation, you'd fetch current prices and calculate P&L
    return holdings

@router.post("/")
async def add_to_portfolio(
    item: PortfolioItem, 
    current_user: dict = Depends(get_current_user)
):
    """Add stock to portfolio."""
    uid = current_user["uid"]
    
    if uid not in user_portfolios:
        user_portfolios[uid] = []
    
    holding = PortfolioHolding(
        id=f"{uid}_{item.ticker}_{len(user_portfolios[uid])}",
        ticker=item.ticker.upper(),
        shares=item.shares,
        purchase_price=item.purchase_price
    )
    
    user_portfolios[uid].append(holding)
    return {"message": f"Added {item.shares} shares of {item.ticker} to portfolio"}

@router.delete("/{holding_id}")
async def remove_from_portfolio(
    holding_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Remove holding from portfolio."""
    uid = current_user["uid"]
    
    if uid not in user_portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    user_portfolios[uid] = [
        h for h in user_portfolios[uid] if h.id != holding_id
    ]
    return {"message": "Holding removed from portfolio"}

@router.put("/{holding_id}")
async def update_portfolio_holding(
    holding_id: str,
    item: PortfolioItem,
    current_user: dict = Depends(get_current_user)
):
    """Update portfolio holding."""
    uid = current_user["uid"]
    
    if uid not in user_portfolios:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    for holding in user_portfolios[uid]:
        if holding.id == holding_id:
            holding.shares = item.shares
            holding.purchase_price = item.purchase_price
            return {"message": "Holding updated"}
    
    raise HTTPException(status_code=404, detail="Holding not found")
