from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from api.stocks import router as stocks_router
from api.auth import router as auth_router
from api.portfolio import router as portfolio_router
from api.watchlist import router as watchlist_router
from api.playground import router as playground_router

# Create FastAPI app
app = FastAPI(
    title="SufsTrading AI API",
    description="Backend API for SufsTrading AI stock analysis platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stocks_router, prefix="/api/stocks", tags=["stocks"])
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(portfolio_router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(watchlist_router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(playground_router, prefix="/api/playground", tags=["playground"])

@app.get("/")
async def root():
    return {"message": "SufsTrading AI API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "SufsTrading AI API is operational"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
