# AITradingPlatform

A modern React frontend with FastAPI backend recreation of the AI stock analysis platform. This version maintains all the core functionality of the original Streamlit app while providing a more responsive and interactive user experience.

## Architecture

```
reactversion/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   └── App.js          # Main app component
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── api/                 # API route handlers
│   ├── core/                # Business logic services
│   ├── main.py             # FastAPI application
│   └── requirements.txt
└── README.md
```

## Features

### ✅ Implemented
- **Modern React Frontend**: Built with Material-UI, responsive design
- **FastAPI Backend**: High-performance async API
- **Authentication**: JWT-based user authentication
- **Stock Data**: Real-time stock data via yFinance
- **News Integration**: Financial news from NewsAPI
- **AI Analysis**: Sentiment analysis and AI summaries via Groq/Llama
- **Watchlist Management**: Personal stock watchlists
- **Interactive Charts**: Plotly.js charts for data visualization

### 🚧 In Progress
- Portfolio tracking with P&L calculations
- AI stock screener with natural language
- Technical analysis indicators
- Price prediction with Prophet
- Trading playground/simulator

## Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Material-UI (MUI)** for modern, responsive UI
- **React Router** for navigation
- **Axios** for API communication
- **Plotly.js** for interactive charts
- **Framer Motion** for animations
- **React Hot Toast** for notifications

### Backend
- **FastAPI** for high-performance API
- **JWT** for authentication
- **yFinance** for stock data
- **NewsAPI** for financial news
- **LangChain + Groq** for AI analysis
- **VADER Sentiment** for sentiment analysis
- **Pydantic** for data validation

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- API keys for NewsAPI and Groq

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd reactversion/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   NEWS_API_KEY=your_newsapi_key_here
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_jwt_secret_key_here
   ```

5. **Run the backend:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd reactversion/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The app will open at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Stocks
- `GET /api/stocks/data/{ticker}` - Get historical stock data
- `GET /api/stocks/info/{ticker}` - Get basic stock information
- `GET /api/stocks/news/{ticker}` - Get financial news
- `GET /api/stocks/sentiment/{ticker}` - Get sentiment analysis
- `POST /api/stocks/ai/analysis` - Get AI analysis
- `POST /api/stocks/ai/comparison` - Compare two stocks

### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/{ticker}` - Remove from watchlist

### Portfolio
- `GET /api/portfolio` - Get portfolio
- `POST /api/portfolio` - Add to portfolio
- `DELETE /api/portfolio/{holding_id}` - Remove from portfolio

## Key Differences from Streamlit Version

### Advantages
1. **Better Performance**: React's virtual DOM and FastAPI's async nature
2. **Mobile Responsive**: Material-UI provides excellent mobile experience
3. **Real-time Updates**: WebSocket support for live data (coming soon)
4. **Modular Architecture**: Easier to maintain and extend
5. **Better State Management**: React contexts and proper data flow
6. **Modern UX**: Smooth animations and transitions

### Trade-offs
1. **Complexity**: More files and configuration than Streamlit
2. **Development Time**: Requires separate frontend/backend development
3. **Deployment**: Need to deploy two services instead of one

## Development Workflow

### Adding New Features

1. **Backend**: Create API endpoints in `backend/api/`
2. **Frontend**: Create UI components in `frontend/src/components/`
3. **Services**: Add API calls in `frontend/src/services/api.js`
4. **Pages**: Update page components to use new features

### Code Organization

```
Backend:
- core/: Business logic (adapted from original Streamlit backend)
- api/: FastAPI route handlers
- main.py: Application entry point

Frontend:
- components/: Reusable UI components
- pages/: Route-specific page components
- services/: API communication layer
- contexts/: Global state management
```

## Environment Variables

### Backend (.env)
```env
NEWS_API_KEY=your_newsapi_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_jwt_secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

## Deployment Options

### Development
- Frontend: `npm start` (port 3000)
- Backend: `python main.py` (port 8000)

### Production
- Frontend: Build with `npm run build`, serve with nginx/Apache
- Backend: Deploy with uvicorn, gunicorn, or container platforms
- Database: Integrate with PostgreSQL/MongoDB for production

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -am 'Add new feature'`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

## Future Enhancements

1. **Real-time Data**: WebSocket integration for live stock prices
2. **Advanced Charts**: More chart types and technical indicators
3. **Portfolio Analytics**: Detailed performance metrics
4. **Social Features**: Share watchlists and analysis
5. **Mobile App**: React Native version
6. **ML Models**: Custom prediction models
7. **Alert System**: Price and news alerts

## Support

For issues and questions:
1. Check the API documentation at `http://localhost:8000/docs`
2. Review the original Streamlit version for reference
3. Create GitHub issues for bugs and feature requests

## License

This project maintains the same MIT license as the original Streamlit version.
