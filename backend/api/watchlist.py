from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import jwt
from api.auth import SECRET_KEY, ALGORITHM, fake_users_db

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Mock watchlist database - using a default user for now
user_watchlists = {"default_user": []}

class WatchlistItem(BaseModel):
    ticker: str

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Optional authentication - returns user if valid token, None otherwise"""
    if not credentials:
        return None
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = fake_users_db.get(email)
        return user
    except jwt.PyJWTError:
        return None

def get_user_id(current_user: Optional[dict] = None):
    """Get user ID, defaulting to 'default_user' if no auth"""
    if current_user and "email" in current_user:
        return current_user["email"]
    return "default_user"

@router.get("/", response_model=List[str])
async def get_watchlist(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """Get user's watchlist."""
    uid = get_user_id(current_user)
    return user_watchlists.get(uid, [])

@router.post("/")
async def add_to_watchlist(
    item: WatchlistItem, 
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Add stock to watchlist."""
    uid = get_user_id(current_user)
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
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Remove stock from watchlist."""
    uid = get_user_id(current_user)
    ticker = ticker.upper()
    
    if uid in user_watchlists and ticker in user_watchlists[uid]:
        user_watchlists[uid].remove(ticker)
        return {"message": f"Removed {ticker} from watchlist"}
    else:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist")
