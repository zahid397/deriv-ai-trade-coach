const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const tradeAnalyzer = require('../services/tradeAnalyzer');

const DATA_PATH = path.join(__dirname, '../../data/sampleTrades.json');

// Get all trades
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    
    // Filter by date if provided
    let filtered = trades;
    if (req.query.startDate) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(req.query.startDate));
    }
    if (req.query.endDate) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(req.query.endDate));
    }
    if (req.query.symbol) {
      filtered = filtered.filter(t => t.symbol === req.query.symbol);
    }
    
    res.json({
      success: true,
      count: filtered.length,
      trades: filtered
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load trades',
      message: error.message
    });
  }
});

// Get single trade
router.get('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    const trade = trades.find(t => t.id === req.params.id);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    res.json({
      success: true,
      trade
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load trade',
      message: error.message
    });
  }
});

// Add new trade
router.post('/', async (req, res) => {
  try {
    const { symbol, type, entryPrice, exitPrice, positionSize, duration, notes } = req.body;
    
    if (!symbol || !type || !entryPrice || !exitPrice || !positionSize) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const profit = type === 'buy' ? 
      (exitPrice - entryPrice) * positionSize :
      (entryPrice - exitPrice) * positionSize;
    
    const newTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      type,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      positionSize: parseFloat(positionSize),
      profit: parseFloat(profit.toFixed(2)),
      duration: parseInt(duration) || 0,
      timestamp: new Date().toISOString(),
      notes: notes || '',
      status: profit > 0 ? 'win' : 'loss'
    };
    
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    trades.unshift(newTrade);
    
    await fs.writeFile(DATA_PATH, JSON.stringify(trades, null, 2));
    
    res.status(201).json({
      success: true,
      trade: newTrade,
      message: 'Trade added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add trade',
      message: error.message
    });
  }
});

// Update trade
router.put('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    const index = trades.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    const updatedTrade = { ...trades[index], ...req.body };
    
    // Recalculate profit if prices changed
    if (req.body.entryPrice || req.body.exitPrice || req.body.positionSize) {
      const entry = req.body.entryPrice || trades[index].entryPrice;
      const exit = req.body.exitPrice || trades[index].exitPrice;
      const size = req.body.positionSize || trades[index].positionSize;
      
      updatedTrade.profit = updatedTrade.type === 'buy' ? 
        (exit - entry) * size :
        (entry - exit) * size;
    }
    
    trades[index] = updatedTrade;
    await fs.writeFile(DATA_PATH, JSON.stringify(trades, null, 2));
    
    res.json({
      success: true,
      trade: updatedTrade,
      message: 'Trade updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update trade',
      message: error.message
    });
  }
});

// Delete trade
router.delete('/:id', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    const filtered = trades.filter(t => t.id !== req.params.id);
    
    if (filtered.length === trades.length) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2));
    
    res.json({
      success: true,
      message: 'Trade deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete trade',
      message: error.message
    });
  }
});

// Get trade statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    const trades = JSON.parse(data);
    
    const stats = tradeAnalyzer.computeStats(trades);
    const patterns = tradeAnalyzer.detectPatterns(trades);
    const categorized = tradeAnalyzer.categorizeTrades(trades);
    const heatmap = tradeAnalyzer.generateHeatmapData(trades);
    
    res.json({
      success: true,
      stats,
      patterns,
      categories: {
        wins: categorized.filter(t => t.category.isWin).length,
        losses: categorized.filter(t => !t.category.isWin).length,
        bigWins: categorized.filter(t => t.category.isBigWin).length,
        bigLosses: categorized.filter(t => t.category.isBigLoss).length
      },
      heatmap,
      recentTrades: trades.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate statistics',
      message: error.message
    });
  }
});

module.exports = router;
