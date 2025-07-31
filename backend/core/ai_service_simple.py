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
        """Generate AI summary of news articles with different complexity levels."""
        if not articles:
            return "No news articles available for analysis."
        
        # Get sentiment score
        sentiment_score = self.analyze_sentiment(articles)
        
        # Count of articles
        article_count = len([a for a in articles if a and a.get('title')])
        
        # Generate different analysis based on investor level
        if investor_level.lower() == "advanced":
            return self._generate_advanced_analysis(articles, ticker, sentiment_score, article_count)
        else:
            return self._generate_beginner_analysis(articles, ticker, sentiment_score, article_count)
    
    def _generate_beginner_analysis(self, articles: List[Dict[str, Any]], ticker: str, sentiment_score: float, article_count: int) -> str:
        """Generate beginner-friendly analysis with simple explanations."""
        # Determine sentiment and recommendation in simple terms
        if sentiment_score > 0.3:
            sentiment_text = "VERY POSITIVE 📈"
            recommendation = "The news looks really good! This could be a good time to consider buying."
            emoji = "🟢"
        elif sentiment_score > 0.1:
            sentiment_text = "POSITIVE 📊"
            recommendation = "The news is generally favorable. Good for current holders."
            emoji = "🟢"
        elif sentiment_score > -0.1:
            sentiment_text = "NEUTRAL ⚖️"
            recommendation = "Mixed signals in the news. Wait and see approach recommended."
            emoji = "🟡"
        elif sentiment_score > -0.3:
            sentiment_text = "NEGATIVE 📉"
            recommendation = "Some concerning news. Consider waiting before buying."
            emoji = "🟠"
        else:
            sentiment_text = "VERY NEGATIVE ⚠️"
            recommendation = "Significant negative news. Be cautious with this stock."
            emoji = "🔴"
        
        summary = f"""
{emoji} SIMPLE ANALYSIS FOR {ticker}

📊 WHAT'S HAPPENING:
• Analyzed {article_count} recent news articles
• Overall news sentiment: {sentiment_text}
• Sentiment Score: {sentiment_score:.2f} (Range: -1.0 to +1.0)

💡 WHAT THIS MEANS FOR YOU:
{recommendation}

KEY HEADLINES:
"""
        
        # Add top 3 headlines with simple explanations
        for i, article in enumerate(articles[:3]):
            if article and article.get('title'):
                summary += f"• {article['title']}\n"
        
        summary += f"""
🎓 BEGINNER TIPS:
• Positive sentiment (above 0.1) usually means good news for the stock
• Negative sentiment (below -0.1) might mean challenges ahead
• Always do more research before making investment decisions
• Never invest more than you can afford to lose

IMPORTANT: This is news analysis only. Consider company fundamentals, market conditions, and your financial goals before investing.
"""
        
        return summary
    
    def _generate_advanced_analysis(self, articles: List[Dict[str, Any]], ticker: str, sentiment_score: float, article_count: int) -> str:
        """Generate comprehensive analysis for advanced investors."""
        # Advanced sentiment classification
        if sentiment_score > 0.5:
            sentiment_category = "STRONG BULLISH"
            risk_level = "LOW"
        elif sentiment_score > 0.2:
            sentiment_category = "BULLISH"
            risk_level = "LOW-MODERATE"
        elif sentiment_score > -0.2:
            sentiment_category = "NEUTRAL"
            risk_level = "MODERATE"
        elif sentiment_score > -0.5:
            sentiment_category = "BEARISH"
            risk_level = "MODERATE-HIGH"
        else:
            sentiment_category = "STRONG BEARISH"
            risk_level = "HIGH"
        
        # Calculate additional metrics
        news_velocity = "HIGH" if article_count > 15 else "MODERATE" if article_count > 8 else "LOW"
        
        summary = f"""
📈 ADVANCED ANALYSIS: {ticker}

🎯 SENTIMENT METRICS:
• News Sentiment Score: {sentiment_score:.3f}
• Sentiment Category: {sentiment_category}
• News Velocity: {news_velocity} ({article_count} articles analyzed)
• Risk Level: {risk_level}

📊 TECHNICAL INDICATORS:
• Sentiment Momentum: {'POSITIVE' if sentiment_score > 0 else 'NEGATIVE'}
• News Volume: {article_count} articles (vs. avg 10-12 for major stocks)
• Sentiment Volatility: {'HIGH' if abs(sentiment_score) > 0.4 else 'MODERATE' if abs(sentiment_score) > 0.2 else 'LOW'}

⚠️ RISK ASSESSMENT:
• News-driven Risk: {risk_level}
• Potential Catalysts: {'POSITIVE' if sentiment_score > 0.1 else 'NEGATIVE' if sentiment_score < -0.1 else 'NEUTRAL'}
• Market Sensitivity: {'HIGH' if abs(sentiment_score) > 0.3 else 'MODERATE'}

📰 NEWS ANALYSIS BREAKDOWN:
"""
        
        # Add detailed news analysis
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for article in articles:
            if article and article.get('title'):
                article_sentiment = self.analyzer.polarity_scores(
                    (article.get('title', '') + ' ' + (article.get('description') or '')).strip()
                )['compound']
                
                if article_sentiment > 0.1:
                    positive_count += 1
                elif article_sentiment < -0.1:
                    negative_count += 1
                else:
                    neutral_count += 1
        
        summary += f"""
• Positive Articles: {positive_count}/{article_count} ({positive_count/article_count*100:.1f}%)
• Negative Articles: {negative_count}/{article_count} ({negative_count/article_count*100:.1f}%)
• Neutral Articles: {neutral_count}/{article_count} ({neutral_count/article_count*100:.1f}%)

📈 TOP IMPACT HEADLINES:
"""
        
        # Add top 5 headlines with sentiment scores
        for i, article in enumerate(articles[:5]):
            if article and article.get('title'):
                article_sentiment = self.analyzer.polarity_scores(
                    (article.get('title', '') + ' ' + (article.get('description') or '')).strip()
                )['compound']
                
                impact = "🔴 NEGATIVE" if article_sentiment < -0.1 else "🟢 POSITIVE" if article_sentiment > 0.1 else "🟡 NEUTRAL"
                summary += f"• [{impact}] {article['title']} (Score: {article_sentiment:.2f})\n"
        
        summary += f"""
🎯 TRADING IMPLICATIONS:
• Short-term Bias: {'BULLISH' if sentiment_score > 0.1 else 'BEARISH' if sentiment_score < -0.1 else 'NEUTRAL'}
• News-driven Volatility: {'EXPECTED' if abs(sentiment_score) > 0.3 else 'POSSIBLE' if abs(sentiment_score) > 0.1 else 'LOW'}
• Institutional Sentiment: {'LIKELY POSITIVE' if sentiment_score > 0.2 else 'LIKELY NEGATIVE' if sentiment_score < -0.2 else 'MIXED'}

⚠️ DISCLAIMER: This analysis is based on news sentiment only. Combine with technical analysis, fundamental analysis, and market conditions for comprehensive investment decisions.
"""
        
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
