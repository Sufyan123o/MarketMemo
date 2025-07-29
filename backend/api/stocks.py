from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from core.stock_service import stock_service
from core.ai_service_simple import AIAnalysisService

# Create AI service instance
ai_service = AIAnalysisService()

router = APIRouter()

class StockAnalysisRequest(BaseModel):
    ticker: str
    investor_level: str = "Beginner"

class ComparisonRequest(BaseModel):
    ticker1: str
    ticker2: str
    investor_level: str = "Beginner"

class TechnicalAnalysisRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    indicators: List[str] = []

class ScreeningRequest(BaseModel):
    prompt: str

@router.get("/data/{ticker}")
async def get_stock_data(
    ticker: str, 
    start_date: str, 
    end_date: str
):
    """Get historical stock data for a ticker."""
    data = await stock_service.get_stock_data(ticker.upper(), start_date, end_date)
    if not data:
        # Return empty structure instead of 404 to prevent frontend crashes
        return {
            "ticker": ticker,
            "error": "Data temporarily unavailable",
            "dates": [],
            "close_prices": [],
            "volumes": [],
            "current_price": 0,
            "change_percent": 0
        }
    return data

@router.get("/info/{ticker}")
async def get_stock_info(ticker: str):
    """Get basic stock information."""
    data = await stock_service.get_stock_info(ticker.upper())
    if not data:
        # Return empty structure instead of 404 to prevent frontend crashes
        return {
            "ticker": ticker,
            "error": "Info temporarily unavailable",
            "current_price": 0,
            "market_cap": "N/A",
            "pe_ratio": "N/A",
            "change_percent": 0
        }
    return data

@router.get("/news/{ticker}")
async def get_stock_news(ticker: str):
    """Get financial news for a stock."""
    news = await stock_service.get_financial_news(ticker)
    return news

@router.get("/sentiment/{ticker}")
async def get_news_sentiment(ticker: str):
    """Get sentiment analysis of stock news."""
    news = await stock_service.get_financial_news(ticker)
    sentiment = ai_service.analyze_sentiment(news)
    return {"sentiment": sentiment, "news_count": len(news)}

@router.post("/ai/analysis")
async def get_ai_analysis(request: StockAnalysisRequest):
    """Get AI analysis for a single stock."""
    news = await stock_service.get_financial_news(request.ticker)
    analysis = ai_service.generate_ai_summary(news, request.ticker, request.investor_level)
    sentiment = ai_service.analyze_sentiment(news)
    
    return {
        "ticker": request.ticker,
        "analysis": analysis,
        "sentiment": sentiment,
        "news_count": len(news)
    }

@router.post("/ai/comparison")
async def get_ai_comparison(request: ComparisonRequest):
    """Get AI comparison between two stocks."""
    news1 = await stock_service.get_financial_news(request.ticker1)
    news2 = await stock_service.get_financial_news(request.ticker2)
    
    # Get stock data for both tickers
    stock1_info = await stock_service.get_stock_info(request.ticker1)
    stock2_info = await stock_service.get_stock_info(request.ticker2)
    
    # Prepare data for comparison
    stock1_data = {
        'ticker': request.ticker1,
        'current_price': stock1_info.get('currentPrice'),
        'market_cap': stock1_info.get('marketCap'),
        'pe_ratio': stock1_info.get('trailingPE'),
        'sentiment': ai_service.analyze_sentiment(news1)
    }
    
    stock2_data = {
        'ticker': request.ticker2,
        'current_price': stock2_info.get('currentPrice'),
        'market_cap': stock2_info.get('marketCap'),
        'pe_ratio': stock2_info.get('trailingPE'),
        'sentiment': ai_service.analyze_sentiment(news2)
    }
    
    comparison = ai_service.compare_stocks(stock1_data, stock2_data)
    
    return {
        "ticker1": request.ticker1,
        "ticker2": request.ticker2,
        "comparison": comparison,
        "sentiment1": ai_service.analyze_sentiment(news1),
        "sentiment2": ai_service.analyze_sentiment(news2)
    }

@router.get("/prediction/{ticker}")
async def get_price_prediction(ticker: str):
    """Get price prediction for a stock (placeholder)."""
    # This would integrate with the Prophet model from the original backend
    #a prophet model is not implemented yet
    # This is a placeholder response
    return {
        "ticker": ticker,
        "prediction": "Price prediction feature coming soon",
        "forecast_days": 30
    }

@router.post("/technical")
async def get_technical_analysis(request: TechnicalAnalysisRequest):
    """Get technical analysis indicators (placeholder)."""
    # This would integrate with the technical analysis from the original backend
    return {
        "ticker": request.ticker,
        "indicators": request.indicators,
        "message": "Technical analysis feature coming soon"
    }

@router.post("/screen")
async def screen_stocks(request: ScreeningRequest):
    """Screen stocks using natural language (placeholder)."""
    # This would integrate with the AI screener from the original backend
    return {
        "prompt": request.prompt,
        "results": [],
        "message": "Stock screening feature coming soon"
    }
