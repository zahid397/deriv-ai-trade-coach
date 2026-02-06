const tradeAnalyzer = {
  computeStats(trades) {
    if (!trades || trades.length === 0) {
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

    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit <= 0);
    
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    const winRate = (winningTrades.length / trades.length) * 100;
    const profitFactor = totalLosses === 0 ? 99 : totalWins / totalLosses;
    
    let runningBalance = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    const balances = trades.map(t => {
      runningBalance += t.profit;
      if (runningBalance > peak) peak = runningBalance;
      const drawdown = peak - runningBalance;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      return runningBalance;
    });

    const avgReturn = balances.length > 1 ? 
      (balances[balances.length - 1] - balances[0]) / (balances.length - 1) : 0;
    const stdDev = Math.sqrt(
      balances.reduce((sum, b, i, arr) => {
        if (i === 0) return 0;
        const diff = b - arr[i - 1];
        return sum + diff * diff;
      }, 0) / Math.max(1, balances.length - 1)
    );
    
    const sharpeRatio = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252);
    const expectancy = (winRate/100 * (totalWins/winningTrades.length)) - 
                      ((100-winRate)/100 * (totalLosses/losingTrades.length || 0));

    return {
      totalTrades: trades.length,
      winRate: parseFloat(winRate.toFixed(1)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      avgProfit: winningTrades.length ? parseFloat((totalWins / winningTrades.length).toFixed(2)) : 0,
      avgLoss: losingTrades.length ? parseFloat((totalLosses / losingTrades.length).toFixed(2)) : 0,
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      expectancy: parseFloat(expectancy.toFixed(2)),
      bestTrade: Math.max(...trades.map(t => t.profit)),
      worstTrade: Math.min(...trades.map(t => t.profit))
    };
  },

  detectPatterns(trades) {
    if (trades.length < 3) return [];
    
    const patterns = [];
    const recent = trades.slice(-5);
    
    // Check for winning streak
    const allWins = recent.every(t => t.profit > 0);
    const allLosses = recent.every(t => t.profit <= 0);
    
    if (allWins && recent.length >= 3) {
      patterns.push({
        type: 'winningStreak',
        confidence: 85,
        description: `${recent.length} consecutive winning trades`,
        implication: 'Risk of overconfidence bias'
      });
    }
    
    if (allLosses && recent.length >= 3) {
      patterns.push({
        type: 'losingStreak',
        confidence: 90,
        description: `${recent.length} consecutive losing trades`,
        implication: 'Possible tilt/revenge trading'
      });
    }
    
    // Check for position size changes after wins/losses
    let increasingAfterLoss = 0;
    let decreasingAfterWin = 0;
    
    for (let i = 1; i < Math.min(5, trades.length); i++) {
      if (trades[i-1].profit < 0 && trades[i].positionSize > trades[i-1].positionSize * 1.5) {
        increasingAfterLoss++;
      }
      if (trades[i-1].profit > 0 && trades[i].positionSize < trades[i-1].positionSize * 0.7) {
        decreasingAfterWin++;
      }
    }
    
    if (increasingAfterLoss >= 2) {
      patterns.push({
        type: 'martingalePattern',
        confidence: 75,
        description: 'Increasing position size after losses',
        implication: 'Potential revenge trading behavior'
      });
    }
    
    if (decreasingAfterWin >= 2) {
      patterns.push({
        type: 'riskAversionAfterWin',
        confidence: 70,
        description: 'Reducing position size after wins',
        implication: 'Missing profit opportunities due to fear'
      });
    }
    
    // Check for time-based patterns
    const morningTrades = trades.filter(t => {
      const hour = new Date(t.timestamp).getHours();
      return hour >= 9 && hour <= 11;
    }).length;
    
    const morningWinRate = morningTrades / Math.min(10, trades.length);
    if (morningWinRate > 0.7 && trades.length > 10) {
      patterns.push({
        type: 'morningSpecialist',
        confidence: 80,
        description: 'Higher performance in morning hours (9-11 AM)',
        implication: 'Consider focusing on morning sessions'
      });
    }
    
    return patterns;
  },

  categorizeTrades(trades) {
    return trades.map(trade => {
      const category = {
        isWin: trade.profit > 0,
        isBigWin: trade.profit > trade.positionSize * 0.02,
        isBigLoss: trade.profit < -trade.positionSize * 0.015,
        isScalp: trade.duration < 60, // minutes
        isSwing: trade.duration >= 60 && trade.duration < 1440,
        isLongTerm: trade.duration >= 1440
      };
      
      return {
        ...trade,
        category
      };
    });
  },

  generateHeatmapData(trades) {
    const hourMap = Array(24).fill(0);
    const dayMap = Array(7).fill(0);
    const symbolMap = {};
    
    trades.forEach(trade => {
      const date = new Date(trade.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourMap[hour] = (hourMap[hour] || 0) + trade.profit;
      dayMap[day] = (dayMap[day] || 0) + trade.profit;
      
      if (!symbolMap[trade.symbol]) {
        symbolMap[trade.symbol] = { profit: 0, trades: 0 };
      }
      symbolMap[trade.symbol].profit += trade.profit;
      symbolMap[trade.symbol].trades++;
    });
    
    return {
      hourly: hourMap.map((profit, hour) => ({ hour, profit })),
      daily: dayMap.map((profit, day) => ({ day, profit })),
      symbols: Object.entries(symbolMap).map(([symbol, data]) => ({
        symbol,
        profit: data.profit,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100
      })).sort((a, b) => b.profit - a.profit)
    };
  }
};

module.exports = tradeAnalyzer;
