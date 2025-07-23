from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
from typing import List, Dict, Any

class AIAnalysisService:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.analyzer = SentimentIntensityAnalyzer()
        
        if not self.groq_api_key:
            print("Warning: GROQ_API_KEY not found in environment variables")

    def analyze_sentiment(self, articles: List[Dict[str, Any]]) -> float:
        """Analyze sentiment of news articles using VADER sentiment analysis."""
        if not articles:
            return 0.0
            
        sentiment_scores = []
        
        for article in articles:
            if not article:
                continue
                
            # Combine title and description for sentiment analysis
            text = ""
            if article.get('title'):
                text += article['title'] + " "
            if article.get('description'):
                text += article['description']
                
            if text.strip():
                scores = self.analyzer.polarity_scores(text)
                sentiment_scores.append(scores['compound'])
        
        if not sentiment_scores:
            return 0.0
            
        # Return average sentiment score (-1 to 1)
        return sum(sentiment_scores) / len(sentiment_scores)

    def generate_ai_summary(self, articles: List[Dict[str, Any]], ticker: str, investor_level: str = "Beginner") -> str:
        """Generate AI summary of news articles (simplified version)."""
        if not articles:
            return "No news articles available for analysis."
        
        # Get sentiment score
        sentiment_score = self.analyze_sentiment(articles)
        
        # Count of articles
        article_count = len([a for a in articles if a and a.get('title')])
        
        # Create basic summary based on sentiment
        if sentiment_score > 0.1:
            sentiment_text = "positive"
            recommendation = "The recent news appears generally favorable"
        elif sentiment_score < -0.1:
            sentiment_text = "negative" 
            recommendation = "The recent news shows some concerning signals"
        else:
            sentiment_text = "neutral"
            recommendation = "The recent news shows mixed signals"
            
        summary = f"""
Analysis for {ticker}:

• Analyzed {article_count} recent news articles
• Overall sentiment: {sentiment_text} (score: {sentiment_score:.2f})
• {recommendation}

Key headlines analyzed:
"""
        
        # Add top 3 headlines
        for i, article in enumerate(articles[:3]):
            if article and article.get('title'):
                summary += f"• {article['title']}\n"
        
        summary += f"\nNote: This analysis is based on sentiment scoring of recent news. Please conduct thorough research before making investment decisions."
        
        return summary

    def compare_stocks(self, stock1_data: Dict[str, Any], stock2_data: Dict[str, Any]) -> str:
        """Compare two stocks using basic analysis."""
        ticker1 = stock1_data.get('ticker', 'Stock 1')
        ticker2 = stock2_data.get('ticker', 'Stock 2')
        
        comparison = f"""
Comparison: {ticker1} vs {ticker2}

{ticker1}:
• Current Price: ${stock1_data.get('current_price', 'N/A')}
• Market Cap: {stock1_data.get('market_cap', 'N/A')}
• PE Ratio: {stock1_data.get('pe_ratio', 'N/A')}
• News Sentiment: {stock1_data.get('sentiment', 'N/A')}

{ticker2}:
• Current Price: ${stock2_data.get('current_price', 'N/A')}
• Market Cap: {stock2_data.get('market_cap', 'N/A')}
• PE Ratio: {stock2_data.get('pe_ratio', 'N/A')}
• News Sentiment: {stock2_data.get('sentiment', 'N/A')}

Summary: Both stocks have their unique characteristics. Consider your investment goals, risk tolerance, and conduct thorough research before making any investment decisions.

Note: This is a basic comparison. For detailed AI analysis, additional language model integration is required.
"""
        
        return comparison
