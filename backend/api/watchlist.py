from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from api.auth import get_current_user

router = APIRouter()

# Mock watchlist database
user_watchlists = {}

class WatchlistItem(BaseModel):
    ticker: str

@router.get("/", response_model=List[str])
async def get_watchlist(current_user: dict = Depends(get_current_user)):
    """Get user's watchlist."""
    uid = current_user["uid"]
    return user_watchlists.get(uid, [])

@router.post("/")
async def add_to_watchlist(
    item: WatchlistItem, 
    current_user: dict = Depends(get_current_user)
):
    """Add stock to watchlist."""
    uid = current_user["uid"]
    ticker = item.ticker.upper()
    
    if uid not in user_watchlists:
        user_watchlists[uid] = []
    
    if ticker not in user_watchlists[uid]:
        user_watchlists[uid].append(ticker)
        return {"message": f"Added {ticker} to watchlist"}
    else:
        raise HTTPException(status_code=400, detail=f"{ticker} already in watchlist")

@router.delete("/{ticker}")
async def remove_from_watchlist(
    ticker: str, 
    current_user: dict = Depends(get_current_user)
):
    """Remove stock from watchlist."""
    uid = current_user["uid"]
    ticker = ticker.upper()
    
    if uid in user_watchlists and ticker in user_watchlists[uid]:
        user_watchlists[uid].remove(ticker)
        return {"message": f"Removed {ticker} from watchlist"}
    else:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist")
