import requests
from newsapi import NewsApiClient
import os
from dotenv import load_dotenv
import pandas as pd
from typing import Optional, Dict, Any, List
from datetime import datetime, date
import time

load_dotenv()

class StockDataService:
    def __init__(self):
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.base_url = "https://www.alphavantage.co/query"
        self.last_request_time = 0
        self.min_request_interval = 12  # Alpha Vantage free tier: 5 requests per minute
        
        if not self.news_api_key:
            print("Warning: NEWS_API_KEY not found in environment variables")
        if not self.alpha_vantage_api_key:
            print("Warning: ALPHA_VANTAGE_API_KEY not found in environment variables")
            print("Get a free API key from: https://www.alphavantage.co/support/#api-key")

    def _rate_limit_check(self):
        """Rate limiting for Alpha Vantage API (5 requests per minute for free tier)."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            print(f"Rate limiting: waiting {sleep_time:.1f} seconds...")
            time.sleep(sleep_time)
        self.last_request_time = time.time()

    def _make_alpha_vantage_request(self, params: Dict[str, str]) -> Optional[Dict]:
        """Make a request to Alpha Vantage API with rate limiting."""
        if not self.alpha_vantage_api_key:
            return None
        
        self._rate_limit_check()
        
        params['apikey'] = self.alpha_vantage_api_key
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Check for API errors
            if 'Error Message' in data:
                print(f"Alpha Vantage Error: {data['Error Message']}")
                return None
            elif 'Note' in data:
                print(f"Alpha Vantage Note: {data['Note']}")
                return None
            elif 'Information' in data:
                print(f"Alpha Vantage Info: {data['Information']}")
                return None
                
            return data
        except requests.exceptions.RequestException as e:
            print(f"Alpha Vantage API request failed: {e}")
            return None
        except Exception as e:
            print(f"Error parsing Alpha Vantage response: {e}")
            return None

    async def get_stock_data(self, ticker: str, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
        """Fetches historical stock data from Alpha Vantage"""
        ## Used for the charts and analysis, all time-series data
        try:
            # Get company overview first
            overview_params = {
                'function': 'OVERVIEW',
                'symbol': ticker.upper()
            }
            
            overview_data = self._make_alpha_vantage_request(overview_params)
            
            # Get historical data
            time_series_params = {
                'function': 'TIME_SERIES_DAILY',
                'symbol': ticker.upper(),
                'outputsize': 'full'  # full gives 20+ years of data
            }
            
            time_series_data = self._make_alpha_vantage_request(time_series_params)
            
            if not time_series_data or 'Time Series (Daily)' not in time_series_data:
                print(f"No time series data found for ticker: {ticker}")
                return None
            
            time_series = time_series_data['Time Series (Daily)']
            
            # Filter data by date range
            filtered_data = {}
            for date_str, values in time_series.items():
                if start_date <= date_str <= end_date:
                    filtered_data[date_str] = values
            
            if not filtered_data:
                print(f"No data found for {ticker} in date range {start_date} to {end_date}")
                return None
            
            # Sort dates
            sorted_dates = sorted(filtered_data.keys())
            
            # Extract price data
            dates = []
            open_prices = []
            high_prices = []
            low_prices = []
            close_prices = []
            volumes = []
            
            for date_str in sorted_dates:
                values = filtered_data[date_str]
                dates.append(date_str)
                open_prices.append(float(values['1. open']))
                high_prices.append(float(values['2. high']))
                low_prices.append(float(values['3. low']))
                close_prices.append(float(values['4. close']))
                volumes.append(int(values['5. volume']))
            
            # Get current price from quote endpoint
            quote_params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker.upper()
            }
            
            quote_data = self._make_alpha_vantage_request(quote_params)
            current_price = 0
            change_percent = 0
            
            if quote_data and 'Global Quote' in quote_data:
                quote = quote_data['Global Quote']
                current_price = float(quote.get('05. price', close_prices[-1] if close_prices else 0))
                change_percent = float(quote.get('10. change percent', '0').replace('%', ''))
            elif close_prices:
                current_price = close_prices[-1]
                if len(close_prices) >= 2:
                    previous = close_prices[-2]
                    change_percent = ((current_price - previous) / previous) * 100
            
            # Prepare response data
            data = {
                'ticker': ticker.upper(),
                'company_name': overview_data.get('Name', ticker) if overview_data else ticker,
                'current_price': current_price,
                'market_cap': int(overview_data.get('MarketCapitalization', 0)) if overview_data and overview_data.get('MarketCapitalization') != 'None' else None,
                'pe_ratio': float(overview_data.get('PERatio', 0)) if overview_data and overview_data.get('PERatio') != 'None' else None,
                'dividend_yield': float(overview_data.get('DividendYield', 0)) if overview_data and overview_data.get('DividendYield') != 'None' else None,
                'beta': float(overview_data.get('Beta', 0)) if overview_data and overview_data.get('Beta') != 'None' else None,
                'fifty_two_week_high': float(overview_data.get('52WeekHigh', 0)) if overview_data and overview_data.get('52WeekHigh') != 'None' else None,
                'fifty_two_week_low': float(overview_data.get('52WeekLow', 0)) if overview_data and overview_data.get('52WeekLow') != 'None' else None,
                'volume': volumes[-1] if volumes else 0,
                'avg_volume': None,  # Alpha Vantage doesn't provide this in overview
                'dates': dates,
                'open_prices': open_prices,
                'high_prices': high_prices,
                'low_prices': low_prices,
                'close_prices': close_prices,
                'volumes': volumes,
                'change_percent': change_percent
            }
                
            return data
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            return None

    async def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get basic stock information using Alpha Vantage."""
        ## Returns the current company info, current price, market cap, PE ratio, etc.
        #used in the watchlist, portfolio, stock cards
        try:
            # Get current quote
            quote_params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker.upper()
            }
            
            quote_data = self._make_alpha_vantage_request(quote_params)
            
            if not quote_data or 'Global Quote' not in quote_data:
                print(f"No quote data found for ticker: {ticker}")
                return None
            
            quote = quote_data['Global Quote']
            
            # Get company overview for additional details
            overview_params = {
                'function': 'OVERVIEW',
                'symbol': ticker.upper()
            }
            
            overview_data = self._make_alpha_vantage_request(overview_params)
            
            current_price = float(quote.get('05. price', 0))
            change_percent = float(quote.get('10. change percent', '0').replace('%', ''))
            volume = int(quote.get('06. volume', 0))
            
            data = {
                'ticker': ticker.upper(),
                'company_name': overview_data.get('Name', ticker) if overview_data else ticker,
                'current_price': current_price,
                'market_cap': int(overview_data.get('MarketCapitalization', 0)) if overview_data and overview_data.get('MarketCapitalization') != 'None' else None,
                'pe_ratio': float(overview_data.get('PERatio', 0)) if overview_data and overview_data.get('PERatio') != 'None' else None,
                'change_percent': change_percent,
                'volume': volume,
                'sector': overview_data.get('Sector') if overview_data else None,
                'industry': overview_data.get('Industry') if overview_data else None,
            }
            
            return data
            
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
