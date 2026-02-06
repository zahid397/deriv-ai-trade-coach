# AI Trading Coach 🚀

## 🏆 Hackathon Project - Smart Trading Assistant

**AI Trading Coach** is an intelligent trading assistant that helps traders improve their performance through real-time AI coaching, behavioral bias detection, and comprehensive performance analytics.

---

## 🌐 Live Deployments

### **Frontend** (Cloudflare Pages)
🔗 **Live Demo:** [https://ai-trading-coach.pages.dev](https://ai-trading-coach.pages.dev)  
📁 **Source:** `frontend/` directory  
⚡ **Features:** Blazing fast static hosting with global CDN

### **Backend API** (Render.com)
🔗 **API Endpoint:** [https://deriv-ai-trade-coach.onrender.com](https://deriv-ai-trade-coach.onrender.com)  
📁 **Source:** `backend/` directory  
🚀 **Stack:** Node.js + Express + Groq AI API

---

## 🎯 Key Features

### 🤖 **AI-Powered Coaching**
- Real-time trading advice using Groq AI (Llama/Mixtral)
- Personalized feedback based on your trading history
- Market analysis and sentiment insights

### 🧠 **Behavioral Bias Detection**
- Identifies psychological biases (Loss Aversion, Overconfidence, Revenge Trading)
- Provides actionable recommendations
- Real-time alerts during trading

### 📊 **Performance Analytics**
- Win rate tracking and P&L analysis
- Risk score calculation
- Interactive charts and heatmaps
- Trade pattern recognition

### 💼 **Trade Management**
- Record and analyze trades
- Import/export trading history
- Detailed trade breakdowns
- Risk management tools

### 🌍 **Live Market Data**
- Real-time crypto prices (BTC/ETH)
- Technical indicators (RSI, MACD)
- Market sentiment analysis
- Volatility alerts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              Cloudflare Pages                    │
│         (Frontend - Static Hosting)             │
│                                                 │
│  • index.html    • style.css    • script.js     │
│  • Instant global deployment                    │
│  • Built-in CDN & DDoS protection               │
└───────────────┬─────────────────────────────────┘
                │ HTTPS / REST API
                ▼
┌─────────────────────────────────────────────────┐
│                Render.com                        │
│          (Backend - Node.js API)                │
│                                                 │
│  • Express.js server                           │
│  • Groq AI integration                         │
│  • Trade analysis engine                       │
│  • Bias detection algorithms                   │
│  • Free tier with auto-sleep                   │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Use Live Deployment (Recommended)
1. Visit: [https://ai-trading-coach.pages.dev](https://ai-trading-coach.pages.dev)
2. Start adding trades and interacting with AI coach
3. No installation required!

### Option 2: Local Development

#### Frontend (Cloudflare Pages):
```bash
cd frontend
# Open index.html in browser or use live server
python -m http.server 8000
```

#### Backend (Local Development):
```bash
cd backend
npm install
cp .env.example .env
# Add GROQ_API_KEY to .env (optional)
npm start
# Server runs on http://localhost:3000
```

---

## 📁 Project Structure

```
deriv-ai-trade-coach/
│
├── frontend/                    # Cloudflare Pages部署
│   ├── index.html              # 主页面
│   ├── style.css               # 样式
│   └── script.js               # 前端逻辑
│
├── backend/                    # Render.com部署
│   ├── app.js                  # Express主应用
│   ├── package.json
│   ├── config/                 # 配置
│   ├── middleware/             # 中间件
│   ├── routes/                 # API路由
│   ├── services/               # 业务逻辑
│   └── data/                   # 样本数据
│
└── docs/                      # 文档
    ├── DEMO_SCRIPT.md         # 演示脚本
    └── ARCHITECTURE.md        # 架构说明
```

---

## 🔧 Technology Stack

### **Frontend**
- Vanilla JavaScript (No framework dependencies)
- Pure CSS with modern features (CSS Grid, Flexbox, Variables)
- Responsive design for all devices
- Local Storage for offline functionality

### **Backend**
- **Node.js** + **Express.js** - Server framework
- **Groq AI API** - For AI coaching (Llama/Mixtral models)
- **In-memory storage** - For demo purposes (easy to switch to DB)
- **REST API** - Clean endpoint design

### **Deployment**
- **Cloudflare Pages** - Frontend hosting
- **Render.com** - Backend hosting (free tier)
- **CORS enabled** - Secure cross-origin requests

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trades` | GET | Get all trades |
| `/api/trades` | POST | Add new trade |
| `/api/coach/advice` | POST | Get AI coaching advice |
| `/api/coach/biases` | GET | Detect trading biases |
| `/api/history` | GET | Get trading history with stats |
| `/api/session` | GET/POST | Manage coaching session |
| `/health` | GET | Health check |

---

## 🎨 UI/UX Features

### **Dashboard**
- Real-time P&L tracking
- Portfolio value display
- Win rate statistics
- Risk score monitoring

### **AI Coach Interface**
- Chat-style interaction
- Typing indicators
- Quick action buttons
- Session history

### **Trade Management**
- Add/edit/delete trades
- Import/export functionality
- Detailed trade analysis
- Performance charts

### **Mobile Responsive**
- Works on all screen sizes
- Touch-friendly interface
- Adaptive layouts

---

## 🧪 Testing Data

The app includes sample trading data to demonstrate features:

- **15 sample trades** with realistic scenarios
- **Multiple bias patterns** for detection
- **Varied market conditions**
- **Different asset classes** (Crypto, Stocks)

---

## 🔐 Security & Privacy

- **No sensitive data** stored on servers
- **Local storage** for user preferences
- **CORS protection** enabled
- **Rate limiting** on API endpoints
- **Environment variables** for secrets

---

## 🚦 Deployment Instructions

### **Frontend to Cloudflare Pages:**
1. Create account on [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect your GitHub repository
3. Set build directory to `frontend`
4. Deploy!

### **Backend to Render.com:**
1. Create account on [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo, set root to `backend`
4. Add environment variables if needed
5. Deploy!

---

## 📈 Future Enhancements

- [ ] Real WebSocket integration for live prices
- [ ] Advanced charting with TradingView
- [ ] More AI models integration
- [ ] Social features (share performance)
- [ ] Mobile app version
- [ ] Advanced backtesting engine

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit Pull Request

---

## 📄 License

This project is created for the **Deriv Hackathon**. All code is open-source and available for educational purposes.

---

## 🙏 Acknowledgments

- **Deriv** for hosting the hackathon
- **Groq** for providing AI infrastructure
- **Render.com** & **Cloudflare** for free hosting
- All open-source contributors

---

## 🆘 Support

For issues or questions:
1. Check the [Live Demo](https://ai-trading-coach.pages.dev)
2. Review the API documentation
3. Open a GitHub Issue
4. Contact the development team

---

**Built with ❤️ for the Deriv Hackathon | December 2024**
