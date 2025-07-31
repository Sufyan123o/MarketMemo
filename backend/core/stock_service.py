import requests
from newsapi import NewsApiClient
import os
from dotenv import load_dotenv
import pandas as pd
from typing import Optional, Dict, Any, List
from datetime import datetime, date
import time
from .cache import StockDataCache

load_dotenv()

class StockDataService:
    def __init__(self):
        self.news_api_key = os.getenv("NEWS_API_KEY")
        self.finnhub_api_key = os.getenv("FINNHUB_API_KEY")
        self.alpha_vantage_api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
        self.finnhub_base_url = "https://finnhub.io/api/v1"
        self.alpha_vantage_base_url = "https://www.alphavantage.co/query"
        self.last_request_time = 0
        self.min_request_interval = 1  # 1 second between requests to be respectful
        
        # Initialize cache
        self.cache = StockDataCache()
        
        if not self.news_api_key:
            print("Warning: NEWS_API_KEY not found in environment variables")
        if not self.finnhub_api_key:
            print("Warning: FINNHUB_API_KEY not found in environment variables")
            print("Get a free API key from: https://finnhub.io/")
        if not self.alpha_vantage_api_key:
            print("Warning: ALPHA_VANTAGE_API_KEY not found in environment variables")
            print("Get a free API key from: https://www.alphavantage.co/support/#api-key")

    def _rate_limit_check(self):
        """Rate limiting for Finnhub API - minimal delay to be respectful."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            print(f"Rate limiting: waiting {sleep_time:.1f} seconds...")
            time.sleep(sleep_time)
        self.last_request_time = time.time()

    def _make_finnhub_request(self, endpoint: str, params: Dict[str, str] = None) -> Optional[Dict]:
        """Make a request to Finnhub API with rate limiting and caching."""
        if not self.finnhub_api_key:
            return None
        
        # Create cache key
        cache_key = f"{endpoint}_{str(params) if params else 'no_params'}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            print(f"Using cached data for {endpoint}")
            return cached_data
        
        self._rate_limit_check()
        
        if params is None:
            params = {}
        params['token'] = self.finnhub_api_key
        
        try:
            url = f"{self.finnhub_base_url}/{endpoint}"
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Cache the successful response (1 hour TTL for real-time data, 24 hours for company info)
            ttl_hours = 1 if 'quote' in endpoint else 24
            self.cache.set(cache_key, data)
            
            print(f"API call made to {endpoint} - cached for {ttl_hours} hours")
            return data
            
        except requests.RequestException as e:
            print(f"Error making request to Finnhub API: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    def _make_alpha_vantage_request(self, params: Dict[str, str]) -> Optional[Dict]:
        """Make a request to Alpha Vantage API with rate limiting and caching."""
        if not self.alpha_vantage_api_key:
            print("Alpha Vantage API key not available")
            return None
        
        # Create cache key for Alpha Vantage requests
        cache_key = f"alphavantage_{str(params)}"
        
        # Check cache first
        cached_data = self.cache.get(cache_key)
        if cached_data:
            print(f"Using cached Alpha Vantage data for {params.get('function', 'unknown')}")
            return cached_data
        
        self._rate_limit_check()
        
        params['apikey'] = self.alpha_vantage_api_key
        
        try:
            response = requests.get(self.alpha_vantage_base_url, params=params, timeout=30)
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
            
            # Cache the successful response (Alpha Vantage data changes less frequently)
            self.cache.set(cache_key, data)
            print(f"Alpha Vantage API call made for {params.get('function', 'unknown')} - cached")
            
            return data
            
        except requests.RequestException as e:
            print(f"Error making request to Alpha Vantage API: {e}")
            return None
        except Exception as e:
            print(f"Unexpected Alpha Vantage error: {e}")
            return None

    async def get_stock_data(self, ticker: str, start_date: str = None, end_date: str = None) -> Optional[Dict[str, Any]]:
        """Fetches comprehensive stock data using Finnhub for current data and Alpha Vantage for historical charts"""
        try:
            # Get current quote from Finnhub
            quote_data = self._make_finnhub_request(f"quote", {"symbol": ticker.upper()})
            
            # Get company profile from Finnhub  
            profile_data = self._make_finnhub_request(f"stock/profile2", {"symbol": ticker.upper()})
            
            if not quote_data or quote_data.get('c') is None:
                return {
                    "error": "Data temporarily unavailable",
                    "message": f"Unable to fetch data for {ticker}. This might be due to API limits or invalid ticker."
                }
            
            # Calculate current price metrics
            current_price = quote_data.get('c', 0)  # current price
            previous_close = quote_data.get('pc', 0)  # previous close
            change = current_price - previous_close if current_price and previous_close else 0
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            # Get basic financial metrics from Alpha Vantage if available
            overview_data = None
            if self.alpha_vantage_api_key:
                overview_params = {
                    'function': 'OVERVIEW',
                    'symbol': ticker.upper()
                }
                overview_data = self._make_alpha_vantage_request(overview_params)
            
            # Prepare the base data structure that frontend expects
            stock_data = {
                'ticker': ticker.upper(),
                'company_name': profile_data.get('name', ticker) if profile_data else ticker,
                'current_price': current_price,
                'change_percent': round(change_percent, 2),
                'volume': quote_data.get('v', 0),
                'market_cap': profile_data.get('marketCapitalization') if profile_data else (
                    int(overview_data.get('MarketCapitalization', 0)) if overview_data and overview_data.get('MarketCapitalization') != 'None' else None
                ),
                'pe_ratio': float(overview_data.get('PERatio', 0)) if overview_data and overview_data.get('PERatio') != 'None' else None,
                'dividend_yield': float(overview_data.get('DividendYield', 0)) if overview_data and overview_data.get('DividendYield') != 'None' else None,
                'beta': float(overview_data.get('Beta', 0)) if overview_data and overview_data.get('Beta') != 'None' else None,
                'fifty_two_week_high': float(overview_data.get('52WeekHigh', 0)) if overview_data and overview_data.get('52WeekHigh') != 'None' else None,
                'fifty_two_week_low': float(overview_data.get('52WeekLow', 0)) if overview_data and overview_data.get('52WeekLow') != 'None' else None,
                'day_high': quote_data.get('h', 0),
                'day_low': quote_data.get('l', 0),
                'day_open': quote_data.get('o', 0),
                'previous_close': previous_close,
                'exchange': profile_data.get('exchange') if profile_data else None,
                'currency': profile_data.get('currency', 'USD') if profile_data else 'USD',
                'country': profile_data.get('country') if profile_data else None,
                'industry': profile_data.get('finnhubIndustry') if profile_data else None,
                'website': profile_data.get('weburl') if profile_data else None,
                'logo': profile_data.get('logo') if profile_data else None,
            }
            
            # Get historical data from Alpha Vantage for chart if dates provided
            if self.alpha_vantage_api_key and start_date and end_date:
                time_series_params = {
                    'function': 'TIME_SERIES_DAILY',
                    'symbol': ticker.upper(),
                    'outputsize': 'full'
                }
                
                historical_data = self._make_alpha_vantage_request(time_series_params)
                
                if historical_data and 'Time Series (Daily)' in historical_data:
                    time_series = historical_data['Time Series (Daily)']
                    
                    # Filter data by date range
                    filtered_data = {}
                    for date_str, values in time_series.items():
                        if start_date <= date_str <= end_date:
                            filtered_data[date_str] = values
                    
                    if filtered_data:
                        # Sort dates and extract price data for chart
                        sorted_dates = sorted(filtered_data.keys())
                        
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
                        
                        # Add historical chart data
                        stock_data.update({
                            'dates': dates,
                            'open_prices': open_prices,
                            'high_prices': high_prices,
                            'low_prices': low_prices,
                            'close_prices': close_prices,
                            'volumes': volumes,
                            'has_historical_data': True
                        })
                        
                        print(f"Retrieved {len(dates)} days of historical data for {ticker}")
                    else:
                        print(f"No historical data found for {ticker} in date range {start_date} to {end_date}")
                        stock_data['has_historical_data'] = False
                else:
                    print(f"Failed to get historical data for {ticker}")
                    stock_data['has_historical_data'] = False
            else:
                stock_data['has_historical_data'] = False
            
            print(f"Stock data compiled for {ticker}: Current price ${current_price}, Change {change_percent:.2f}%")
            return stock_data
            
        except Exception as e:
            print(f"Error in get_stock_data for {ticker}: {e}")
            return {
                "error": "Data temporarily unavailable", 
                "message": f"Error fetching data for {ticker}: {str(e)}"
            }

    async def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive stock information using Finnhub for all current data."""
        try:
            # Get current quote from Finnhub
            quote_data = self._make_finnhub_request(f"quote", {"symbol": ticker.upper()})
            
            if not quote_data or quote_data.get('c') is None:
                print(f"No quote data found for ticker: {ticker}")
                return None
            
            # Get company profile from Finnhub
            profile_data = self._make_finnhub_request(f"stock/profile2", {"symbol": ticker.upper()})
            
            # Get basic financial metrics from Finnhub
            basic_financials = self._make_finnhub_request(f"stock/metric", {"symbol": ticker.upper(), "metric": "all"})
            
            current_price = quote_data.get('c', 0)  # current price
            previous_close = quote_data.get('pc', 0)  # previous close
            change = current_price - previous_close if current_price and previous_close else 0
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            # Extract financial metrics from Finnhub's basic financials
            metrics = basic_financials.get('metric', {}) if basic_financials else {}
            
            data = {
                'ticker': ticker.upper(),
                'company_name': profile_data.get('name', ticker) if profile_data else ticker,
                'current_price': current_price,
                'change': round(change, 2),
                'change_percent': round(change_percent, 2),
                'volume': quote_data.get('v', 0),  # volume
                'market_cap': profile_data.get('marketCapitalization') if profile_data else None,
                'pe_ratio': metrics.get('peBasicExclExtraTTM') or metrics.get('peTTM'),
                'price_to_book': metrics.get('pbAnnual'),
                'dividend_yield': metrics.get('dividendYieldIndicatedAnnual'),
                'beta': metrics.get('beta'),
                'eps': metrics.get('epsBasicExclExtraItemsTTM'),
                'revenue_ttm': metrics.get('revenueTTM'),
                'gross_margin': metrics.get('grossMarginTTM'),
                'operating_margin': metrics.get('operatingMarginTTM'),
                'profit_margin': metrics.get('netMarginTTM'),
                'debt_to_equity': metrics.get('totalDebt2totalEquityAnnual'),
                'return_on_equity': metrics.get('roeTTM'),
                'return_on_assets': metrics.get('roaTTM'),
                'fifty_two_week_high': metrics.get('52WeekHigh'),
                'fifty_two_week_low': metrics.get('52WeekLow'),
                'country': profile_data.get('country') if profile_data else None,
                'currency': profile_data.get('currency') if profile_data else 'USD',
                'exchange': profile_data.get('exchange') if profile_data else None,
                'industry': profile_data.get('finnhubIndustry') if profile_data else None,
                'sector': profile_data.get('gsubIndustry') if profile_data else None,
                'website': profile_data.get('weburl') if profile_data else None,
                'logo': profile_data.get('logo') if profile_data else None,
                'day_high': quote_data.get('h', 0),
                'day_low': quote_data.get('l', 0),
                'day_open': quote_data.get('o', 0),
                'previous_close': previous_close,
                'employees': profile_data.get('shareOutstanding') if profile_data else None,
                'description': profile_data.get('name') if profile_data else None,
            }
            
            return data
            
        except Exception as e:
            print(f"Error fetching stock info for {ticker}: {e}")
            return None
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

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics and information."""
        return self.cache.get_cache_stats()
    
    def clear_cache(self) -> bool:
        """Clear all cached data."""
        try:
            self.cache.clear_all()
            return True
        except Exception as e:
            print(f"Error clearing cache: {e}")
            return False
    
    def list_cached_items(self) -> List[Dict[str, Any]]:
        """List all cached items with their details."""
        return self.cache.list_cached_items()

# Global instance
stock_service = StockDataService()
