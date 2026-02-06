const Groq = require('groq-sdk');
const config = require('../config/env');

class GroqService {
  constructor() {
    this.isMockMode = config.useMockAI;
    this.groq = null;
    
    if (!this.isMockMode && config.groqApiKey) {
      try {
        this.groq = new Groq({ apiKey: config.groqApiKey });
      } catch (error) {
        console.error('Failed to initialize Groq:', error.message);
        this.isMockMode = true;
      }
    }
  }

  async analyzeTrade(tradeData) {
    if (this.isMockMode) {
      return this.mockTradeAnalysis(tradeData);
    }

    const prompt = this.buildTradeAnalysisPrompt(tradeData);
    
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.3,
        max_tokens: 500
      });

      return this.parseAIResponse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Groq API error:', error.message);
      return this.mockTradeAnalysis(tradeData);
    }
  }

  async getCoachingAdvice(marketContext, traderHistory) {
    if (this.isMockMode) {
      return this.mockCoachingAdvice(marketContext);
    }

    const prompt = this.buildCoachingPrompt(marketContext, traderHistory);
    
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.4,
        max_tokens: 300
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Groq API error:', error.message);
      return this.mockCoachingAdvice(marketContext);
    }
  }

  async detectBiases(tradeHistory) {
    if (this.isMockMode) {
      return this.mockBiasDetection(tradeHistory);
    }

    const prompt = this.buildBiasDetectionPrompt(tradeHistory);
    
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.2,
        max_tokens: 400
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Groq API error:', error.message);
      return this.mockBiasDetection(tradeHistory);
    }
  }

  buildTradeAnalysisPrompt(tradeData) {
    return `
As an AI Trading Coach, analyze this trade:
${JSON.stringify(tradeData, null, 2)}

Provide analysis in this JSON format:
{
  "successFactors": ["array", "of", "factors"],
  "mistakes": ["array", "of", "mistakes"],
  "confidenceScore": 0-100,
  "behavioralInsights": "text about trader behavior",
  "improvementSuggestions": ["array", "of", "suggestions"],
  "riskAssessment": "low/medium/high",
  "technicalAnalysis": "text about technicals"
}`;
  }

  buildCoachingPrompt(marketContext, traderHistory) {
    return `
Market Context: ${marketContext}
Trader History: ${JSON.stringify(traderHistory.slice(-5))}

As an AI Trading Coach, provide:
1. Current market analysis
2. Risk assessment
3. Specific actionable advice
4. Psychological coaching
Keep response under 3 sentences, professional but encouraging.`;
  }

  buildBiasDetectionPrompt(tradeHistory) {
    return `
Analyze these trades for psychological biases:
${JSON.stringify(tradeHistory, null, 2)}

Return JSON with:
{
  "detectedBiases": [
    {
      "type": "lossAversion|overconfidence|revengeTrading|confirmationBias|anchoring",
      "confidence": 0-100,
      "evidence": "text evidence",
      "recommendation": "actionable advice"
    }
  ],
  "overallRiskScore": 0-100,
  "behavioralPattern": "pattern description"
}`;
  }

  mockTradeAnalysis(tradeData) {
    const isWin = tradeData.profit > 0;
    return {
      successFactors: isWin ? [
        "Good entry timing near support",
        "Proper risk management",
        "Adequate position sizing"
      ] : [
        "Managed to cut losses early",
        "Followed trading plan"
      ],
      mistakes: isWin ? [
        "Could have taken partial profits earlier",
        "Stop loss was too tight"
      ] : [
        "Entered during high volatility",
        "Ignored RSI divergence"
      ],
      confidenceScore: isWin ? 88 : 65,
      behavioralInsights: isWin 
        ? "Showed patience during volatility. Good emotional control."
        : "Possible revenge trading after previous loss. Consider taking a break.",
      improvementSuggestions: [
        "Use trailing stop losses",
        "Wait for confirmation candles",
        "Review trade journal daily"
      ],
      riskAssessment: tradeData.leverage > 3 ? "high" : tradeData.leverage > 1.5 ? "medium" : "low",
      technicalAnalysis: isWin
        ? "Breakout above resistance with volume confirmation"
        : "Failed breakout attempt, lacking volume support"
    };
  }

  mockCoachingAdvice(marketContext) {
    const advicePool = [
      "Market showing consolidation. Wait for clear breakout above $95,500 before entering long. Set stop at $94,800.",
      "RSI divergence detected on 1H chart. Consider reducing position size or taking partial profits.",
      "Strong bullish momentum. If already long, trail your stop. If not, wait for pullback to $94,200.",
      "Increased volatility expected. Consider tightening stops and reducing position sizes by 30%.",
      "Support holding at $93,800. Good risk/reward for long entries with stop below $93,500."
    ];
    return advicePool[Math.floor(Math.random() * advicePool.length)];
  }

  mockBiasDetection(tradeHistory) {
    const biases = [];
    const recentLosses = tradeHistory.filter(t => t.profit < 0).length;
    
    if (recentLosses > 2) {
      biases.push({
        type: "revengeTrading",
        confidence: 85,
        evidence: "Multiple consecutive losses followed by increased position sizes",
        recommendation: "Take 24-hour break. Reset with 50% smaller positions."
      });
    }

    const winRate = tradeHistory.filter(t => t.profit > 0).length / tradeHistory.length;
    if (winRate > 0.7 && tradeHistory.length > 10) {
      biases.push({
        type: "overconfidence",
        confidence: 75,
        evidence: "High win rate leading to increased risk-taking",
        recommendation: "Stick to original position sizing. Don't increase leverage."
      });
    }

    return {
      detectedBiases: biases.length ? biases : [{
        type: "none",
        confidence: 90,
        evidence: "No significant biases detected",
        recommendation: "Continue current disciplined approach"
      }],
      overallRiskScore: biases.length ? 65 : 35,
      behavioralPattern: biases.length ? "Emotional trading detected" : "Disciplined systematic trading"
    };
  }

  parseAIResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      return this.mockTradeAnalysis({ profit: 0 });
    }
  }
}

module.exports = new GroqService();
