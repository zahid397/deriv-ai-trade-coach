const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const tradeAnalyzer = require('../services/tradeAnalyzer');

const DATA_PATH = path.join(__dirname, '../../data/sampleTrades.json');

// Get complete history with stats, biases, and patterns
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    
    // Calculate various metrics
    const stats = tradeAnalyzer.computeStats(trades);
    const patterns = tradeAnalyzer.detectPatterns(trades);
    const categorized = tradeAnalyzer.categorizeTrades(trades);
    const heatmap = tradeAnalyzer.generateHeatmapData(trades);
    
    // Group by time periods
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const weeklyTrades = trades.filter(t => new Date(t.timestamp) >= oneWeekAgo);
    const monthlyTrades = trades.filter(t => new Date(t.timestamp) >= oneMonthAgo);
    
    const weeklyStats = tradeAnalyzer.computeStats(weeklyTrades);
    const monthlyStats = tradeAnalyzer.computeStats(monthlyTrades);
    
    // Calculate performance by symbol
    const symbolPerformance = {};
    trades.forEach(trade => {
      if (!symbolPerformance[trade.symbol]) {
        symbolPerformance[trade.symbol] = {
          trades: 0,
          wins: 0,
          profit: 0,
          totalPositionSize: 0
        };
      }
      
      symbolPerformance[trade.symbol].trades++;
      symbolPerformance[trade.symbol].profit += trade.profit;
      symbolPerformance[trade.symbol].totalPositionSize += trade.positionSize || 1;
      
      if (trade.profit > 0) {
        symbolPerformance[trade.symbol].wins++;
      }
    });
    
    // Convert to array and add win rates
    const symbolArray = Object.entries(symbolPerformance).map(([symbol, data]) => ({
      symbol,
      trades: data.trades,
      winRate: (data.wins / data.trades * 100).toFixed(1),
      totalProfit: data.profit,
      avgProfitPerTrade: data.profit / data.trades,
      profitPerSize: data.profit / data.totalPositionSize
    })).sort((a, b) => b.totalProfit - a.totalProfit);
    
    // Calculate daily P&L for chart
    const dailyPnL = {};
    trades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      if (!dailyPnL[date]) {
        dailyPnL[date] = 0;
      }
      dailyPnL[date] += trade.profit;
    });
    
    const dailyChartData = Object.entries(dailyPnL)
      .map(([date, profit]) => ({ date, profit }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
    
    // Cumulative P&L
    let cumulative = 0;
    const cumulativeData = dailyChartData.map(day => {
      cumulative += day.profit;
      return {
        date: day.date,
        profit: day.profit,
        cumulative: cumulative
      };
    });
    
    // Detect behavioral patterns
    const behavioralPatterns = [];
    
    // Check for loss aversion (holding losers longer than winners)
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    if (losingTrades.length > 5) {
      const avgWinDuration = winningTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / winningTrades.length;
      const avgLossDuration = losingTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / losingTrades.length;
      
      if (avgLossDuration > avgWinDuration * 1.5) {
        behavioralPatterns.push({
          type: 'lossAversion',
          severity: 'medium',
          description: 'Holding losing trades longer than winning trades',
          evidence: `Average loss duration: ${Math.round(avgLossDuration)}min vs win duration: ${Math.round(avgWinDuration)}min`,
          recommendation: 'Set stricter stop losses for losing positions'
        });
      }
    }
    
    // Check for revenge trading (increased position size after losses)
    for (let i = 1; i < Math.min(10, trades.length); i++) {
      if (trades[i-1].profit < 0 && trades[i].positionSize > trades[i-1].positionSize * 1.8) {
        behavioralPatterns.push({
          type: 'revengeTrading',
          severity: 'high',
          description: 'Increased position size significantly after a loss',
          evidence: `Position size increased from ${trades[i-1].positionSize} to ${trades[i].positionSize} after loss`,
          recommendation: 'Maintain consistent position sizing regardless of previous outcome'
        });
        break;
      }
    }
    
    // Check for overconfidence (increased risk after winning streak)
    const recentWins = trades.slice(0, 3).filter(t => t.profit > 0).length;
    if (recentWins === 3 && trades.length > 3) {
      const avgPositionBefore = trades.slice(3, 6).reduce((sum, t) => sum + t.positionSize, 0) / 3;
      const avgPositionAfter = trades.slice(0, 3).reduce((sum, t) => sum + t.positionSize, 0) / 3;
      
      if (avgPositionAfter > avgPositionBefore * 1.3) {
        behavioralPatterns.push({
          type: 'overconfidence',
          severity: 'medium',
          description: 'Increased position sizes after winning streak',
          evidence: `Average position size increased by ${((avgPositionAfter/avgPositionBefore - 1) * 100).toFixed(0)}% after 3 wins`,
          recommendation: 'Stick to predetermined position sizing rules'
        });
      }
    }
    
    res.json({
      success: true,
      summary: {
        totalTrades: trades.length,
        totalProfit: stats.totalProfit,
        winRate: stats.winRate,
        profitFactor: stats.profitFactor,
        sharpeRatio: stats.sharpeRatio,
        maxDrawdown: stats.maxDrawdown
      },
      periodComparison: {
        weekly: weeklyStats,
        monthly: monthlyStats,
        allTime: stats
      },
      symbolPerformance: symbolArray,
      patterns: {
        technical: patterns,
        behavioral: behavioralPatterns
      },
      chartData: {
        daily: dailyChartData,
        cumulative: cumulativeData
      },
      heatmap,
      recentTrades: trades.slice(0, 15),
      categories: {
        byOutcome: {
          wins: winningTrades.length,
          losses: losingTrades.length,
          breakEven: trades.length - winningTrades.length - losingTrades.length
        },
        byDuration: {
          scalps: categorized.filter(t => t.category.isScalp).length,
          swings: categorized.filter(t => t.category.isSwing).length,
          longTerm: categorized.filter(t => t.category.isLongTerm).length
        }
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load history',
      message: error.message
    });
  }
});

module.exports = router;
