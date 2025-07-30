import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from pathlib import Path

class StockDataCache:
    def __init__(self, cache_dir: str = "cache", cache_duration_hours: int = 24):
        """
        Simple file-based cache for stock data
        
        Args:
            cache_dir: Directory to store cache files
            cache_duration_hours: How long cache entries are valid (default 24 hours)
        """
        self.cache_dir = Path(cache_dir)
        self.cache_duration_hours = cache_duration_hours
        self.memory_cache = {}  # In-memory cache for faster access
        
        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(exist_ok=True)
        
        # Clean up expired cache files on startup
        self._cleanup_expired_cache()
    
    def _get_cache_file_path(self, cache_key: str) -> Path:
        """Get the file path for a cache key"""
        # Replace invalid filename characters
        safe_key = "".join(c for c in cache_key if c.isalnum() or c in ('-', '_', '.')).rstrip()
        return self.cache_dir / f"{safe_key}.json"
    
    def _is_cache_valid(self, cache_data: Dict[str, Any]) -> bool:
        """Check if cached data is still valid"""
        if 'timestamp' not in cache_data:
            return False
        
        cache_time = datetime.fromisoformat(cache_data['timestamp'])
        expiry_time = cache_time + timedelta(hours=self.cache_duration_hours)
        
        return datetime.now() < expiry_time
    
    def _cleanup_expired_cache(self):
        """Remove expired cache files"""
        try:
            for cache_file in self.cache_dir.glob("*.json"):
                try:
                    with open(cache_file, 'r') as f:
                        cache_data = json.load(f)
                    
                    if not self._is_cache_valid(cache_data):
                        cache_file.unlink()
                        print(f"Removed expired cache file: {cache_file.name}")
                
                except Exception as e:
                    # If we can't read the file, remove it
                    cache_file.unlink()
                    print(f"Removed corrupted cache file: {cache_file.name}")
        
        except Exception as e:
            print(f"Error during cache cleanup: {e}")
    
    def get(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Get data from cache
        
        Args:
            cache_key: Unique identifier for the cached data
            
        Returns:
            Cached data if valid, None if not found or expired
        """
        # Check memory cache first
        if cache_key in self.memory_cache:
            if self._is_cache_valid(self.memory_cache[cache_key]):
                print(f"Cache HIT (memory): {cache_key}")
                return self.memory_cache[cache_key]['data']
            else:
                # Remove expired data from memory
                del self.memory_cache[cache_key]
        
        # Check file cache
        cache_file = self._get_cache_file_path(cache_key)
        
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                
                if self._is_cache_valid(cache_data):
                    # Load into memory cache for faster future access
                    self.memory_cache[cache_key] = cache_data
                    print(f"Cache HIT (file): {cache_key}")
                    return cache_data['data']
                else:
                    # Remove expired file
                    cache_file.unlink()
                    print(f"Cache EXPIRED: {cache_key}")
            
            except Exception as e:
                print(f"Error reading cache file {cache_key}: {e}")
                # Remove corrupted file
                cache_file.unlink()
        
        print(f"Cache MISS: {cache_key}")
        return None
    
    def set(self, cache_key: str, data: Dict[str, Any]):
        """
        Store data in cache
        
        Args:
            cache_key: Unique identifier for the data
            data: Data to cache
        """
        cache_data = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        # Store in memory cache
        self.memory_cache[cache_key] = cache_data
        
        # Store in file cache
        cache_file = self._get_cache_file_path(cache_key)
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2)
            print(f"Cache SET: {cache_key}")
        
        except Exception as e:
            print(f"Error writing cache file {cache_key}: {e}")
    
    def delete(self, cache_key: str):
        """Delete specific cache entry"""
        # Remove from memory
        if cache_key in self.memory_cache:
            del self.memory_cache[cache_key]
        
        # Remove from file
        cache_file = self._get_cache_file_path(cache_key)
        if cache_file.exists():
            cache_file.unlink()
            print(f"Cache DELETED: {cache_key}")
    
    def clear_all(self):
        """Clear all cache data"""
        # Clear memory cache
        self.memory_cache.clear()
        
        # Clear file cache
        for cache_file in self.cache_dir.glob("*.json"):
            cache_file.unlink()
        
        print("All cache cleared")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        file_count = len(list(self.cache_dir.glob("*.json")))
        memory_count = len(self.memory_cache)
        
        # Calculate total cache size
        total_size = 0
        for cache_file in self.cache_dir.glob("*.json"):
            total_size += cache_file.stat().st_size
        
        return {
            'file_cache_entries': file_count,
            'memory_cache_entries': memory_count,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'cache_duration_hours': self.cache_duration_hours
        }
    
    def list_cached_items(self) -> List[Dict[str, Any]]:
        """List all cached items with their timestamps"""
        items = []
        
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                
                items.append({
                    'key': cache_file.stem,
                    'timestamp': cache_data.get('timestamp'),
                    'valid': self._is_cache_valid(cache_data),
                    'size_bytes': cache_file.stat().st_size
                })
            
            except Exception as e:
                items.append({
                    'key': cache_file.stem,
                    'error': str(e),
                    'valid': False
                })
        
        return items

# Global cache instance
cache_dir = Path(__file__).parent.parent / "cache"  # backend/cache relative to this file
stock_cache = StockDataCache(cache_dir=str(cache_dir), cache_duration_hours=24)
