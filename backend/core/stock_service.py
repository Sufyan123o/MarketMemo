import yfinance as yf
from newsapi import NewsApiClient
import os
from dotenv import load_dotenv
import pandas as pd
from typing import Optional, Dict, Any, List
from datetime import datetime, date

load_dotenv()

class StockDataService:
    def __init__(self):
        self.news_api_key = os.getenv("NEWS_API_KEY")
        if not self.news_api_key:
            print("Warning: NEWS_API_KEY not found in environment variables")

    async def get_stock_data(self, ticker: str, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
        """Fetches historical stock data from yFinance."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info or info.get('regularMarketPrice') is None:
                return None
                
            hist_data = stock.history(start=start_date, end=end_date)
            if hist_data.empty:
                return None
            
            # Prepare response data
            data = {
                'ticker': ticker,
                'company_name': info.get('longName', ticker),
                'current_price': info.get('regularMarketPrice', 0),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'dividend_yield': info.get('dividendYield'),
                'beta': info.get('beta'),
                'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                'volume': info.get('volume'),
                'avg_volume': info.get('averageVolume'),
                'dates': hist_data.index.strftime('%Y-%m-%d').tolist(),
                'open_prices': hist_data['Open'].tolist(),
                'high_prices': hist_data['High'].tolist(),
                'low_prices': hist_data['Low'].tolist(),
                'close_prices': hist_data['Close'].tolist(),
                'volumes': hist_data['Volume'].tolist(),
            }
            
            # Calculate change percentage
            if len(data['close_prices']) >= 2:
                current = data['close_prices'][-1]
                previous = data['close_prices'][-2]
                data['change_percent'] = ((current - previous) / previous) * 100
            else:
                data['change_percent'] = 0
                
            return data
            
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            return None

    async def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get basic stock information."""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            if not info:
                return None
                
            return {
                'ticker': ticker,
                'company_name': info.get('longName', ticker),
                'current_price': info.get('regularMarketPrice', 0),
                'market_cap': info.get('marketCap'),
                'pe_ratio': info.get('trailingPE'),
                'change_percent': info.get('regularMarketChangePercent', 0),
                'volume': info.get('volume'),
                'sector': info.get('sector'),
                'industry': info.get('industry'),
            }
            
        except Exception as e:
            print(f"Error fetching info for {ticker}: {e}")
            return None

    async def get_financial_news(self, ticker_symbol: str) -> List[Dict[str, Any]]:
        """Fetches financial news from NewsAPI."""
        if not self.news_api_key:
            return []
            
        try:
            newsapi = NewsApiClient(api_key=self.news_api_key)
            response = newsapi.get_everything(
                q=ticker_symbol, 
                language='en', 
                sort_by='relevancy', 
                page_size=20
            )
            return response.get('articles', [])
        except Exception as e:
            print(f"Error fetching news for {ticker_symbol}: {e}")
            return []

    def normalize_prices(self, price_data: List[float]) -> List[float]:
        """Normalize prices to start at 100 for comparison."""
        if not price_data or len(price_data) == 0:
            return []
        
        first_price = price_data[0]
        return [(price / first_price) * 100 for price in price_data]

# Global instance
stock_service = StockDataService()
