# 🤖 AI Trading Coach

<div align="center">

![AI Trading Coach Banner](https://img.shields.io/badge/AI-Trading%20Coach-blueviolet)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/JavaScript-ES6+-yellow)

**AI-powered trading assistant that analyzes your trades, detects psychological biases, and provides personalized coaching**

[Live Demo](https://deriv-ai-trade-coach.vercel.app) · [Report Bug](https://github.com/yourusername/ai-trading-coach/issues) · [Request Feature](https://github.com/yourusername/ai-trading-coach/issues)

</div>

## ✨ Features

### 🎯 **Core Features**
- **AI-Powered Trade Analysis** - Get detailed feedback on every trade
- **Psychological Bias Detection** - Identify loss aversion, overconfidence, revenge trading
- **Real-time Market Insights** - Stay updated with market conditions
- **Performance Analytics** - Track win rate, profit factor, drawdowns
- **Interactive Dashboard** - Beautiful visualizations of your trading journey

### 🧠 **Intelligent Coaching**
- **Personalized Advice** - AI generates specific recommendations based on your trading style
- **Behavioral Insights** - Understand your emotional patterns and biases
- **Risk Management** - Get alerts when risk levels are too high
- **Strategy Optimization** - Improve your trading approach with data-driven suggestions

### 📊 **Advanced Analytics**
- **Win Rate Tracking** - Monitor your performance over time
- **Profit/Loss Analysis** - Detailed breakdown of profitable vs losing trades
- **Heatmaps** - Visualize your best trading times and symbols
- **Pattern Recognition** - Identify winning and losing patterns in your trading

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- (Optional) Groq API key for enhanced AI features

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-trading-coach.git
cd ai-trading-coach
```

2. **Install dependencies**
```bash
cd backend
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Add your GROQ_API_KEY if you have one (optional)
```

4. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Open your browser**
```
http://localhost:3000
```

## 🎨 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x450/0f172a/ffffff?text=Dashboard+Overview" alt="Dashboard" width="49%" />
  <img src="https://via.placeholder.com/800x450/1e293b/ffffff?text=AI+Coach+Chat" alt="AI Coach" width="49%" />
  <img src="https://via.placeholder.com/800x450/334155/ffffff?text=Trade+Analysis" alt="Trade Analysis" width="49%" />
  <img src="https://via.placeholder.com/800x450/0c4a6e/ffffff?text=Market+Overview" alt="Market" width="49%" />
</div>

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript, CSS3 with modern grid/flexbox
- **Backend**: Node.js, Express.js
- **AI Integration**: Groq API (Llama, Mixtral models)
- **Database**: JSON files (can be easily extended to any database)
- **Deployment**: Vercel, Render (serverless ready)

### Project Structure
```
deriv-ai-trade-coach/
├── backend/                 # Express.js backend
│   ├── app.js              # Main application
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   └── middleware/         # Authentication, validation
├── public/                  # Frontend files
│   ├── index.html          # Single-page application
│   ├── css/                # Styling
│   └── js/                 # Client-side logic
├── data/                   # Sample data
└── tests/                  # Test suites
```

## 📈 How It Works

### 1. **Add Your Trades**
- Manually enter trades via the dashboard
- Import from CSV/JSON files
- Track entry/exit prices, position sizes, and notes

### 2. **AI Analysis**
- Each trade is analyzed by AI for strengths and weaknesses
- Behavioral patterns are detected in real-time
- Confidence scores and risk assessments are provided

### 3. **Get Coaching**
- Ask questions about your trading performance
- Get market insights and trade ideas
- Receive personalized improvement suggestions

### 4. **Track Progress**
- Monitor your statistics over time
- Identify patterns in successful trades
- Adjust your strategy based on data

## 🧪 Bias Detection Engine

Our AI detects common trading psychology biases:

| Bias | Description | Detection Method |
|------|-------------|------------------|
| **Loss Aversion** | Holding losers too long, cutting winners early | Duration analysis, profit/loss ratios |
| **Overconfidence** | Taking excessive risk after wins | Position size changes, win streaks |
| **Revenge Trading** | Trading emotionally after losses | Timing analysis, impulsive entries |
| **Confirmation Bias** | Seeking only confirming information | Trade direction consistency |
| **Anchoring** | Fixating on specific price levels | Price deviation analysis |

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Server
PORT=3000
NODE_ENV=development

# AI (Optional)
GROQ_API_KEY=your_key_here
USE_MOCK_AI=true  # Use mock AI if no API key

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100
```

### AI Integration Options

1. **Full AI Mode** (Recommended)
   - Get a free API key from [Groq](https://console.groq.com)
   - Enable real-time AI analysis
   - Get personalized coaching

2. **Mock AI Mode** (Default)
   - No API key required
   - Uses pre-defined responses
   - Perfect for testing and demo

## 🚀 Deployment

### Option 1: Vercel (Recommended - Free Tier)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Render.com
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set build command: `cd backend && npm install`
5. Set start command: `cd backend && node app.js`

### Option 3: Self-Hosted
```bash
# Build
cd backend
npm install --production

# Start
node app.js

# With PM2 (production)
npm install -g pm2
pm2 start app.js --name "ai-trading-coach"
```

## 📚 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trades` | Get all trades |
| `POST` | `/api/trades` | Add new trade |
| `POST` | `/api/coach/advice` | Get AI coaching |
| `GET` | `/api/coach/biases` | Detect biases |
| `GET` | `/api/history` | Get performance history |

### Example API Usage
```javascript
// Add a trade
fetch('/api/trades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTCUSD',
    type: 'buy',
    entryPrice: 95000,
    exitPrice: 97000,
    positionSize: 0.1
  })
})

// Get AI coaching
fetch('/api/coach/advice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    marketContext: 'BTC breaking above 95k resistance'
  })
})
```

## 🧪 Testing

```bash
# Run tests
cd backend
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm test -- tradeAnalyzer.test.js
```

Test coverage includes:
- Trade statistics calculations
- Bias detection algorithms
- API endpoint validation
- Error handling

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```
4. **Push to the branch**
```bash
git push origin feature/amazing-feature
```
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Use descriptive commit messages

## 🎯 Roadmap

- [ ] **Mobile App** - iOS & Android versions
- [ ] **Exchange Integration** - Auto-import trades from Binance, Coinbase, etc.
- [ ] **Advanced Charting** - Interactive technical analysis charts
- [ ] **Multi-user Support** - Team collaboration features
- [ ] **Paper Trading** - Risk-free trading simulation
- [ ] **Advanced AI Models** - Custom-trained trading models
- [ ] **API Webhooks** - Real-time notifications and alerts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**IMPORTANT**: AI Trading Coach is an **educational tool** designed to help traders improve their skills and understand their trading psychology. It is **NOT**:

- Financial advice
- A trading signal service
- A guarantee of profits
- A replacement for professional financial advice

**Always:**
- Do your own research
- Understand the risks involved in trading
- Never risk more than you can afford to lose
- Consult with a qualified financial advisor

## 👥 Team

- **Lead Developer**: [Your Name](https://github.com/yourusername)
- **AI Specialist**: [Team Member](https://github.com/teammember)
- **UI/UX Designer**: [Designer](https://github.com/designer)

## 🙏 Acknowledgments

- [Groq](https://groq.com) for providing amazing AI inference
- [Chart.js](https://www.chartjs.org) for beautiful visualizations
- [Tailwind CSS](https://tailwindcss.com) for inspiration in our CSS structure
- All contributors and testers who helped shape this project

## 📞 Support

Having trouble? Here's how to get help:

1. **Check the [Wiki](https://github.com/yourusername/ai-trading-coach/wiki)**
2. **Search [Issues](https://github.com/yourusername/ai-trading-coach/issues)**
3. **Create a new Issue** if your problem isn't already reported
4. **Email**: support@ai-trading-coach.com

---

<div align="center">

### Ready to transform your trading journey?

[Get Started Now](https://deriv-ai-trade-coach.vercel.app) · [View Demo](https://demo.ai-trading-coach.com) · [Read Documentation](https://docs.ai-trading-coach.com)

⭐ **Star us on GitHub** if you find this project helpful!

</div>

---

*"The goal of a successful trader is to make the best trades. Money is secondary." - Alexander Elder*
