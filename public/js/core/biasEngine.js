class BiasEngine {
  constructor() {
    this.biases = {
      lossAversion: {
        name: 'Loss Aversion',
        description: 'Tendency to prefer avoiding losses rather than acquiring equivalent gains',
        symptoms: [
          'Holding losing positions too long',
          'Taking profits too early',
          'Reluctance to enter trades after a loss'
        ],
        detectionRules: [
          {
            name: 'duration_disparity',
            threshold: 1.5,
            check: (winDuration, lossDuration) => lossDuration > winDuration * 1.5
          },
          {
            name: 'profit_target_disparity',
            threshold: 2.0,
            check: (avgWinPercent, avgLossPercent) => Math.abs(avgLossPercent) > avgWinPercent * 2.0
          }
        ]
      },
      
      overconfidence: {
        name: 'Overconfidence',
        description: 'Overestimation of one\'s own trading abilities and underestimation of risk',
        symptoms: [
          'Increasing position sizes after wins',
          'Reduced use of stop losses',
          'Trading too frequently'
        ],
        detectionRules: [
          {
            name: 'position_size_increase',
            threshold: 1.3,
            check: (currentSize, previousSizes) => {
              const avgPrevious = previousSizes.reduce((a, b) => a + b, 0) / previousSizes.length;
              return currentSize > avgPrevious * 1.3;
            }
          },
          {
            name: 'win_streak_risk',
            threshold: 3,
            check: (winStreak) => winStreak >= 3
          }
        ]
      },
      
      revengeTrading: {
        name: 'Revenge Trading',
        description: 'Making impulsive trades to recover losses quickly',
        symptoms: [
          'Trading immediately after a loss',
          'Increasing position size after losses',
          'Ignoring trading plan'
        ],
        detectionRules: [
          {
            name: 'post_loss_timing',
            threshold: 300, // 5 minutes in seconds
            check: (timeSinceLastLoss) => timeSinceLastLoss < 300
          },
          {
            name: 'size_increase_after_loss',
            threshold: 1.5,
            check: (currentSize, previousLossSize) => currentSize > previousLossSize * 1.5
          }
        ]
      },
      
      confirmationBias: {
        name: 'Confirmation Bias',
        description: 'Seeking information that confirms existing beliefs while ignoring contradictory evidence',
        symptoms: [
          'Only looking at bullish signals for long positions',
          'Ignoring warning indicators',
          'Selective chart analysis'
        ],
        detectionRules: [
          {
            name: 'one_sided_analysis',
            threshold: 0.8,
            check: (confirmingEntries, totalEntries) => confirmingEntries / totalEntries > 0.8
          }
        ]
      },
      
      anchoring: {
        name: 'Anchoring',
        description: 'Reliance too heavily on the first piece of information encountered (anchor)',
        symptoms: [
          'Fixing on entry price',
          'Holding for "breakeven"',
          'Ignoring new price action'
        ],
        detectionRules: [
          {
            name: 'price_anchor_deviation',
            threshold: 0.02, // 2%
            check: (currentPrice, anchorPrice) => Math.abs(currentPrice - anchorPrice) / anchorPrice < 0.02
          }
        ]
      }
    };
  }

  analyzeTrades(trades, marketContext = {}) {
    if (!trades || trades.length < 5) {
      return {
        biases: [],
        riskScore: 0,
        confidence: 0,
        recommendations: ['Need more trade data for analysis']
      };
    }

    const recentTrades = trades.slice(0, 20); // Analyze most recent 20 trades
    const detectedBiases = [];
    let totalRiskScore = 0;

    // Check for each bias type
    for (const [biasKey, biasConfig] of Object.entries(this.biases)) {
      const biasResult = this.checkBias(biasKey, recentTrades, marketContext);
      if (biasResult.detected) {
        detectedBiases.push({
          type: biasKey,
          name: biasConfig.name,
          confidence: biasResult.confidence,
          evidence: biasResult.evidence,
          riskScore: biasResult.riskScore,
          recommendation: this.getRecommendation(biasKey, biasResult.severity)
        });
        totalRiskScore += biasResult.riskScore;
      }
    }

    // Calculate overall risk score (0-100)
    const maxPossibleScore = detectedBiases.length * 25;
    const overallRiskScore = maxPossibleScore > 0 ? 
      Math.min(100, Math.round((totalRiskScore / maxPossibleScore) * 100)) : 0;

    return {
      biases: detectedBiases,
      riskScore: overallRiskScore,
      confidence: this.calculateConfidence(recentTrades.length),
      recommendations: this.generateOverallRecommendations(detectedBiases, overallRiskScore),
      analyzedTrades: recentTrades.length
    };
  }

  checkBias(biasKey, trades, marketContext) {
    switch (biasKey) {
      case 'lossAversion':
        return this.checkLossAversion(trades);
      case 'overconfidence':
        return this.checkOverconfidence(trades);
      case 'revengeTrading':
        return this.checkRevengeTrading(trades);
      case 'confirmationBias':
        return this.checkConfirmationBias(trades, marketContext);
      case 'anchoring':
        return this.checkAnchoring(trades);
      default:
        return { detected: false, confidence: 0, riskScore: 0 };
    }
  }

  checkLossAversion(trades) {
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    if (winningTrades.length < 3 || losingTrades.length < 3) {
      return { detected: false, confidence: 0, riskScore: 0 };
    }

    // Calculate average duration
    const avgWinDuration = winningTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / winningTrades.length;
    const avgLossDuration = losingTrades.reduce((sum, t) => sum + (t.duration || 0), 0) / losingTrades.length;

    // Calculate average profit/loss percentage
    const avgWinPercent = winningTrades.reduce((sum, t) => {
      const profitPercent = (t.profit / (t.entryPrice * t.positionSize)) * 100;
      return sum + profitPercent;
    }, 0) / winningTrades.length;

    const avgLossPercent = losingTrades.reduce((sum, t) => {
      const lossPercent = (t.profit / (t.entryPrice * t.positionSize)) * 100;
      return sum + lossPercent;
    }, 0) / losingTrades.length;

    let detected = false;
    let evidence = [];
    let confidence = 0;
    let severity = 'low';

    // Check duration disparity
    if (avgLossDuration > avgWinDuration * 1.5) {
      detected = true;
      evidence.push(`Holding losses ${(avgLossDuration / avgWinDuration).toFixed(1)}x longer than wins`);
      confidence += 30;
      severity = avgLossDuration > avgWinDuration * 2 ? 'high' : 'medium';
    }

    // Check profit target disparity
    if (Math.abs(avgLossPercent) > avgWinPercent * 2) {
      detected = true;
      evidence.push(`Average loss (${Math.abs(avgLossPercent).toFixed(1)}%) more than double average win (${avgWinPercent.toFixed(1)}%)`);
      confidence += 40;
      severity = 'high';
    }

    // Check for breakeven syndrome
    const breakevenTrades = losingTrades.filter(t => {
      const maxLoss = Math.abs(t.profit / (t.entryPrice * t.positionSize)) * 100;
      return maxLoss > 5 && Math.abs(t.profit) < t.positionSize * 0.001; // Held until nearly breakeven
    }).length;

    if (breakevenTrades > losingTrades.length * 0.5) {
      detected = true;
      evidence.push(`${breakevenTrades} losing trades held until nearly breakeven`);
      confidence += 20;
      severity = 'medium';
    }

    return {
      detected,
      confidence: Math.min(100, confidence),
      riskScore: this.calculateRiskScore(severity),
      evidence: evidence.join('; '),
      severity
    };
  }

  checkOverconfidence(trades) {
    if (trades.length < 5) {
      return { detected: false, confidence: 0, riskScore: 0 };
    }

    // Check for winning streak
    const recentWinStreak = this.getCurrentWinStreak(trades);
    const hasWinStreak = recentWinStreak >= 3;

    // Check position size changes after wins
    let sizeIncreaseDetected = false;
    let sizeIncreaseEvidence = '';
    
    for (let i = 1; i < Math.min(5, trades.length); i++) {
      if (trades[i-1].profit > 0 && trades[i].positionSize > trades[i-1].positionSize * 1.3) {
        sizeIncreaseDetected = true;
        sizeIncreaseEvidence = `Position size increased by ${((trades[i].positionSize / trades[i-1].positionSize - 1) * 100).toFixed(0)}% after win`;
        break;
      }
    }

    // Check for reduced stop loss usage
    const recentTradesWithStop = trades.slice(0, 5).filter(t => t.stopLoss).length;
    const olderTradesWithStop = trades.slice(5, 10).filter(t => t.stopLoss).length;
    const reducedStops = olderTradesWithStop > 0 && 
                        recentTradesWithStop < olderTradesWithStop * 0.5;

    let detected = hasWinStreak || sizeIncreaseDetected || reducedStops;
    let evidence = [];
    let confidence = 0;
    let severity = 'low';

    if (hasWinStreak) {
      evidence.push(`${recentWinStreak} consecutive winning trades`);
      confidence += 30;
      severity = recentWinStreak >= 5 ? 'high' : 'medium';
    }

    if (sizeIncreaseDetected) {
      evidence.push(sizeIncreaseEvidence);
      confidence += 40;
      severity = 'high';
    }

    if (reducedStops) {
      evidence.push(`Stop loss usage reduced by ${((1 - recentTradesWithStop / olderTradesWithStop) * 100).toFixed(0)}%`);
      confidence += 30;
      severity = 'medium';
    }

    return {
      detected,
      confidence: Math.min(100, confidence),
      riskScore: this.calculateRiskScore(severity),
      evidence: evidence.join('; '),
      severity
    };
  }

  checkRevengeTrading(trades) {
    if (trades.length < 3) {
      return { detected: false, confidence: 0, riskScore: 0 };
    }

    // Check timing after losses
    let quickReentryDetected = false;
    let quickReentryEvidence = '';
    
    for (let i = 1; i < Math.min(5, trades.length); i++) {
      if (trades[i-1].profit < 0) {
        const timeDiff = new Date(trades[i].timestamp) - new Date(trades[i-1].timestamp);
        if (timeDiff < 5 * 60 * 1000) { // Less than 5 minutes
          quickReentryDetected = true;
          quickReentryEvidence = `New trade entered ${(timeDiff / 60000).toFixed(0)} minutes after loss`;
          break;
        }
      }
    }

    // Check position size increase after loss
    let sizeIncreaseDetected = false;
    let sizeIncreaseEvidence = '';
    
    for (let i = 1; i < Math.min(5, trades.length); i++) {
      if (trades[i-1].profit < 0 && trades[i].positionSize > trades[i-1].positionSize * 1.5) {
        sizeIncreaseDetected = true;
        sizeIncreaseEvidence = `Position size increased by ${((trades[i].positionSize / trades[i-1].positionSize - 1) * 100).toFixed(0)}% after loss`;
        break;
      }
    }

    let detected = quickReentryDetected || sizeIncreaseDetected;
    let evidence = [];
    let confidence = 0;
    let severity = 'low';

    if (quickReentryDetected) {
      evidence.push(quickReentryEvidence);
      confidence += 50;
      severity = 'high';
    }

    if (sizeIncreaseDetected) {
      evidence.push(sizeIncreaseEvidence);
      confidence += 40;
      severity = 'high';
    }

    // Check for increased frequency after losses
    const lossPeriods = this.identifyLossPeriods(trades);
    if (lossPeriods.length > 0) {
      const lastLossPeriod = lossPeriods[0];
      if (lastLossPeriod.tradeFrequency > this.getAverageFrequency(trades) * 1.5) {
        detected = true;
        evidence.push(`Trade frequency increased by ${((lastLossPeriod.tradeFrequency / this.getAverageFrequency(trades) - 1) * 100).toFixed(0)}% after losses`);
        confidence += 30;
        severity = 'medium';
      }
    }

    return {
      detected,
      confidence: Math.min(100, confidence),
      riskScore: this.calculateRiskScore(severity),
      evidence: evidence.join('; '),
      severity
    };
  }

  checkConfirmationBias(trades, marketContext) {
    // This requires more data than just trades
    // For now, we'll use a simplified check based on trade direction consistency
    
    if (trades.length < 10) {
      return { detected: false, confidence: 0, riskScore: 0 };
    }

    // Check if trader only takes trades in one direction during certain market conditions
    const recentTrades = trades.slice(0, 10);
    const longTrades = recentTrades.filter(t => t.type === 'buy').length;
    const shortTrades = recentTrades.filter(t => t.type === 'sell').length;
    
    const totalTrades = recentTrades.length;
    const longRatio = longTrades / totalTrades;
    const shortRatio = shortTrades / totalTrades;

    let detected = false;
    let evidence = [];
    let confidence = 0;
    let severity = 'low';

    // If trader is heavily biased toward one direction
    if (longRatio > 0.8 || shortRatio > 0.8) {
      detected = true;
      const direction = longRatio > shortRatio ? 'long' : 'short';
      evidence.push(`Heavily biased toward ${direction} positions (${Math.max(longRatio, shortRatio) * 100}% of recent trades)`);
      confidence = 60;
      severity = 'medium';
    }

    // Check if trades consistently go against overall market trend
    if (marketContext.trend) {
      const againstTrendTrades = recentTrades.filter(t => {
        if (marketContext.trend === 'bullish' && t.type === 'sell') return true;
        if (marketContext.trend === 'bearish' && t.type === 'buy') return true;
        return false;
      }).length;

      const againstTrendRatio = againstTrendTrades / totalTrades;
      if (againstTrendRatio > 0.7) {
        detected = true;
        evidence.push(`${againstTrendTrades} of ${totalTrades} recent trades against market trend`);
        confidence = Math.max(confidence, 70);
        severity = 'high';
      }
    }

    return {
      detected,
      confidence,
      riskScore: this.calculateRiskScore(severity),
      evidence: evidence.join('; '),
      severity
    };
  }

  checkAnchoring(trades) {
    // This is difficult to detect without more context
    // For now, we'll check for trades held near breakeven for extended periods
    
    const anchoredTrades = trades.filter(trade => {
      if (!trade.stopLoss || !trade.takeProfit) return false;
      
      // Check if trade was held for a long time with little price movement
      const priceRange = Math.abs(trade.exitPrice - trade.entryPrice) / trade.entryPrice;
      const durationHours = (trade.duration || 0) / 60;
      
      return priceRange < 0.01 && durationHours > 2; // Less than 1% move over 2+ hours
    }).length;

    if (anchoredTrades > 2) {
      return {
        detected: true,
        confidence: 50,
        riskScore: this.calculateRiskScore('medium'),
        evidence: `${anchoredTrades} trades held with minimal price movement`,
        severity: 'medium'
      };
    }

    return { detected: false, confidence: 0, riskScore: 0 };
  }

  // Helper methods
  getCurrentWinStreak(trades) {
    let streak = 0;
    for (const trade of trades) {
      if (trade.profit > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  identifyLossPeriods(trades) {
    const periods = [];
    let currentPeriod = null;
    
    for (const trade of trades) {
      if (trade.profit < 0) {
        if (!currentPeriod) {
          currentPeriod = {
            startTime: new Date(trade.timestamp),
            losses: 0,
            totalTrades: 0,
            tradeFrequency: 0
          };
        }
        currentPeriod.losses++;
        currentPeriod.totalTrades++;
      } else if (currentPeriod) {
        currentPeriod.totalTrades++;
        if (currentPeriod.totalTrades >= 5) { // End period after 5 trades
          const durationHours = (new Date() - currentPeriod.startTime) / (1000 * 60 * 60);
          currentPeriod.tradeFrequency = currentPeriod.totalTrades / durationHours;
          periods.push(currentPeriod);
          currentPeriod = null;
        }
      }
    }
    
    return periods;
  }

  getAverageFrequency(trades) {
    if (trades.length < 2) return 0;
    
    const firstTradeTime = new Date(trades[trades.length - 1].timestamp);
    const lastTradeTime = new Date(trades[0].timestamp);
    const durationHours = (lastTradeTime - firstTradeTime) / (1000 * 60 * 60);
    
    return trades.length / durationHours;
  }

  calculateRiskScore(severity) {
    switch (severity) {
      case 'low': return 15;
      case 'medium': return 30;
      case 'high': return 50;
      default: return 0;
    }
  }

  calculateConfidence(tradeCount) {
    if (tradeCount >= 20) return 95;
    if (tradeCount >= 10) return 85;
    if (tradeCount >= 5) return 70;
    return 50;
  }

  getRecommendation(biasKey, severity) {
    const recommendations = {
      lossAversion: {
        low: 'Consider setting stricter stop losses based on technical levels, not emotions.',
        medium: 'Implement a trailing stop strategy. Review losing trades to identify exit patterns.',
        high: 'Use automated stop losses. Practice letting go of losing positions. Consider reducing position sizes.'
      },
      overconfidence: {
        low: 'Stick to your trading plan. Avoid changing strategies during winning streaks.',
        medium: 'Reduce position sizes by 25% after 3 consecutive wins. Document your reasoning for each trade.',
        high: 'Take a 24-hour break from trading. Reset with 50% smaller positions. Review risk management rules.'
      },
      revengeTrading: {
        low: 'Wait at least 1 hour after a loss before taking another trade.',
        medium: 'Implement a daily loss limit. Stop trading for the day if reached.',
        high: 'Take a minimum 4-hour break after any loss. Reduce position size by 50% for next 5 trades.'
      },
      confirmationBias: {
        low: 'Always look for counter-evidence before entering a trade.',
        medium: 'Write down 3 reasons why your trade might fail before entering.',
        high: 'Implement a "devil\'s advocate" checklist. Consider taking the opposite position with a small size.'
      },
      anchoring: {
        low: 'Use dynamic price targets based on market structure, not entry price.',
        medium: 'Implement time-based exits. If trade doesn\'t move in your favor within X time, exit.',
        high: 'Use bracket orders with both stop loss and take profit set immediately after entry.'
      }
    };

    return recommendations[biasKey]?.[severity] || 'Review trading psychology principles.';
  }

  generateOverallRecommendations(detectedBiases, riskScore) {
    const recommendations = [];
    
    if (riskScore > 70) {
      recommendations.push('⚠️ HIGH RISK DETECTED: Consider taking a break from trading for 24-48 hours.');
      recommendations.push('Review and adjust your risk management rules immediately.');
      recommendations.push('Consider paper trading until emotional control improves.');
    } else if (riskScore > 40) {
      recommendations.push('Moderate risk detected. Focus on disciplined execution of your trading plan.');
      recommendations.push('Reduce position sizes by 25% until biases are under control.');
    } else if (riskScore > 20) {
      recommendations.push('Low risk level. Maintain current discipline and continue journaling.');
    }

    // Add specific bias recommendations
    if (detectedBiases.length > 0) {
      recommendations.push('\nSpecific actions:');
      detectedBiases.forEach(bias => {
        recommendations.push(`• ${bias.name}: ${bias.recommendation}`);
      });
    }

    // General recommendations
    recommendations.push('\nGeneral best practices:');
    recommendations.push('• Journal every trade with emotions noted');
    recommendations.push('• Stick to predefined position sizing');
    recommendations.push('• Take regular breaks during trading sessions');
    recommendations.push('• Review trading performance weekly');

    return recommendations;
  }

  // Real-time bias detection for single trade
  detectRealTimeBias(trade, previousTrades, marketContext) {
    const biases = [];
    
    // Check for revenge trading (quick entry after loss)
    if (previousTrades.length > 0) {
      const lastTrade = previousTrades[0];
      if (lastTrade.profit < 0) {
        const timeSinceLoss = new Date(trade.timestamp) - new Date(lastTrade.timestamp);
        if (timeSinceLoss < 15 * 60 * 1000) { // 15 minutes
          biases.push({
            type: 'revengeTrading',
            confidence: 70,
            evidence: `Trade entered ${(timeSinceLoss / 60000).toFixed(0)} minutes after loss`,
            recommendation: 'Wait at least 1 hour after a loss before next trade'
          });
        }
      }
    }

    // Check for overconfidence (increased position size after wins)
    const recentWins = previousTrades.slice(0, 3).filter(t => t.profit > 0).length;
    if (recentWins >= 2) {
      const avgRecentSize = previousTrades.slice(0, 3).reduce((sum, t) => sum + t.positionSize, 0) / 3;
      if (trade.positionSize > avgRecentSize * 1.2) {
        biases.push({
          type: 'overconfidence',
          confidence: 60,
          evidence: `Position size increased by ${((trade.positionSize / avgRecentSize - 1) * 100).toFixed(0)}% after ${recentWins} wins`,
          recommendation: 'Maintain consistent position sizing regardless of recent performance'
        });
      }
    }

    return biases;
  }
}

// Export singleton instance
window.BiasEngine = new BiasEngine();
