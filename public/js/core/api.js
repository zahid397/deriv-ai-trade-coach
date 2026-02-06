class TradingAPI {
  constructor() {
    this.baseURL = window.location.origin;
    this.sessionId = localStorage.getItem('trading_session_id') || this.generateSessionId();
    localStorage.setItem('trading_session_id', this.sessionId);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Session-ID': this.sessionId,
      ...options.headers
    };

    const config = {
      ...options,
      headers,
      credentials: 'include'
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
          message: response.statusText
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Trades API
  async getTrades(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/api/trades${params ? '?' + params : ''}`);
  }

  async getTrade(id) {
    return this.request(`/api/trades/${id}`);
  }

  async createTrade(tradeData) {
    return this.request('/api/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData)
    });
  }

  async updateTrade(id, updates) {
    return this.request(`/api/trades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteTrade(id) {
    return this.request(`/api/trades/${id}`, {
      method: 'DELETE'
    });
  }

  async getTradeStats() {
    return this.request('/api/trades/stats/summary');
  }

  // Coach API
  async analyzeTrade(tradeId, marketContext = {}) {
    return this.request(`/api/coach/analyze/${tradeId}`, {
      method: 'POST',
      body: JSON.stringify({ marketContext })
    });
  }

  async getCoachingAdvice(marketContext, traderProfile = {}) {
    return this.request('/api/coach/advice', {
      method: 'POST',
      body: JSON.stringify({ marketContext, traderProfile })
    });
  }

  async detectBiases() {
    return this.request('/api/coach/biases');
  }

  async getMarketAnalysis(symbols = ['BTCUSD'], timeframe = '1H', indicators = ['RSI', 'MACD']) {
    return this.request('/api/coach/market-analysis', {
      method: 'POST',
      body: JSON.stringify({ symbols, timeframe, indicators })
    });
  }

  // History API
  async getHistory() {
    return this.request('/api/history');
  }

  // Session API
  async getSession(sessionId = this.sessionId) {
    return this.request(`/api/session/${sessionId}`);
  }

  async addSessionMessage(role, content, type = 'coaching') {
    return this.request(`/api/session/${this.sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ role, content, type })
    });
  }

  async getSessionHistory(limit = 20, type = 'all') {
    return this.request(`/api/session/${this.sessionId}/history?limit=${limit}&type=${type}`);
  }

  async updateSessionMetadata(updates) {
    return this.request(`/api/session/${this.sessionId}/metadata`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // System API
  async getHealth() {
    return this.request('/health');
  }

  async getAPIInfo() {
    return this.request('/api');
  }

  // Mock data for offline/fallback
  getMockTrades() {
    return Promise.resolve({
      success: true,
      count: 15,
      trades: [
        {
          id: 'trade_1',
          symbol: 'BTCUSD',
          type: 'buy',
          entryPrice: 95000,
          exitPrice: 97000,
          positionSize: 0.1,
          profit: 200,
          duration: 150,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Breakout trade',
          status: 'win'
        },
        {
          id: 'trade_2',
          symbol: 'ETHUSD',
          type: 'sell',
          entryPrice: 3200,
          exitPrice: 3100,
          positionSize: 1,
          profit: 100,
          duration: 45,
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          notes: 'Short scalp',
          status: 'win'
        }
      ]
    });
  }

  getMockStats() {
    return Promise.resolve({
      success: true,
      stats: {
        totalTrades: 15,
        winRate: 68.5,
        totalProfit: 12500.50,
        avgProfit: 450.25,
        avgLoss: -320.75,
        profitFactor: 1.85,
        maxDrawdown: 1250.50,
        sharpeRatio: 1.25,
        expectancy: 0.45
      }
    });
  }

  getMockCoaching() {
    return Promise.resolve({
      success: true,
      advice: 'Market showing consolidation. Wait for clear breakout above $95,500 before entering long. Set stop at $94,800.',
      timestamp: new Date().toISOString(),
      source: 'mock'
    });
  }
}

// Export singleton instance
window.TradingAPI = new TradingAPI();
