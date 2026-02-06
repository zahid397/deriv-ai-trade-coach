class TradingState {
  constructor() {
    this.state = {
      // Core data
      trades: [],
      selectedTrade: null,
      coachingHistory: [],
      biases: [],
      patterns: [],
      
      // Statistics
      stats: {
        totalTrades: 0,
        winRate: 0,
        totalProfit: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      },
      
      // Session
      session: {
        id: localStorage.getItem('trading_session_id') || '',
        messages: [],
        metadata: {}
      },
      
      // UI state
      ui: {
        loading: false,
        error: null,
        activeTab: 'dashboard',
        modal: null,
        theme: localStorage.getItem('theme') || 'dark'
      },
      
      // Market data
      market: {
        btcusd: {
          price: 0,
          change24h: 0,
          rsi: 0,
          volume: 0
        },
        ethusd: {
          price: 0,
          change24h: 0,
          rsi: 0,
          volume: 0
        }
      },
      
      // Chart data
      charts: {
        pnl: [],
        winRate: [],
        volume: []
      }
    };

    this.listeners = new Set();
    
    // Initialize
    this.init();
  }

  init() {
    // Load saved state
    this.loadFromStorage();
    
    // Setup theme
    this.applyTheme(this.state.ui.theme);
    
    // Setup auto-save
    setInterval(() => this.saveToStorage(), 30000);
  }

  // State management
  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const oldState = this.state;
    this.state = { ...oldState, ...updates };
    this.notifyListeners(oldState, this.state);
  }

  updateState(path, value) {
    const newState = { ...this.state };
    const keys = path.split('.');
    let current = newState;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.setState(newState);
  }

  // Listeners
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(oldState, newState) {
    this.listeners.forEach(listener => listener(oldState, newState));
  }

  // Specific state updates
  setTrades(trades) {
    this.setState({ trades });
    this.calculateStats(trades);
  }

  addTrade(trade) {
    const trades = [trade, ...this.state.trades];
    this.setTrades(trades);
  }

  updateTrade(id, updates) {
    const trades = this.state.trades.map(trade =>
      trade.id === id ? { ...trade, ...updates } : trade
    );
    this.setTrades(trades);
  }

  deleteTrade(id) {
    const trades = this.state.trades.filter(trade => trade.id !== id);
    this.setTrades(trades);
  }

  selectTrade(trade) {
    this.setState({ selectedTrade: trade });
  }

  addCoachingMessage(role, content, type = 'coaching') {
    const message = {
      id: `msg_${Date.now()}`,
      role,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    const coachingHistory = [...this.state.coachingHistory, message];
    const session = {
      ...this.state.session,
      messages: [...this.state.session.messages, message]
    };

    this.setState({ coachingHistory, session });
  }

  setBiases(biases) {
    this.setState({ biases });
  }

  setPatterns(patterns) {
    this.setState({ patterns });
  }

  setLoading(loading) {
    this.updateState('ui.loading', loading);
  }

  setError(error) {
    this.updateState('ui.error', error);
  }

  setActiveTab(tab) {
    this.updateState('ui.activeTab', tab);
  }

  openModal(modal) {
    this.updateState('ui.modal', modal);
  }

  closeModal() {
    this.updateState('ui.modal', null);
  }

  toggleTheme() {
    const newTheme = this.state.ui.theme === 'dark' ? 'light' : 'dark';
    this.updateState('ui.theme', newTheme);
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Calculations
  calculateStats(trades) {
    if (!trades || trades.length === 0) {
      this.setState({ stats: this.getEmptyStats() });
      return;
    }

    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    const winRate = (winningTrades.length / trades.length) * 100;
    const profitFactor = totalLosses === 0 ? 99 : totalWins / totalLosses;
    
    // Simple drawdown calculation
    let runningBalance = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    trades.forEach(trade => {
      runningBalance += trade.profit;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = peak - runningBalance;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const stats = {
      totalTrades: trades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      avgProfit: winningTrades.length ? parseFloat((totalWins / winningTrades.length).toFixed(2)) : 0,
      avgLoss: losingTrades.length ? parseFloat((totalLosses / losingTrades.length).toFixed(2)) : 0,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: 0, // Would need more data for real calculation
      expectancy: 0
    };

    this.setState({ stats });
  }

  getEmptyStats() {
    return {
      totalTrades: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      expectancy: 0
    };
  }

  // Chart data preparation
  preparePnLChart() {
    if (this.state.trades.length === 0) return [];

    const dailyData = {};
    this.state.trades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += trade.profit;
    });

    return Object.entries(dailyData)
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }

  prepareWinRateChart() {
    if (this.state.trades.length < 10) return [];

    const windowSize = 10;
    const winRates = [];
    
    for (let i = 0; i <= this.state.trades.length - windowSize; i++) {
      const window = this.state.trades.slice(i, i + windowSize);
      const wins = window.filter(t => t.profit > 0).length;
      winRates.push({
        index: i,
        winRate: (wins / windowSize) * 100
      });
    }

    return winRates;
  }

  // Storage
  saveToStorage() {
    try {
      const data = {
        trades: this.state.trades,
        coachingHistory: this.state.coachingHistory.slice(-50), // Keep last 50
        session: this.state.session,
        ui: {
          theme: this.state.ui.theme,
          activeTab: this.state.ui.activeTab
        }
      };
      
      localStorage.setItem('trading_state', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }

  loadFromStorage() {
    try {
      const data = JSON.parse(localStorage.getItem('trading_state'));
      if (data) {
        this.setState({
          trades: data.trades || [],
          coachingHistory: data.coachingHistory || [],
          session: data.session || this.state.session,
          ui: { ...this.state.ui, ...data.ui }
        });
        
        if (data.trades && data.trades.length > 0) {
          this.calculateStats(data.trades);
        }
      }
    } catch (error) {
      console.warn('Failed to load state:', error);
    }
  }

  // Export/Import
  exportData() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trades: this.state.trades,
      coachingHistory: this.state.coachingHistory,
      stats: this.state.stats,
      session: this.state.session
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          
          // Validate data structure
          if (!data.trades || !Array.isArray(data.trades)) {
            throw new Error('Invalid data format: trades array missing');
          }

          // Merge with existing data
          const newTrades = [...data.trades, ...this.state.trades]
            .filter((trade, index, self) => 
              index === self.findIndex(t => t.id === trade.id)
            )
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          this.setTrades(newTrades);
          
          if (data.coachingHistory) {
            const newHistory = [...data.coachingHistory, ...this.state.coachingHistory]
              .filter((msg, index, self) => 
                index === self.findIndex(m => m.id === msg.id)
              )
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(-50);

            this.setState({ coachingHistory: newHistory });
          }

          resolve({ success: true, imported: data.trades.length });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Utility methods
  getRecentTrades(limit = 10) {
    return this.state.trades.slice(0, limit);
  }

  getTopPerformers(limit = 5) {
    return [...this.state.trades]
      .filter(t => t.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  getBiggestLosses(limit = 5) {
    return [...this.state.trades]
      .filter(t => t.profit < 0)
      .sort((a, b) => a.profit - b.profit)
      .slice(0, limit);
  }

  getSymbolStats() {
    const symbolMap = {};
    
    this.state.trades.forEach(trade => {
      if (!symbolMap[trade.symbol]) {
        symbolMap[trade.symbol] = {
          trades: 0,
          wins: 0,
          profit: 0,
          totalProfit: 0
        };
      }
      
      symbolMap[trade.symbol].trades++;
      symbolMap[trade.symbol].totalProfit += trade.profit;
      
      if (trade.profit > 0) {
        symbolMap[trade.symbol].wins++;
        symbolMap[trade.symbol].profit += trade.profit;
      }
    });

    return Object.entries(symbolMap).map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      winRate: (data.wins / data.trades) * 100,
      totalProfit: data.totalProfit,
      avgProfit: data.totalProfit / data.trades
    })).sort((a, b) => b.totalProfit - a.totalProfit);
  }

  getTradeCountByHour() {
    const hours = Array(24).fill(0);
    
    this.state.trades.forEach(trade => {
      const hour = new Date(trade.timestamp).getHours();
      hours[hour]++;
    });

    return hours.map((count, hour) => ({ hour, count }));
  }

  // Session management
  clearSession() {
    this.setState({
      coachingHistory: [],
      session: {
        ...this.state.session,
        messages: []
      }
    });
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      this.setState({
        trades: [],
        coachingHistory: [],
        selectedTrade: null,
        biases: [],
        patterns: [],
        stats: this.getEmptyStats(),
        session: {
          id: this.state.session.id,
          messages: [],
          metadata: {}
        }
      });
      
      localStorage.removeItem('trading_state');
    }
  }
}

// Export singleton instance
window.TradingState = new TradingState();
