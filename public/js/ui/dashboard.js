class DashboardUI {
  constructor() {
    this.api = window.TradingAPI;
    this.state = window.TradingState;
    this.biasEngine = window.BiasEngine;
    
    this.elements = {
      dashboard: document.getElementById('dashboard'),
      statsContainer: document.getElementById('stats-container'),
      tradesContainer: document.getElementById('trades-container'),
      marketContainer: document.getElementById('market-container'),
      biasesContainer: document.getElementById('biases-container'),
      chartsContainer: document.getElementById('charts-container'),
      loadingIndicator: document.getElementById('loading-indicator'),
      errorDisplay: document.getElementById('error-display')
    };

    this.init();
  }

  init() {
    this.render();
    this.loadData();
    this.setupEventListeners();
    
    // Subscribe to state changes
    this.state.subscribe((oldState, newState) => {
      if (oldState.trades !== newState.trades) {
        this.renderTrades();
        this.renderStats();
      }
      if (oldState.biases !== newState.biases) {
        this.renderBiases();
      }
      if (oldState.ui.loading !== newState.ui.loading) {
        this.toggleLoading(newState.ui.loading);
      }
      if (oldState.ui.error !== newState.ui.error) {
        this.showError(newState.ui.error);
      }
    });
  }

  async loadData() {
    this.state.setLoading(true);
    
    try {
      // Load trades and stats
      const [tradesData, historyData, biasesData] = await Promise.allSettled([
        this.api.getTrades(),
        this.api.getHistory(),
        this.api.detectBiases()
      ]);

      // Handle trades
      if (tradesData.status === 'fulfilled') {
        this.state.setTrades(tradesData.value.trades || []);
      } else {
        console.warn('Using mock trades data');
        const mockData = await this.api.getMockTrades();
        this.state.setTrades(mockData.trades);
      }

      // Handle biases
      if (biasesData.status === 'fulfilled') {
        this.state.setBiases(biasesData.value.detectedBiases || []);
      } else {
        const analysis = this.biasEngine.analyzeTrades(this.state.getState().trades);
        this.state.setBiases(analysis.biases);
      }

      // Handle history
      if (historyData.status === 'fulfilled') {
        this.renderCharts(historyData.value.chartData);
      }

      // Load market data
      await this.loadMarketData();

    } catch (error) {
      console.error('Failed to load data:', error);
      this.state.setError('Failed to load dashboard data');
    } finally {
      this.state.setLoading(false);
    }
  }

  async loadMarketData() {
    try {
      const response = await this.api.getMarketAnalysis();
      if (response.success) {
        this.renderMarketData(response.marketData);
      }
    } catch (error) {
      console.warn('Using mock market data');
      this.renderMarketData(this.getMockMarketData());
    }
  }

  getMockMarketData() {
    return {
      btcusd: {
        price: 95450 + Math.random() * 1000,
        change24h: (Math.random() * 6 - 3).toFixed(2),
        rsi: 55 + Math.random() * 10 - 5,
        volume: (1000000 + Math.random() * 500000).toFixed(0),
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
        support: 94500,
        resistance: 96500
      },
      ethusd: {
        price: 3150 + Math.random() * 100,
        change24h: (Math.random() * 4 - 2).toFixed(2),
        rsi: 52 + Math.random() * 8 - 4,
        volume: (500000 + Math.random() * 250000).toFixed(0),
        sentiment: Math.random() > 0.4 ? 'bullish' : 'bearish',
        support: 3100,
        resistance: 3300
      }
    };
  }

  render() {
    this.renderStats();
    this.renderTrades();
    this.renderMarketData();
    this.renderBiases();
    this.renderCharts();
  }

  renderStats() {
    const { stats } = this.state.getState();
    const statsHTML = `
      <div class="dashboard-grid">
        <!-- Total Trades -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Total Trades</h3>
            <span class="badge badge-info">All-time</span>
          </div>
          <div class="stat-value">${stats.totalTrades}</div>
          <div class="stat-change">
            <span class="stat-label">+15 this week</span>
          </div>
        </div>

        <!-- Win Rate -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Win Rate</h3>
            <span class="badge badge-info">Last 30 days</span>
          </div>
          <div class="stat-value ${stats.winRate >= 50 ? 'profit-text' : 'loss-text'}">
            ${stats.winRate}%
          </div>
          <div class="stat-change">
            ${stats.winRate >= 50 ? '📈' : '📉'}
            <span class="stat-label">${stats.winRate >= 50 ? 'Above target' : 'Needs improvement'}</span>
          </div>
        </div>

        <!-- Net P&L -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Net P&L</h3>
            <span class="badge badge-info">Since inception</span>
          </div>
          <div class="stat-value ${stats.totalProfit >= 0 ? 'profit-text' : 'loss-text'}">
            ${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}
          </div>
          <div class="stat-change">
            ${stats.totalProfit >= 0 ? '💰' : '💸'}
            <span class="stat-label">${stats.totalProfit >= 0 ? 'Profitable' : 'Negative'}</span>
          </div>
        </div>

        <!-- Risk Score -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Risk Score</h3>
            <span class="badge ${stats.maxDrawdown < 500 ? 'badge-success' : stats.maxDrawdown < 1500 ? 'badge-warning' : 'badge-danger'}">
              ${stats.maxDrawdown < 500 ? 'Low Risk' : stats.maxDrawdown < 1500 ? 'Medium Risk' : 'High Risk'}
            </span>
          </div>
          <div class="stat-value">${(100 - Math.min(100, stats.maxDrawdown / 100)).toFixed(1)}</div>
          <div class="stat-change">
            <span class="stat-label">Out of 100</span>
          </div>
        </div>

        <!-- Profit Factor -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Profit Factor</h3>
            <span class="badge ${stats.profitFactor > 1.5 ? 'badge-success' : stats.profitFactor > 1 ? 'badge-warning' : 'badge-danger'}">
              ${stats.profitFactor > 1.5 ? 'Excellent' : stats.profitFactor > 1 ? 'Good' : 'Poor'}
            </span>
          </div>
          <div class="stat-value">${stats.profitFactor.toFixed(2)}</div>
          <div class="stat-change">
            <span class="stat-label">${stats.profitFactor > 1.5 ? 'Strong' : stats.profitFactor > 1 ? 'Acceptable' : 'Weak'}</span>
          </div>
        </div>

        <!-- Max Drawdown -->
        <div class="card stat-card">
          <div class="card-header">
            <h3 class="card-title">Max Drawdown</h3>
            <span class="badge ${stats.maxDrawdown < 500 ? 'badge-success' : stats.maxDrawdown < 1500 ? 'badge-warning' : 'badge-danger'}">
              $${stats.maxDrawdown.toFixed(2)}
            </span>
          </div>
          <div class="stat-value">${((stats.maxDrawdown / Math.max(1, stats.totalProfit)) * 100).toFixed(1)}%</div>
          <div class="stat-change">
            <span class="stat-label">of total profit</span>
          </div>
        </div>
      </div>
    `;

    if (this.elements.statsContainer) {
      this.elements.statsContainer.innerHTML = statsHTML;
    }
  }

  renderTrades() {
    const { trades } = this.state.getState();
    const recentTrades = trades.slice(0, 10);

    if (recentTrades.length === 0) {
      if (this.elements.tradesContainer) {
        this.elements.tradesContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <h3>No trades yet</h3>
            <p>Start trading to see your performance here</p>
            <button class="btn btn-primary" id="add-first-trade">Add Your First Trade</button>
          </div>
        `;
        
        document.getElementById('add-first-trade')?.addEventListener('click', () => {
          this.openAddTradeModal();
        });
      }
      return;
    }

    const tradesHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Trades</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" id="view-all-trades">View All</button>
            <button class="btn btn-primary btn-sm" id="add-trade">+ Add Trade</button>
          </div>
        </div>
        <div class="trade-list">
          ${recentTrades.map(trade => this.renderTradeItem(trade)).join('')}
        </div>
      </div>
    `;

    if (this.elements.tradesContainer) {
      this.elements.tradesContainer.innerHTML = tradesHTML;
      this.attachTradeEventListeners();
    }
  }

  renderTradeItem(trade) {
    const profit = trade.profit || 0;
    const profitPercent = trade.entryPrice ? 
      ((profit / (trade.entryPrice * (trade.positionSize || 1))) * 100).toFixed(2) : '0.00';
    
    const isWin = profit > 0;
    const tradeType = trade.type === 'buy' ? 'Long' : 'Short';
    const timestamp = new Date(trade.timestamp).toLocaleString();
    const duration = trade.duration ? `${Math.floor(trade.duration / 60)}h ${trade.duration % 60}m` : 'N/A';

    return `
      <div class="trade-item ${isWin ? 'win' : 'loss'}" data-trade-id="${trade.id}">
        <div class="trade-symbol">${trade.symbol}</div>
        <div class="trade-details">
          <div class="flex justify-between">
            <span class="font-semibold">${tradeType} • ${duration}</span>
            <span class="font-mono ${isWin ? 'profit-text' : 'loss-text'}">
              ${isWin ? '+' : ''}$${profit.toFixed(2)} (${isWin ? '+' : ''}${profitPercent}%)
            </span>
          </div>
          <div class="trade-meta">
            <span>Entry: $${trade.entryPrice?.toFixed(2) || 'N/A'}</span>
            <span>Exit: $${trade.exitPrice?.toFixed(2) || 'N/A'}</span>
            <span>Size: ${trade.positionSize || 'N/A'}</span>
            <span>${timestamp}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm btn-icon analyze-trade" title="Analyze">
            🔍
          </button>
          <button class="btn btn-secondary btn-sm btn-icon edit-trade" title="Edit">
            ✏️
          </button>
        </div>
      </div>
    `;
  }

  renderMarketData(marketData = this.getMockMarketData()) {
    const btc = marketData.btcusd;
    const eth = marketData.ethusd;

    const marketHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Market Overview</h3>
          <span class="badge badge-info">Live</span>
        </div>
        <div class="space-y-4">
          <!-- BTC/USD -->
          <div class="market-item">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg">BTC/USD</span>
                <span class="text-sm text-tertiary">1H</span>
              </div>
              <div class="font-mono font-bold text-lg ${btc.change24h >= 0 ? 'profit-text' : 'loss-text'}">
                $${btc.price.toFixed(0)}
                <span class="text-sm ml-2">${btc.change24h >= 0 ? '▲' : '▼'} ${Math.abs(btc.change24h)}%</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span class="text-tertiary">RSI:</span>
                <span class="font-mono ml-2 ${btc.rsi > 70 ? 'loss-text' : btc.rsi < 30 ? 'profit-text' : ''}">
                  ${btc.rsi.toFixed(1)}
                </span>
              </div>
              <div>
                <span class="text-tertiary">Volume:</span>
                <span class="font-mono ml-2">${this.formatVolume(btc.volume)}</span>
              </div>
              <div>
                <span class="text-tertiary">Sentiment:</span>
                <span class="ml-2 ${btc.sentiment === 'bullish' ? 'profit-text' : 'loss-text'}">
                  ${btc.sentiment === 'bullish' ? '🐂' : '🐻'} ${btc.sentiment}
                </span>
              </div>
            </div>
            <div class="mt-2 text-xs text-tertiary">
              Support: $${btc.support.toFixed(0)} • Resistance: $${btc.resistance.toFixed(0)}
            </div>
          </div>

          <!-- ETH/USD -->
          <div class="market-item">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg">ETH/USD</span>
                <span class="text-sm text-tertiary">1H</span>
              </div>
              <div class="font-mono font-bold text-lg ${eth.change24h >= 0 ? 'profit-text' : 'loss-text'}">
                $${eth.price.toFixed(0)}
                <span class="text-sm ml-2">${eth.change24h >= 0 ? '▲' : '▼'} ${Math.abs(eth.change24h)}%</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span class="text-tertiary">RSI:</span>
                <span class="font-mono ml-2 ${eth.rsi > 70 ? 'loss-text' : eth.rsi < 30 ? 'profit-text' : ''}">
                  ${eth.rsi.toFixed(1)}
                </span>
              </div>
              <div>
                <span class="text-tertiary">Volume:</span>
                <span class="font-mono ml-2">${this.formatVolume(eth.volume)}</span>
              </div>
              <div>
                <span class="text-tertiary">Sentiment:</span>
                <span class="ml-2 ${eth.sentiment === 'bullish' ? 'profit-text' : 'loss-text'}">
                  ${eth.sentiment === 'bullish' ? '🐂' : '🐻'} ${eth.sentiment}
                </span>
              </div>
            </div>
            <div class="mt-2 text-xs text-tertiary">
              Support: $${eth.support.toFixed(0)} • Resistance: $${eth.resistance.toFixed(0)}
            </div>
          </div>

          <!-- Volatility Alert -->
          <div class="p-3 rounded bg-warning-50 border border-warning-200">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-warning-600">⚠️</span>
              <span class="font-semibold text-warning-700">Volatility Alert</span>
            </div>
            <div class="text-sm text-warning-600">
              <div class="mb-1">BUY SIGNAL: Strong Momentum detected</div>
              <div class="text-xs">Increasing volume with breakout potential</div>
            </div>
          </div>

          <!-- Technical Indicators -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 rounded bg-secondary border border-light">
              <div class="text-sm text-tertiary mb-1">RSI (14)</div>
              <div class="font-mono font-bold text-lg ${btc.rsi > 70 ? 'loss-text' : btc.rsi < 30 ? 'profit-text' : ''}">
                ${btc.rsi.toFixed(2)}
              </div>
              <div class="text-xs text-tertiary mt-1">
                ${btc.rsi > 70 ? 'Overbought' : btc.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>
            <div class="p-3 rounded bg-secondary border border-light">
              <div class="text-sm text-tertiary mb-1">MACD</div>
              <div class="font-mono font-bold text-lg ${btc.change24h >= 0 ? 'profit-text' : 'loss-text'}">
                ${(btc.change24h / 10).toFixed(3)}
              </div>
              <div class="text-xs text-tertiary mt-1">
                ${btc.change24h >= 0 ? 'Bullish' : 'Bearish'} momentum
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (this.elements.marketContainer) {
      this.elements.marketContainer.innerHTML = marketHTML;
    }
  }

  renderBiases() {
    const { biases } = this.state.getState();
    
    if (biases.length === 0) {
      if (this.elements.biasesContainer) {
        this.elements.biasesContainer.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Behavioral Analysis</h3>
              <span class="badge badge-success">No Biases Detected</span>
            </div>
            <div class="p-4 text-center">
              <div class="text-4xl mb-3">🎯</div>
              <h4 class="font-semibold mb-2">Excellent Discipline</h4>
              <p class="text-tertiary text-sm">No psychological biases detected in recent trades.</p>
              <button class="btn btn-secondary btn-sm mt-3" id="refresh-biases">
                Refresh Analysis
              </button>
            </div>
          </div>
        `;

        document.getElementById('refresh-biases')?.addEventListener('click', () => {
          this.refreshBiasAnalysis();
        });
      }
      return;
    }

    const biasesHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Behavioral Analysis</h3>
          <span class="badge badge-danger">${biases.length} Bias${biases.length > 1 ? 'es' : ''} Detected</span>
        </div>
        <div class="space-y-3">
          ${biases.map(bias => this.renderBiasItem(bias)).join('')}
        </div>
        <div class="mt-4 pt-3 border-t border-light">
          <div class="flex justify-between items-center">
            <span class="text-sm text-tertiary">AI recommendations will appear in coach panel</span>
            <button class="btn btn-primary btn-sm" id="get-coaching">
              Get Coaching
            </button>
          </div>
        </div>
      </div>
    `;

    if (this.elements.biasesContainer) {
      this.elements.biasesContainer.innerHTML = biasesHTML;
      
      document.getElementById('get-coaching')?.addEventListener('click', () => {
        const coachUI = window.CoachUI;
        if (coachUI) {
          const biasText = biases.map(b => b.name).join(', ');
          coachUI.sendMessage(`I've detected these biases: ${biasText}. Can you help me improve?`);
        }
      });
    }
  }

  renderBiasItem(bias) {
    const severityClass = {
      low: 'badge-success',
      medium: 'badge-warning',
      high: 'badge-danger'
    }[bias.severity] || 'badge-info';

    const icon = {
      lossAversion: '💸',
      overconfidence: '🚀',
      revengeTrading: '⚡',
      confirmationBias: '👁️',
      anchoring: '⚓'
    }[bias.type] || '⚠️';

    return `
      <div class="bias-item p-3 rounded border border-light">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">${icon}</span>
            <span class="font-semibold">${bias.name}</span>
          </div>
          <span class="badge ${severityClass}">
            ${bias.severity.toUpperCase()}
          </span>
        </div>
        <p class="text-sm text-tertiary mb-2">${bias.evidence}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs">Confidence: ${bias.confidence}%</span>
          <button class="btn btn-secondary btn-sm acknowledge-bias" data-bias="${bias.type}">
            Acknowledge
          </button>
        </div>
      </div>
    `;
  }

  renderCharts(chartData = null) {
    if (!chartData) {
      // Generate mock chart data
      chartData = {
        cumulative: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
          profit: (Math.random() * 1000 - 500),
          cumulative: (i + 1) * 100 + Math.random() * 500
        }))
      };
    }

    const chartHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Performance Charts</h3>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm active" data-chart="pnl">P&L</button>
            <button class="btn btn-secondary btn-sm" data-chart="winrate">Win Rate</button>
            <button class="btn btn-secondary btn-sm" data-chart="volume">Volume</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="performance-chart" width="800" height="300"></canvas>
        </div>
        <div class="mt-3 text-center">
          <div class="text-sm text-tertiary">
            Cumulative P&L: <span class="font-bold profit-text">+$${chartData.cumulative[chartData.cumulative.length - 1]?.cumulative?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>
    `;

    if (this.elements.chartsContainer) {
      this.elements.chartsContainer.innerHTML = chartHTML;
      this.renderChart(chartData);
      this.attachChartEventListeners();
    }
  }

  renderChart(chartData) {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple line chart for cumulative P&L
    const data = chartData.cumulative;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;

    // Calculate scales
    const xScale = (i) => margin.left + (i / (data.length - 1)) * width;
    const yMin = Math.min(...data.map(d => d.cumulative));
    const yMax = Math.max(...data.map(d => d.cumulative));
    const yScale = (value) => {
      const range = yMax - yMin || 1;
      return margin.top + height - ((value - yMin) / range) * height;
    };

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = 'var(--text-tertiary)';
      ctx.font = '10px var(--font-sans)';
      ctx.textAlign = 'right';
      const value = yMax - (i / 5) * (yMax - yMin);
      ctx.fillText(`$${value.toFixed(0)}`, margin.left - 5, y + 3);
    }

    // Vertical grid lines
    for (let i = 0; i < data.length; i += Math.ceil(data.length / 5)) {
      const x = xScale(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + height);
      ctx.stroke();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = 'var(--chart-line)';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.cumulative);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw area under line
    const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(data[0].cumulative));
    data.forEach((d, i) => {
      const x = xScale(i);
      const y = yScale(d.cumulative);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(xScale(data.length - 1), margin.top + height);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw data points
    data.forEach((d, i) => {
      if (i % Math.ceil(data.length / 10) === 0) { // Show every 10th point
        const x = xScale(i);
        const y = yScale(d.cumulative);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = d.cumulative >= 0 ? 'var(--profit-500)' : 'var(--loss-500)';
        ctx.fill();
        ctx.strokeStyle = 'var(--bg-card)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw X-axis labels
    ctx.fillStyle = 'var(--text-tertiary)';
    ctx.font = '10px var(--font-sans)';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < data.length; i += Math.ceil(data.length / 5)) {
      const x = xScale(i);
      const date = new Date(data[i].date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      ctx.fillText(label, x, margin.top + height + 15);
    }

    // Draw title
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = 'bold 14px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.fillText('Cumulative P&L (Last 30 Days)', canvas.width / 2, 15);
  }

  formatVolume(volume) {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    }
    return `$${volume}`;
  }

  attachTradeEventListeners() {
    // Trade item click
    document.querySelectorAll('.trade-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.analyze-trade') && !e.target.closest('.edit-trade')) {
          const tradeId = item.dataset.tradeId;
          this.viewTradeDetails(tradeId);
        }
      });
    });

    // Analyze buttons
    document.querySelectorAll('.analyze-trade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tradeId = e.target.closest('.trade-item').dataset.tradeId;
        this.analyzeTrade(tradeId);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-trade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tradeId = e.target.closest('.trade-item').dataset.tradeId;
        this.editTrade(tradeId);
      });
    });

    // View all trades button
    document.getElementById('view-all-trades')?.addEventListener('click', () => {
      this.viewAllTrades();
    });

    // Add trade button
    document.getElementById('add-trade')?.addEventListener('click', () => {
      this.openAddTradeModal();
    });
  }

  attachChartEventListeners() {
    document.querySelectorAll('[data-chart]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chartType = e.target.dataset.chart;
        
        // Update active state
        document.querySelectorAll('[data-chart]').forEach(b => {
          b.classList.toggle('active', b === e.target);
        });

        // TODO: Switch chart type
        console.log('Switch to chart:', chartType);
      });
    });
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-data')?.addEventListener('click', () => {
      this.loadData();
    });

    // Export button
    document.getElementById('export-data')?.addEventListener('click', () => {
      this.state.exportData();
    });

    // Import button
    document.getElementById('import-data')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.state.importData(file).then(result => {
          alert(`Imported ${result.imported} trades successfully`);
          this.loadData();
        }).catch(error => {
          alert('Failed to import data: ' + error.message);
        });
      }
    });
  }

  toggleLoading(loading) {
    if (this.elements.loadingIndicator) {
      this.elements.loadingIndicator.style.display = loading ? 'flex' : 'none';
    }
  }

  showError(error) {
    if (!error) {
      if (this.elements.errorDisplay) {
        this.elements.errorDisplay.style.display = 'none';
      }
      return;
    }

    if (this.elements.errorDisplay) {
      this.elements.errorDisplay.innerHTML = `
        <div class="error-alert">
          <span class="error-icon">⚠️</span>
          <span class="error-message">${error}</span>
          <button class="error-dismiss">&times;</button>
        </div>
      `;
      this.elements.errorDisplay.style.display = 'block';

      // Add dismiss button listener
      this.elements.errorDisplay.querySelector('.error-dismiss')?.addEventListener('click', () => {
        this.state.setError(null);
      });
    }
  }

  async viewTradeDetails(tradeId) {
    try {
      const response = await this.api.getTrade(tradeId);
      if (response.success) {
        this.state.selectTrade(response.trade);
        this.openTradeDetailsModal(response.trade);
      }
    } catch (error) {
      console.error('Failed to load trade details:', error);
    }
  }

  async analyzeTrade(tradeId) {
    const coachUI = window.CoachUI;
    if (coachUI) {
      coachUI.analyzeSpecificTrade(tradeId);
    }
  }

  editTrade(tradeId) {
    const trade = this.state.getState().trades.find(t => t.id === tradeId);
    if (trade) {
      this.openEditTradeModal(trade);
    }
  }

  viewAllTrades() {
    this.state.setActiveTab('history');
    // This would trigger the history tab to show all trades
    const event = new CustomEvent('tabchange', { detail: { tab: 'history' } });
    window.dispatchEvent(event);
  }

  openAddTradeModal() {
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal" style="width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Add New Trade</h3>
            <button class="btn btn-icon close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <form id="add-trade-form" class="space-y-3">
              <div class="form-group">
                <label class="form-label">Symbol *</label>
                <input type="text" class="form-input" name="symbol" required 
                       placeholder="BTCUSD, ETHUSD, etc.">
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Type *</label>
                  <select class="form-input" name="type" required>
                    <option value="buy">Buy (Long)</option>
                    <option value="sell">Sell (Short)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Position Size *</label>
                  <input type="number" class="form-input" name="positionSize" required 
                         step="0.01" placeholder="1.0">
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Entry Price *</label>
                  <input type="number" class="form-input" name="entryPrice" required 
                         step="0.01" placeholder="95000.00">
                </div>
                <div class="form-group">
                  <label class="form-label">Exit Price *</label>
                  <input type="number" class="form-input" name="exitPrice" required 
                         step="0.01" placeholder="97000.00">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Duration (minutes)</label>
                <input type="number" class="form-input" name="duration" 
                       placeholder="150">
              </div>
              
              <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-input" name="notes" rows="3" 
                          placeholder="Trade setup, emotions, lessons learned..."></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Cancel</button>
            <button type="submit" form="add-trade-form" class="btn btn-primary">Add Trade</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submission handler
    const form = document.getElementById('add-trade-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const tradeData = Object.fromEntries(formData.entries());
      
      try {
        const response = await this.api.createTrade(tradeData);
        if (response.success) {
          this.state.addTrade(response.trade);
          this.closeModal();
          alert('Trade added successfully!');
        }
      } catch (error) {
        alert('Failed to add trade: ' + error.message);
      }
    });

    // Add close handlers
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
  }

  openEditTradeModal(trade) {
    // Similar to add modal but pre-filled
    // Implementation omitted for brevity
  }

  openTradeDetailsModal(trade) {
    // Show trade details in modal
    // Implementation omitted for brevity
  }

  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  async refreshBiasAnalysis() {
    this.state.setLoading(true);
    
    try {
      const response = await this.api.detectBiases();
      if (response.success) {
        this.state.setBiases(response.detectedBiases || []);
      }
    } catch (error) {
      console.error('Failed to refresh biases:', error);
    } finally {
      this.state.setLoading(false);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.DashboardUI = new DashboardUI();
});
