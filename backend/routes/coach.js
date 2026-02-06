const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/sampleTrades.json');

// Analyze specific trade
router.post('/analyze/:tradeId', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    const trade = trades.find(t => t.id === req.params.tradeId);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    const context = {
      marketCondition: req.body.marketCondition || 'No context provided',
      totalTrades: trades.length,
      recentWinRate: (trades.slice(0, 10).filter(t => t.profit > 0).length / 10 * 100).toFixed(1),
      recentPerformance: trades.slice(0, 5).reduce((sum, t) => sum + t.profit, 0) > 0 ? 'Positive' : 'Negative'
    };
    
    const analysis = await groqService.analyzeTrade({ trade, context });
    
    res.json({
      success: true,
      analysis,
      trade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trade',
      message: error.message,
      mock: groqService.isMockMode
    });
  }
});

// Get coaching advice
router.post('/advice', async (req, res) => {
  try {
    const { marketContext, traderProfile } = req.body;
    
    if (!marketContext) {
      return res.status(400).json({
        success: false,
        error: 'Market context required'
      });
    }
    
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    
    const advice = await groqService.getCoachingAdvice(
      marketContext, 
      {
        trades: trades.slice(0, 10),
        profile: traderProfile || {}
      }
    );
    
    res.json({
      success: true,
      advice,
      timestamp: new Date().toISOString(),
      source: groqService.isMockMode ? 'mock' : 'ai'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get coaching advice',
      message: error.message,
      mock: groqService.isMockMode
    });
  }
});

// Detect biases
router.get('/biases', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    
    const biases = await groqService.detectBiases(trades);
    
    res.json({
      success: true,
      ...biases,
      analyzedTrades: trades.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to detect biases',
      message: error.message,
      mock: groqService.isMockMode
    });
  }
});

// Quick market analysis
router.post('/market-analysis', async (req, res) => {
  try {
    const { symbols, timeframe, indicators } = req.body;
    
    // Mock market data based on your design
    const mockMarketData = {
      btcusd: {
        price: 95900 + (Math.random() * 2000 - 1000),
        change24h: (Math.random() * 6 - 3).toFixed(2),
        rsi: 55 + (Math.random() * 10 - 5),
        volume: (1000000 + Math.random() * 500000).toFixed(0),
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
        support: 94500,
        resistance: 96500
      },
      ethusd: {
        price: 3200 + (Math.random() * 200 - 100),
        change24h: (Math.random() * 5 - 2.5).toFixed(2),
        rsi: 52 + (Math.random() * 8 - 4),
        volume: (500000 + Math.random() * 250000).toFixed(0),
        sentiment: Math.random() > 0.4 ? 'bullish' : 'bearish',
        support: 3100,
        resistance: 3300
      }
    };
    
    const analysis = await groqService.getCoachingAdvice(
      `Market analysis for ${symbols || 'BTCUSD, ETHUSD'} on ${timeframe || '1H'} timeframe. Indicators: ${indicators || 'RSI, MACD, Volume'}`,
      {}
    );
    
    res.json({
      success: true,
      analysis,
      marketData: mockMarketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze market',
      message: error.message
    });
  }
});

module.exports = router;
