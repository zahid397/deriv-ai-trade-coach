# AI Trading Coach 🚀

<div align="center">

![AI Trading Coach Banner](https://img.shields.io/badge/AI-Trading%20Coach-blue)
![Hackathon](https://img.shields.io/badge/Built%20for-Hackathon-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

**AI-powered trading assistant that detects psychological biases and provides real-time coaching**

[Live Demo](https://deriv-ai-trade-coach.pages.dev) • [Backend API](https://deriv-ai-trade-coach.onrender.com) • [Video Demo](https://www.loom.com/share/YOUR_VIDEO_ID)

</div>

## ✨ Features

### 🤖 **AI Trading Coach**
- Real-time market analysis with buy/sell signals
- Personalized coaching based on your trading patterns
- Psychological bias detection (loss aversion, overconfidence, revenge trading)
- Trade analysis with confidence scores

### 📊 **Performance Dashboard**
- Live P&L tracking with profit/loss visualization
- Win rate analytics (24H, 30D, All-time)
- Risk score assessment (1-10 scale)
- Portfolio value monitoring
- Interactive charts for P&L over time

### 🧠 **Behavioral Psychology**
- **Loss Aversion Detection**: Identify if you're holding losers too long
- **Overconfidence Alerts**: Warn when winning streaks lead to excessive risk
- **Revenge Trading Prevention**: Stop emotional trading after losses
- Real-time bias alerts with actionable advice

### 📈 **Trade Analysis**
- Detailed trade execution analysis
- Price action visualization with entry/exit points
- AI-powered trade explanations
- Confidence scoring for each analysis
- Improvement suggestions

### ⚡ **Real-time Features**
- Live market data for BTC/USD, ETH/USD
- Volatility alerts with buy/sell signals
- RSI, MACD indicators
- Market sentiment analysis
- Portfolio updates in real-time

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages (Frontend)               │
│  https://deriv-ai-trade-coach.pages.dev                     │
├─────────────────────────────────────────────────────────────┤
│  • Single Page Application                                  │
│  • Real-time UI updates                                     │
│  • Offline capability with localStorage                     │
│  • Responsive design for all devices                        │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS API Calls
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Render.com (Backend)                      │
│  https://deriv-ai-trade-coach.onrender.com                  │
├─────────────────────────────────────────────────────────────┤
│  • Express.js REST API                                      │
│  • AI Integration (Groq API + Fallback)                     │
│  • Trade analysis & statistics                              │
│  • Session management                                       │
│  • Rate limiting & error handling                           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Try the Live Demo
- **Frontend**: https://deriv-ai-trade-coach.pages.dev
- **Backend API**: https://deriv-ai-trade-coach.onrender.com
- **API Health Check**: https://deriv-ai-trade-coach.onrender.com/health

### 2. Local Development

#### Backend Setup:
```bash
# Clone repository
git clone https://github.com/yourusername/deriv-ai-trade-coach.git
cd deriv-ai-trade-coach/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GROQ_API_KEY (optional - app works without it)

# Start development server
npm run dev
# Server runs at http://localhost:3000
```

#### Frontend Setup:
```bash
cd ../frontend

# Open index.html in browser or use Live Server
# Configure backend URL in script.js if needed
```

## 🎯 Use Cases

### For Traders:
- **New Traders**: Learn trading psychology and avoid common mistakes
- **Experienced Traders**: Get AI-powered second opinions on trades
- **Discipline Improvement**: Break emotional trading habits
- **Performance Tracking**: Monitor win rates and risk metrics

### For Hackathon Judges:
- **Complete System**: Full-stack application with frontend + backend
- **AI Integration**: Real AI with fallback to mock responses
- **Real-time Features**: Live updates and interactive charts
- **Production Ready**: Deployed on Cloudflare Pages + Render.com
- **Zero Cost**: Free hosting, free AI API (fallback included)

## 🔧 Technical Implementation

### Frontend (Cloudflare Pages)
- **Vanilla JavaScript** - No frameworks for maximum performance
- **CSS3 with Variables** - Dark/light theme support
- **Canvas Charts** - Custom chart rendering
- **Service Workers** - Offline capability
- **LocalStorage** - Data persistence

### Backend (Render.com)
- **Express.js** - REST API server
- **Groq API Integration** - AI-powered coaching
- **Mock AI System** - Fallback when API key not available
- **Rate Limiting** - 100 requests per 15 minutes
- **CORS Enabled** - Secure cross-origin requests

### AI Features
1. **Trade Analysis**: AI reviews each trade for mistakes and successes
2. **Bias Detection**: Machine learning identifies psychological patterns
3. **Market Coaching**: Real-time advice based on current conditions
4. **Risk Assessment**: Calculates risk scores from trading behavior

## 📱 UI/UX Design

### Dashboard Layout:
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: AI Trading Coach | Portfolio: $105,400 | Win Rate: 78%│
├───────────────┬───────────────────────────────┬─────────────┤
│ STATS CARDS   │   LIVE MARKET DATA            │   COACH     │
│ • Today's P&L │   • BTC/USD Price             │   PANEL     │
│ • Win Rate    │   • RSI/MACD Indicators       │   (AI Chat) │
│ • Risk Score  │   • Volatility Alerts         │             │
├───────────────┼───────────────────────────────┼─────────────┤
│ RECENT TRADES │   BEHAVIORAL INSIGHTS         │   QUICK     │
│ • Trade List  │   • Bias Detection Cards      │   ACTIONS   │
│ • P&L Charts  │   • Recommendations           │             │
└───────────────┴───────────────────────────────┴─────────────┘
```

### Key Design Principles:
- **Dark Theme First**: Optimal for trading interfaces
- **Real-time Updates**: Live data without page refresh
- **Mobile Responsive**: Works on all screen sizes
- **Minimalist UI**: Focus on essential information
- **Visual Feedback**: Clear success/error indicators

## 🔌 API Endpoints

### Backend API (Render.com)
```
GET    /health                    # Health check
GET    /api                       # API info
GET    /api/trades                # List all trades
POST   /api/trades                # Add new trade
GET    /api/trades/stats/summary  # Trading statistics
POST   /api/coach/advice          # Get AI coaching
GET    /api/coach/biases          # Detect biases
GET    /api/history               # Complete trading history
GET    /api/session/:id           # Session management
```

## 🎮 How to Use

### 1. **Add Your First Trade**
1. Click "Add Trade" button
2. Enter symbol (BTCUSD, ETHUSD, etc.)
3. Set entry/exit prices and position size
4. Add notes about the trade
5. Submit for AI analysis

### 2. **Get AI Coaching**
1. Type questions in the coach panel:
   - "Should I buy BTC now?"
   - "Analyze my recent trades"
   - "What's my biggest bias?"
   - "Market outlook for today"

### 3. **Monitor Performance**
- Watch real-time P&L updates
- Check win rate improvements
- Review bias detection alerts
- Track portfolio growth

### 4. **Improve Your Trading**
- Read AI suggestions after each trade
- Acknowledge and work on detected biases
- Compare your stats over time
- Use the coach for difficult decisions

## 🛡️ Bias Detection System

The AI monitors for these psychological biases:

| Bias | Detection Method | Solution |
|------|-----------------|----------|
| **Loss Aversion** | Holding losers 2x longer than winners | Set strict stop losses |
| **Overconfidence** | Increased position size after wins | Consistent position sizing |
| **Revenge Trading** | Trading immediately after losses | Mandatory 1-hour break |
| **Confirmation Bias** | Only seeing bullish/bearish signals | Seek contrary evidence |
| **Anchoring** | Fixating on entry price | Use trailing stops |

## 📊 Performance Metrics Tracked

- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Gross profits / gross losses
- **Max Drawdown**: Largest peak-to-trough decline
- **Sharpe Ratio**: Risk-adjusted returns
- **Expectancy**: Average profit per trade
- **Risk Score**: Behavioral risk assessment (1-100)

## 🔄 Deployment

### Frontend (Cloudflare Pages)
1. Connect GitHub repository
2. Set build command: (none - static site)
3. Set output directory: `frontend`
4. Deploy automatically on push

### Backend (Render.com)
1. New Web Service
2. Connect GitHub repository
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && node app.js`
5. Add environment variables if using Groq API

## 🧪 Testing the App

### Without API Key (Mock Mode):
- All AI features work with mock responses
- Perfect for demo and testing
- No rate limits or costs

### With GROQ API Key:
1. Get free API key from [GroqCloud](https://console.groq.com)
2. Add to backend `.env` file:
   ```
   GROQ_API_KEY=your_key_here
   ```
3. Enjoy real AI responses

## 🎥 Hackathon Submission

### Demo Video Includes:
1. **Problem Statement**: Emotional trading losses
2. **Solution Overview**: AI psychology coach
3. **Live Demo**: Adding trades, getting AI advice
4. **Bias Detection**: Real-time alerts
5. **Technical Architecture**: Frontend + backend explanation
6. **Deployment**: Cloudflare Pages + Render.com

### Key Highlights for Judges:
- ✅ **Complete working application**
- ✅ **Free hosting (zero cost)**
- ✅ **Real AI + fallback system**
- ✅ **Production-ready architecture**
- ✅ **User-centric design**
- ✅ **Real-time features**
- ✅ **Behavioral psychology focus**

## 📈 Future Roadmap

- [ ] Multi-language support
- [ ] Advanced charting with TradingView
- [ ] Telegram/Discord bot integration
- [ ] Social trading features
- [ ] Advanced AI models (GPT-4, Claude)
- [ ] Mobile app (React Native)
- [ ] Paper trading simulator
- [ ] Trading journal export

## 👥 Team

**AI Trading Coach** was built by a solo developer for the hackathon.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq Cloud** for AI API access
- **Render.com** for free backend hosting
- **Cloudflare** for free frontend hosting
- **Deriv** for hackathon platform
- **Trading psychology researchers** for bias detection algorithms

---

<div align="center">

**Start improving your trading psychology today!**

[🎯 Try Live Demo](https://deriv-ai-trade-coach.pages.dev) • [🐛 Report Issues](https://github.com/yourusername/deriv-ai-trade-coach/issues) • [💡 Request Features](https://github.com/yourusername/deriv-ai-trade-coach/issues)

*"The best investment you can make is in yourself." - Warren Buffett*

</div>
