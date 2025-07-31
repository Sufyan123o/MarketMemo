from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import jwt
import json
import os
from api.auth import SECRET_KEY, ALGORITHM, fake_users_db

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Persistent watchlist database
WATCHLISTS_FILE = "watchlists.json"

def load_watchlists():
    """Load watchlists from file"""
    try:
        if os.path.exists(WATCHLISTS_FILE):
            with open(WATCHLISTS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading watchlists: {e}")
    return {}

def save_watchlists(watchlists_db):
    """Save watchlists to file"""
    try:
        with open(WATCHLISTS_FILE, 'w') as f:
            json.dump(watchlists_db, f, indent=2)
    except Exception as e:
        print(f"Error saving watchlists: {e}")

# Load existing watchlists or create empty database
user_watchlists = load_watchlists()

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
        save_watchlists(user_watchlists)  # Save to file
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
        save_watchlists(user_watchlists)  # Save to file
        return {"message": f"Removed {ticker} from watchlist"}
    else:
        raise HTTPException(status_code=404, detail=f"{ticker} not found in watchlist")
