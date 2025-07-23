from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
# from langchain_groq import ChatGroq
# from langchain.prompts import PromptTemplate
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
            if article and article.get('title') and article.get('description'):
                text = f"{article['title']}. {article['description']}"
                score = self.analyzer.polarity_scores(text)
                sentiment_scores.append(score['compound'])
        
        if not sentiment_scores:
            return 0.0
            
        return sum(sentiment_scores) / len(sentiment_scores)

    async def get_ai_summary(self, articles: List[Dict[str, Any]], ticker: str, investor_level: str = "Beginner") -> str:
        """Generate an AI-powered summary of news articles for a stock."""
        if not articles or not self.groq_api_key:
            return "No news available or AI service unavailable."
            
        news_text = " ".join([
            f"{article['title']}. {article['description']}" 
            for article in articles 
            if article and article.get('title') and article.get('description')
        ])
        
        if not news_text:
            return "Not enough news content to generate a summary."

        try:
            llm = ChatGroq(temperature=0, model_name="llama3-70b-8192", api_key=self.groq_api_key)

            if investor_level == "Beginner":
                template = """You are a friendly financial assistant. Based on the following news about {ticker}, provide a simple, easy-to-understand summary for a complete beginner. Explain if the news sounds generally positive or negative and why, avoiding complex jargon. 

News Articles: "{news_text}" 

Your simple summary:"""
            else:
                template = """You are an expert financial analyst. Analyze the following news articles for {ticker}. Provide a concise, data-driven summary highlighting key market-moving information. Present a brief "Bull Case" (reasons to be optimistic) and "Bear Case" (reasons to be cautious). 

News Articles: "{news_text}" 

Your expert analysis:"""

            prompt = PromptTemplate(template=template, input_variables=["ticker", "news_text"])
            response = llm.invoke(prompt.format(ticker=ticker, news_text=news_text))
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            return f"Error generating AI summary: {e}"

    async def get_ai_comparison(self, ticker1: str, ticker2: str, news1: List[Dict], news2: List[Dict], investor_level: str = "Beginner") -> str:
        """Generate a comparative analysis of two stocks based on their news."""
        if not self.groq_api_key:
            return "AI service unavailable."
            
        news_text1 = " ".join([f"{a['title']}" for a in news1[:5] if a and a.get('title')])
        news_text2 = " ".join([f"{a['title']}" for a in news2[:5] if a and a.get('title')])

        if not news_text1 and not news_text2:
            return "Not enough news content for either stock to generate a comparison."

        try:
            llm = ChatGroq(temperature=0, model_name="llama3-70b-8192", api_key=self.groq_api_key)

            if investor_level == "Beginner":
                template = """Compare these two stocks ({ticker1} vs {ticker2}) based on recent news. Explain in simple terms which stock seems to have better prospects and why. Keep it beginner-friendly.

{ticker1} news: "{news_text1}"
{ticker2} news: "{news_text2}"

Your comparison:"""
            else:
                template = """Provide an expert comparative analysis of {ticker1} vs {ticker2} based on recent news sentiment and market developments. Include investment implications and relative positioning.

{ticker1} news: "{news_text1}"
{ticker2} news: "{news_text2}"

Your expert comparison:"""

            prompt = PromptTemplate(
                template=template, 
                input_variables=["ticker1", "ticker2", "news_text1", "news_text2"]
            )
            response = llm.invoke(prompt.format(
                ticker1=ticker1, 
                ticker2=ticker2, 
                news_text1=news_text1, 
                news_text2=news_text2
            ))
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            return f"Error generating AI comparison: {e}"

# Global instance
ai_service = AIAnalysisService()
