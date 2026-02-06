class CoachUI {
  constructor() {
    this.api = window.TradingAPI;
    this.state = window.TradingState;
    
    this.elements = {
      coachPanel: document.getElementById('coach-panel'),
      messagesContainer: document.getElementById('coach-messages'),
      coachInput: document.getElementById('coach-input'),
      coachForm: document.getElementById('coach-form'),
      sendButton: document.getElementById('send-button'),
      analyzeButton: document.getElementById('analyze-button'),
      statusIndicator: document.getElementById('coach-status'),
      aiModeIndicator: document.getElementById('ai-mode')
    };

    this.isTyping = false;
    this.messageQueue = [];
    this.init();
  }

  init() {
    this.loadSessionHistory();
    this.setupEventListeners();
    
    // Subscribe to state changes
    this.state.subscribe((oldState, newState) => {
      if (oldState.coachingHistory !== newState.coachingHistory) {
        this.renderMessages();
      }
      if (oldState.selectedTrade !== newState.selectedTrade) {
        this.handleSelectedTrade(newState.selectedTrade);
      }
    });

    // Send welcome message
    setTimeout(() => {
      this.sendWelcomeMessage();
    }, 1000);
  }

  loadSessionHistory() {
    const { coachingHistory } = this.state.getState();
    if (coachingHistory.length > 0) {
      this.renderMessages();
    }
  }

  setupEventListeners() {
    // Send message form
    if (this.elements.coachForm) {
      this.elements.coachForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Analyze button
    if (this.elements.analyzeButton) {
      this.elements.analyzeButton.addEventListener('click', () => {
        this.analyzeCurrentTrades();
      });
    }

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Input enter key
    if (this.elements.coachInput) {
      this.elements.coachInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  renderMessages() {
    const { coachingHistory } = this.state.getState();
    
    if (!this.elements.messagesContainer) return;

    this.elements.messagesContainer.innerHTML = coachingHistory
      .map(msg => this.renderMessage(msg))
      .join('');

    // Scroll to bottom
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  renderMessage(message) {
    const isAI = message.role === 'assistant' || message.role === 'ai';
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
      <div class="message ${isAI ? 'ai' : 'user'} ${message.type === 'typing' ? 'typing' : ''}" 
           data-id="${message.id}">
        <div class="message-content">${this.formatMessage(message.content)}</div>
        <div class="message-meta">
          <span class="message-time">${timestamp}</span>
          ${isAI ? '<span class="message-role">AI Coach</span>' : ''}
        </div>
      </div>
    `;
  }

  formatMessage(content) {
    if (typeof content !== 'string') return content;
    
    // Convert markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  async sendMessage(content = null) {
    const input = this.elements.coachInput;
    const messageContent = content || (input ? input.value.trim() : '');
    
    if (!messageContent && !content) return;

    // Add user message
    this.addMessage('user', messageContent);
    
    // Clear input
    if (input) {
      input.value = '';
      input.focus();
    }

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get coaching advice
      const response = await this.api.getCoachingAdvice(messageContent, {
        trades: this.state.getState().trades.slice(0, 10),
        recentPerformance: this.state.getState().stats.totalProfit >= 0 ? 'positive' : 'negative'
      });

      // Remove typing indicator
      this.removeTypingIndicator();

      if (response.success) {
        // Add AI response
        this.addMessage('ai', response.advice, 'coaching');
        
        // Update session metadata
        await this.api.addSessionMessage('assistant', response.advice, 'coaching');
      } else {
        throw new Error(response.error || 'Failed to get coaching');
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('ai', 'I apologize, but I encountered an error. Please try again or use the Analyze button for specific trade analysis.', 'error');
      console.error('Coaching error:', error);
    }
  }

  async analyzeSpecificTrade(tradeId) {
    const trade = this.state.getState().trades.find(t => t.id === tradeId);
    if (!trade) return;

    // Add user message
    this.addMessage('user', `Analyze this trade: ${trade.symbol} ${trade.type} at $${trade.entryPrice}`);

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const response = await this.api.analyzeTrade(tradeId, {
        marketCondition: 'Current market conditions unknown'
      });

      this.removeTypingIndicator();

      if (response.success) {
        const analysis = response.analysis;
        const analysisText = this.formatTradeAnalysis(analysis, trade);
        
        this.addMessage('ai', analysisText, 'analysis');
        await this.api.addSessionMessage('assistant', analysisText, 'analysis');
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('ai', 'Failed to analyze trade. Please try again.', 'error');
      console.error('Trade analysis error:', error);
    }
  }

  async analyzeCurrentTrades() {
    const { trades, stats } = this.state.getState();
    
    if (trades.length === 0) {
      this.addMessage('ai', "I don't see any trades to analyze. Add some trades first!", 'info');
      return;
    }

    this.addMessage('user', 'Analyze my recent trading performance');
    this.showTypingIndicator();

    try {
      // Get bias analysis
      const biasResponse = await this.api.detectBiases();
      const biases = biasResponse.success ? biasResponse.detectedBiases : [];
      
      // Generate performance analysis
      const analysis = this.generatePerformanceAnalysis(stats, trades, biases);
      
      this.removeTypingIndicator();
      this.addMessage('ai', analysis, 'analysis');
      
      await this.api.addSessionMessage('assistant', analysis, 'analysis');
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('ai', 'Failed to analyze performance. Please try again.', 'error');
      console.error('Performance analysis error:', error);
    }
  }

  formatTradeAnalysis(analysis, trade) {
    const isWin = trade.profit > 0;
    const profitPercent = ((trade.profit / (trade.entryPrice * trade.positionSize)) * 100).toFixed(2);
    
    return `
🎯 **Trade Analysis: ${trade.symbol} ${trade.type.toUpperCase()}**
${isWin ? '✅ WIN' : '❌ LOSS'} | P&L: ${isWin ? '+' : ''}$${trade.profit.toFixed(2)} (${isWin ? '+' : ''}${profitPercent}%)

📊 **Confidence Score:** ${analysis.confidenceScore || 75}%

**Strengths:**
${analysis.successFactors?.map(f => `• ${f}`).join('\n') || '• No specific strengths identified'}

**Areas for Improvement:**
${analysis.mistakes?.map(m => `• ${m}`).join('\n') || '• No major mistakes detected'}

**Behavioral Insight:**
${analysis.behavioralInsights || 'No behavioral patterns detected'}

**Risk Assessment:** ${analysis.riskAssessment?.toUpperCase() || 'MEDIUM'}

**Recommendations:**
${analysis.improvementSuggestions?.map(s => `• ${s}`).join('\n') || '• Continue current strategy'}

*Analysis based on trade data and market conditions.*
    `.trim();
  }

  generatePerformanceAnalysis(stats, trades, biases) {
    const recentTrades = trades.slice(0, 10);
    const winRate = stats.winRate;
    const profitFactor = stats.profitFactor;
    
    let analysis = `📈 **Performance Analysis Report**\n\n`;
    
    // Overall assessment
    if (winRate >= 70 && profitFactor >= 2) {
      analysis += `**Overall: EXCELLENT** 🎉\nYou're performing exceptionally well!\n\n`;
    } else if (winRate >= 55 && profitFactor >= 1.5) {
      analysis += `**Overall: GOOD** 👍\nSolid performance with room for optimization.\n\n`;
    } else if (winRate >= 40 && profitFactor >= 1) {
      analysis += `**Overall: FAIR** ⚠️\nPerformance needs improvement.\n\n`;
    } else {
      analysis += `**Overall: POOR** 🔴\nSignificant improvement needed.\n\n`;
    }

    // Key metrics
    analysis += `**Key Metrics:**\n`;
    analysis += `• Win Rate: ${winRate}% ${winRate >= 50 ? '✅' : '❌'}\n`;
    analysis += `• Profit Factor: ${profitFactor.toFixed(2)} ${profitFactor >= 1.5 ? '✅' : profitFactor >= 1 ? '⚠️' : '❌'}\n`;
    analysis += `• Max Drawdown: $${stats.maxDrawdown?.toFixed(2) || '0.00'} ${stats.maxDrawdown < 500 ? '✅' : stats.maxDrawdown < 1500 ? '⚠️' : '❌'}\n`;
    analysis += `• Total Profit: $${stats.totalProfit?.toFixed(2) || '0.00'} ${stats.totalProfit >= 0 ? '✅' : '❌'}\n\n`;

    // Bias analysis
    if (biases.length > 0) {
      analysis += `**⚠️ Behavioral Biases Detected:**\n`;
      biases.forEach(bias => {
        analysis += `• ${bias.name}: ${bias.evidence}\n`;
      });
      analysis += `\n`;
    } else {
      analysis += `**✅ No significant biases detected.** Excellent emotional control!\n\n`;
    }

    // Recommendations
    analysis += `**Recommendations:**\n`;
    
    if (winRate < 40) {
      analysis += `• Focus on improving entry timing and trade selection\n`;
      analysis += `• Consider paper trading to refine strategy\n`;
    }
    
    if (profitFactor < 1) {
      analysis += `• Work on risk:reward ratio - aim for at least 1:2\n`;
      analysis += `• Let winners run, cut losers quickly\n`;
    }
    
    if (stats.maxDrawdown > 1000) {
      analysis += `• Reduce position sizes by 25%\n`;
      analysis += `• Implement stricter stop losses\n`;
    }
    
    if (biases.length === 0) {
      analysis += `• Maintain current discipline and consistency\n`;
      analysis += `• Consider gradually increasing position size if performance remains strong\n`;
    }

    analysis += `\n*Based on analysis of ${trades.length} trades.*`;

    return analysis;
  }

  sendWelcomeMessage() {
    const { trades } = this.state.getState();
    
    if (trades.length === 0) {
      this.addMessage('ai', 
        `👋 **Welcome to AI Trading Coach!**\n\n` +
        `I'm here to help you improve your trading performance through:\n` +
        `• Trade analysis and feedback\n` +
        `• Behavioral bias detection\n` +
        `• Real-time market insights\n` +
        `• Risk management guidance\n\n` +
        `**To get started:**\n` +
        `1. Add your trades using the "+ Add Trade" button\n` +
        `2. Click "Analyze Performance" for overall feedback\n` +
        `3. Ask me specific questions about your trading\n\n` +
        `You can also try:\n` +
        `• "Analyze my recent trades"\n` +
        `• "What's the market outlook for BTC?"\n` +
        `• "Help me improve my risk management"`,
        'welcome'
      );
    } else if (trades.length < 5) {
      this.addMessage('ai',
        `👋 **Welcome back!**\n\n` +
        `I see you have ${trades.length} trade${trades.length === 1 ? '' : 's'} recorded.\n` +
        `Add a few more trades for more detailed analysis, or ask me anything about trading!`,
        'welcome'
      );
    }
  }

  addMessage(role, content, type = 'coaching') {
    const message = {
      id: `msg_${Date.now()}`,
      role: role === 'ai' ? 'assistant' : role,
      content,
      type,
      timestamp: new Date().toISOString()
    };

    this.state.addCoachingMessage(message.role, message.content, message.type);
  }

  showTypingIndicator() {
    if (this.isTyping) return;
    
    this.isTyping = true;
    this.addMessage('ai', 'Typing...', 'typing');
    
    // Update status indicator
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.textContent = 'AI is typing...';
      this.elements.statusIndicator.classList.add('typing');
    }
  }

  removeTypingIndicator() {
    this.isTyping = false;
    
    // Remove typing message
    const { coachingHistory } = this.state.getState();
    const typingMessage = coachingHistory.find(m => m.type === 'typing');
    
    if (typingMessage) {
      const newHistory = coachingHistory.filter(m => m.id !== typingMessage.id);
      this.state.setState({ coachingHistory: newHistory });
    }
    
    // Update status indicator
    if (this.elements.statusIndicator) {
      this.elements.statusIndicator.textContent = 'AI Coach Active';
      this.elements.statusIndicator.classList.remove('typing');
    }
  }

  handleQuickAction(action) {
    const actions = {
      'analyze-performance': () => this.analyzeCurrentTrades(),
      'market-outlook': () => this.getMarketOutlook(),
      'risk-assessment': () => this.getRiskAssessment(),
      'bias-check': () => this.checkBiases(),
      'strategy-review': () => this.reviewStrategy()
    };

    if (actions[action]) {
      actions[action]();
    }
  }

  async getMarketOutlook() {
    this.addMessage('user', 'What is the current market outlook?');
    this.showTypingIndicator();

    try {
      const response = await this.api.getMarketAnalysis();
      this.removeTypingIndicator();
      
      if (response.success) {
        this.addMessage('ai', 
          `📊 **Market Outlook Analysis**\n\n` +
          `${response.analysis}\n\n` +
          `**Key Levels:**\n` +
          `• BTC/USD: Support $${response.marketData.btcusd.support.toFixed(0)}, Resistance $${response.marketData.btcusd.resistance.toFixed(0)}\n` +
          `• ETH/USD: Support $${response.marketData.ethusd.support.toFixed(0)}, Resistance $${response.marketData.ethusd.resistance.toFixed(0)}\n\n` +
          `*Analysis is for educational purposes only. Always do your own research.*`,
          'market'
        );
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('ai', 'Unable to fetch market data. Please check your connection.', 'error');
    }
  }

  async getRiskAssessment() {
    const { stats, trades } = this.state.getState();
    
    let assessment = `⚠️ **Risk Assessment**\n\n`;
    
    if (trades.length < 5) {
      assessment += `**Insufficient Data:** Need at least 5 trades for accurate risk assessment.\n`;
    } else {
      const riskScore = this.calculateRiskScore(stats, trades);
      
      assessment += `**Overall Risk Score:** ${riskScore}/100\n`;
      
      if (riskScore >= 70) {
        assessment += `**Level: HIGH RISK** 🔴\n`;
        assessment += `Immediate action required:\n`;
        assessment += `• Reduce position sizes by 50%\n`;
        assessment += `• Implement strict daily loss limits\n`;
        assessment += `• Consider taking a trading break\n`;
      } else if (riskScore >= 40) {
        assessment += `**Level: MODERATE RISK** 🟡\n`;
        assessment += `Areas for improvement:\n`;
        assessment += `• Review risk:reward ratios\n`;
        assessment += `• Tighten stop losses\n`;
        assessment += `• Reduce position sizes by 25%\n`;
      } else {
        assessment += `**Level: LOW RISK** 🟢\n`;
        assessment += `Good risk management:\n`;
        assessment += `• Maintain current discipline\n`;
        assessment += `• Continue consistent position sizing\n`;
        assessment += `• Regular performance reviews\n`;
      }
      
      // Specific risk factors
      assessment += `\n**Key Risk Factors:**\n`;
      if (stats.maxDrawdown > 1000) assessment += `• High maximum drawdown ($${stats.maxDrawdown.toFixed(2)})\n`;
      if (stats.winRate < 40) assessment += `• Low win rate (${stats.winRate}%)\n`;
      if (stats.profitFactor < 1) assessment += `• Profit factor below 1 (${stats.profitFactor.toFixed(2)})\n`;
      
      const losingStreak = this.getCurrentLosingStreak(trades);
      if (losingStreak >= 3) assessment += `• ${losingStreak} consecutive losses\n`;
    }
    
    this.addMessage('ai', assessment, 'risk');
  }

  async checkBiases() {
    this.addMessage('user', 'Check for psychological biases in my trading');
    this.showTypingIndicator();

    try {
      const response = await this.api.detectBiases();
      this.removeTypingIndicator();
      
      if (response.success && response.detectedBiases?.length > 0) {
        let biasMessage = `🧠 **Psychological Bias Analysis**\n\n`;
        
        response.detectedBiases.forEach(bias => {
          biasMessage += `**${bias.type}** (${bias.confidence}% confidence)\n`;
          biasMessage += `${bias.evidence}\n`;
          biasMessage += `**Recommendation:** ${bias.recommendation}\n\n`;
        });
        
        biasMessage += `**Overall Risk Score:** ${response.overallRiskScore}/100\n`;
        
        this.addMessage('ai', biasMessage, 'bias');
      } else {
        this.addMessage('ai', 
          `✅ **No significant biases detected!**\n\n` +
          `Your trading shows good emotional discipline. Keep maintaining:\n` +
          `• Consistent position sizing\n` +
          `• Adherence to trading plan\n` +
          `• Proper risk management\n`,
          'bias'
        );
      }
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('ai', 'Unable to analyze biases. Please try again.', 'error');
    }
  }

  async reviewStrategy() {
    const { trades, stats } = this.state.getState();
    
    if (trades.length < 10) {
      this.addMessage('ai', 
        `📋 **Strategy Review**\n\n` +
        `Need at least 10 trades for meaningful strategy analysis.\n` +
        `Currently have ${trades.length} trades recorded.`,
        'strategy'
      );
      return;
    }
    
    let review = `📋 **Trading Strategy Review**\n\n`;
    
    // Analyze trade distribution
    const symbolStats = this.analyzeSymbolDistribution(trades);
    const timeStats = this.analyzeTimeDistribution(trades);
    
    review += `**Trade Distribution:**\n`;
    review += `• Most traded symbol: ${symbolStats.mostTraded}\n`;
    review += `• Best performing: ${symbolStats.bestPerforming}\n`;
    review += `• Win rate by symbol: ${Object.entries(symbolStats.winRates)
      .map(([sym, rate]) => `${sym}: ${rate}%`)
      .join(', ')}\n\n`;
    
    review += `**Time Analysis:**\n`;
    review += `• Most active hour: ${timeStats.bestHour}:00\n`;
    review += `• Win rate by hour: ${timeStats.bestWinRate}% at ${timeStats.bestWinRateHour}:00\n\n`;
    
    review += `**Performance by Trade Type:**\n`;
    const longTrades = trades.filter(t => t.type === 'buy');
    const shortTrades = trades.filter(t => t.type === 'sell');
    
    if (longTrades.length > 0) {
      const longWinRate = (longTrades.filter(t => t.profit > 0).length / longTrades.length * 100).toFixed(1);
      review += `• Long trades: ${longTrades.length} trades, ${longWinRate}% win rate\n`;
    }
    
    if (shortTrades.length > 0) {
      const shortWinRate = (shortTrades.filter(t => t.profit > 0).length / shortTrades.length * 100).toFixed(1);
      review += `• Short trades: ${shortTrades.length} trades, ${shortWinRate}% win rate\n`;
    }
    
    review += `\n**Strategy Recommendations:**\n`;
    
    if (symbolStats.mostTraded !== symbolStats.bestPerforming) {
      review += `• Consider focusing on ${symbolStats.bestPerforming} (better performance)\n`;
    }
    
    if (timeStats.bestWinRate > stats.winRate + 10) {
      review += `• Trade more during ${timeStats.bestWinRateHour}:00 (higher win rate)\n`;
    }
    
    if (longTrades.length > shortTrades.length * 3) {
      review += `• Consider more short trades for diversification\n`;
    } else if (shortTrades.length > longTrades.length * 3) {
      review += `• Consider more long trades for diversification\n`;
    }
    
    review += `• Review losing trades for common patterns\n`;
    review += `• Document successful trade setups\n`;
    
    this.addMessage('ai', review, 'strategy');
  }

  calculateRiskScore(stats, trades) {
    let score = 0;
    
    // Win rate factor (lower is riskier)
    if (stats.winRate < 30) score += 40;
    else if (stats.winRate < 40) score += 30;
    else if (stats.winRate < 50) score += 20;
    else if (stats.winRate < 60) score += 10;
    
    // Profit factor factor
    if (stats.profitFactor < 0.8) score += 30;
    else if (stats.profitFactor < 1) score += 20;
    else if (stats.profitFactor < 1.2) score += 15;
    else if (stats.profitFactor < 1.5) score += 5;
    
    // Drawdown factor
    if (stats.maxDrawdown > 2000) score += 30;
    else if (stats.maxDrawdown > 1000) score += 20;
    else if (stats.maxDrawdown > 500) score += 10;
    
    // Losing streak factor
    const losingStreak = this.getCurrentLosingStreak(trades);
    if (losingStreak >= 5) score += 20;
    else if (losingStreak >= 3) score += 10;
    
    return Math.min(100, score);
  }

  getCurrentLosingStreak(trades) {
    let streak = 0;
    for (const trade of trades) {
      if (trade.profit < 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  analyzeSymbolDistribution(trades) {
    const symbolMap = {};
    
    trades.forEach(trade => {
      if (!symbolMap[trade.symbol]) {
        symbolMap[trade.symbol] = {
          trades: 0,
          wins: 0,
          profit: 0
        };
      }
      
      symbolMap[trade.symbol].trades++;
      symbolMap[trade.symbol].profit += trade.profit;
      
      if (trade.profit > 0) {
        symbolMap[trade.symbol].wins++;
      }
    });
    
    let mostTraded = '';
    let maxTrades = 0;
    let bestPerforming = '';
    let maxProfit = -Infinity;
    const winRates = {};
    
    Object.entries(symbolMap).forEach(([symbol, data]) => {
      if (data.trades > maxTrades) {
        mostTraded = symbol;
        maxTrades = data.trades;
      }
      
      if (data.profit > maxProfit) {
        bestPerforming = symbol;
        maxProfit = data.profit;
      }
      
      winRates[symbol] = (data.wins / data.trades * 100).toFixed(1);
    });
    
    return {
      mostTraded,
      bestPerforming,
      winRates
    };
  }

  analyzeTimeDistribution(trades) {
    const hourMap = Array(24).fill(0).map(() => ({ trades: 0, wins: 0 }));
    
    trades.forEach(trade => {
      const hour = new Date(trade.timestamp).getHours();
      hourMap[hour].trades++;
      
      if (trade.profit > 0) {
        hourMap[hour].wins++;
      }
    });
    
    let bestHour = 0;
    let maxTrades = 0;
    let bestWinRateHour = 0;
    let bestWinRate = 0;
    
    hourMap.forEach((data, hour) => {
      if (data.trades > maxTrades) {
        bestHour = hour;
        maxTrades = data.trades;
      }
      
      if (data.trades > 0) {
        const winRate = (data.wins / data.trades * 100);
        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          bestWinRateHour = hour;
        }
      }
    });
    
    return {
      bestHour,
      bestWinRate,
      bestWinRateHour: bestWinRateHour
    };
  }

  handleSelectedTrade(trade) {
    if (!trade) return;
    
    const quickAnalysis = this.biasEngine.detectRealTimeBias(
      trade,
      this.state.getState().trades.slice(1, 5),
      {}
    );
    
    if (quickAnalysis.length > 0) {
      let warning = `⚠️ **Potential Bias Detected in Selected Trade**\n\n`;
      
      quickAnalysis.forEach(bias => {
        warning += `**${bias.type}** (${bias.confidence}% confidence)\n`;
        warning += `${bias.evidence}\n`;
        warning += `**Suggestion:** ${bias.recommendation}\n\n`;
      });
      
      this.addMessage('ai', warning, 'warning');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.CoachUI = new CoachUI();
});
