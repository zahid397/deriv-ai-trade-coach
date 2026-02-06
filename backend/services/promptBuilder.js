const promptBuilder = {
  buildTradeAnalysisPrompt(trade, context) {
    return {
      system: `You are an expert trading coach with 20+ years experience. Analyze trades focusing on:
1. Risk management effectiveness
2. Entry/exit timing
3. Emotional discipline
4. Technical analysis alignment
5. Improvement suggestions

Be specific, actionable, and supportive.`,
      
      user: `Trade Analysis Request:
      
TRADE DATA:
Symbol: ${trade.symbol}
Type: ${trade.type}
Entry: ${trade.entryPrice} at ${trade.entryTime}
Exit: ${trade.exitPrice} at ${trade.exitTime}
Profit: $${trade.profit} (${((trade.profit / (trade.entryPrice * trade.positionSize)) * 100).toFixed(2)}%)
Position Size: ${trade.positionSize}
Duration: ${trade.duration} minutes
Stop Loss: ${trade.stopLoss || 'Not set'}
Take Profit: ${trade.takeProfit || 'Not set'}

MARKET CONTEXT:
${context.marketCondition || 'No context provided'}

TRADER HISTORY:
Total Trades: ${context.totalTrades || 0}
Recent Win Rate: ${context.recentWinRate || 0}%
Recent Performance: ${context.recentPerformance || 'Neutral'}

Please provide a comprehensive analysis covering:
1. What worked well
2. Potential mistakes
3. Risk assessment
4. Behavioral insights
5. Specific improvement suggestions`
    };
  },

  buildCoachingPrompt(marketData, traderProfile) {
    return {
      system: `You are a supportive but honest AI Trading Coach. Provide real-time coaching that:
1. Analyzes current market conditions
2. Assesses risk levels
3. Gives specific, actionable advice
4. Addresses psychological aspects
5. Keeps responses under 3 sentences

Format: [Market Analysis] | [Risk Level: Low/Med/High] | [Action: Specific advice] | [Psychology: Note]`,
      
      user: `COACHING REQUEST - ${new Date().toLocaleString()}

CURRENT MARKET:
${JSON.stringify(marketData.current, null, 2)}

RECENT MARKET MOVES:
${JSON.stringify(marketData.recent, null, 2)}

TRADER PROFILE:
Experience: ${traderProfile.experience || 'Unknown'}
Risk Tolerance: ${traderProfile.riskTolerance || 'Medium'}
Current Positions: ${traderProfile.positions || 'None'}
Recent Performance: ${traderProfile.recentPerformance || 'Neutral'}
Detected Biases: ${traderProfile.biases || 'None detected'}

Provide immediate coaching advice based on above.`
    };
  },

  buildBiasDetectionPrompt(trades, metadata) {
    const tradeSummaries = trades.slice(-10).map((t, i) => 
      `${i+1}. ${t.symbol} ${t.type}: $${t.profit} (${t.duration}min)`
    ).join('\n');

    return {
      system: `You are a trading psychologist specializing in behavioral finance. Analyze trading patterns for:
1. Loss Aversion (holding losers too long)
2. Overconfidence (taking excessive risk after wins)
3. Revenge Trading (trading emotionally after losses)
4. Confirmation Bias (seeking confirming information)
5. Anchoring (fixating on specific price levels)

Provide JSON output with detected biases, confidence scores, and recommendations.`,
      
      user: `BIAS DETECTION ANALYSIS:

Recent Trades (last 10):
${tradeSummaries}

Trader Metadata:
Total Trades: ${metadata.totalTrades}
Win Rate: ${metadata.winRate}%
Average Win: $${metadata.avgWin}
Average Loss: $${metadata.avgLoss}
Largest Win: $${metadata.maxWin}
Largest Loss: $${metadata.maxLoss}
Consecutive Wins: ${metadata.consecutiveWins}
Consecutive Losses: ${metadata.consecutiveLosses}

Detect psychological biases and provide specific recommendations.`
    };
  },

  buildPerformanceReviewPrompt(stats, period) {
    return {
      system: `Generate a comprehensive trading performance review. Include:
1. Overall assessment (Excellent/Good/Fair/Poor)
2. Key strengths
3. Areas for improvement
4. Specific goals for next period
5. Action plan

Be encouraging but honest. Use specific metrics from the data.`,
      
      user: `PERFORMANCE REVIEW - ${period}

STATISTICS:
${JSON.stringify(stats, null, 2)}

Generate a detailed performance review with actionable insights.`
    };
  }
};

module.exports = promptBuilder;
