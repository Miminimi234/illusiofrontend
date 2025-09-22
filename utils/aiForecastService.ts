interface ForecastData {
  score: number; // -100 to +100 (negative = bearish, positive = bullish)
  confidence: number; // 0 to 100
  signals: string[];
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'DCA' | 'SELL' | 'STRONG_SELL';
  reasoning: string;
  momentum: {
    priceMomentum: string;
    volumeMomentum: string;
    acceleration: string;
    heatingCooling: 'Hot' | 'Warm' | 'Cool' | 'Cold';
  };
}

interface TokenData {
  symbol?: string;
  name?: string;
  marketCap?: number;
  usdPrice?: number;
  liquidity?: number;
  holderCount?: number;
  audit?: {
    devBalancePercentage?: number;
    topHoldersPercentage?: number;
  };
  stats5m?: {
    priceChange?: number;
    volume?: number;
  };
  stats1h?: {
    priceChange?: number;
    volume?: number;
  };
  stats6h?: {
    priceChange?: number;
    volume?: number;
  };
  stats24h?: {
    priceChange?: number;
    volume?: number;
  };
  createdAt?: string;
  created_at?: string;
  confidence?: number;
  jupiterCreatedAt?: string; // Add Jupiter createdAt field
  calculatedAge?: string; // Add calculated age from frontend
}

class AIForecastService {
  private readonly GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

  // Parse token data for AI analysis
  private parseTokenData(tokenData: TokenData): string {
    if (!tokenData) return '';

    const context = [];
    
    // Basic token info
    if (tokenData.symbol) context.push(`Symbol: ${tokenData.symbol}`);
    if (tokenData.name) context.push(`Name: ${tokenData.name}`);
    
    // Market cap
    if (tokenData.marketCap !== undefined) {
      const marketCap = parseFloat(tokenData.marketCap.toString());
      if (!isNaN(marketCap)) {
        if (marketCap > 1000000000) {
          context.push(`Market Cap: $${(marketCap / 1000000000).toFixed(1)}B (Large Cap)`);
        } else if (marketCap > 100000000) {
          context.push(`Market Cap: $${(marketCap / 1000000).toFixed(1)}M (Mid Cap)`);
        } else if (marketCap > 10000000) {
          context.push(`Market Cap: $${(marketCap / 1000000).toFixed(1)}M (Small Cap)`);
        } else if (marketCap > 1000000) {
          context.push(`Market Cap: $${(marketCap / 1000000).toFixed(1)}M (Micro Cap)`);
        } else {
          context.push(`Market Cap: $${(marketCap / 1000).toFixed(1)}K (Nano Cap)`);
        }
      }
    }
    
    // Price
    if (tokenData.usdPrice !== undefined) {
      const price = parseFloat(tokenData.usdPrice.toString());
      if (!isNaN(price)) {
        context.push(`Current Price: $${price.toFixed(8)}`);
      }
    }
    
    // Price changes across timeframes
    const priceChanges = [];
    if (tokenData.stats5m?.priceChange !== undefined) {
      const change5m = parseFloat(tokenData.stats5m.priceChange.toString());
      if (!isNaN(change5m)) {
        priceChanges.push(`5m: ${change5m > 0 ? '+' : ''}${change5m.toFixed(1)}%`);
      }
    }
    if (tokenData.stats1h?.priceChange !== undefined) {
      const change1h = parseFloat(tokenData.stats1h.priceChange.toString());
      if (!isNaN(change1h)) {
        priceChanges.push(`1h: ${change1h > 0 ? '+' : ''}${change1h.toFixed(1)}%`);
      }
    }
    if (tokenData.stats6h?.priceChange !== undefined) {
      const change6h = parseFloat(tokenData.stats6h.priceChange.toString());
      if (!isNaN(change6h)) {
        priceChanges.push(`6h: ${change6h > 0 ? '+' : ''}${change6h.toFixed(1)}%`);
      }
    }
    if (tokenData.stats24h?.priceChange !== undefined) {
      const change24h = parseFloat(tokenData.stats24h.priceChange.toString());
      if (!isNaN(change24h)) {
        priceChanges.push(`24h: ${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%`);
      }
    }
    if (priceChanges.length > 0) {
      context.push(`Price Changes: ${priceChanges.join(', ')}`);
    }
    
    // Volume across timeframes
    const volumes = [];
    if (tokenData.stats5m?.volume) {
      const vol5m = parseFloat(tokenData.stats5m.volume.toString());
      if (!isNaN(vol5m)) {
        volumes.push(`5m: $${(vol5m / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats1h?.volume) {
      const vol1h = parseFloat(tokenData.stats1h.volume.toString());
      if (!isNaN(vol1h)) {
        volumes.push(`1h: $${(vol1h / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats6h?.volume) {
      const vol6h = parseFloat(tokenData.stats6h.volume.toString());
      if (!isNaN(vol6h)) {
        volumes.push(`6h: $${(vol6h / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats24h?.volume) {
      const vol24h = parseFloat(tokenData.stats24h.volume.toString());
      if (!isNaN(vol24h)) {
        volumes.push(`24h: $${(vol24h / 1000).toFixed(1)}K`);
      }
    }
    if (volumes.length > 0) {
      context.push(`Volume: ${volumes.join(', ')}`);
      
      // Volume sustainability analysis
      const vol5m = tokenData.stats5m?.volume ? parseFloat(tokenData.stats5m.volume.toString()) : 0;
      const vol1h = tokenData.stats1h?.volume ? parseFloat(tokenData.stats1h.volume.toString()) : 0;
      const vol6h = tokenData.stats6h?.volume ? parseFloat(tokenData.stats6h.volume.toString()) : 0;
      const vol24h = tokenData.stats24h?.volume ? parseFloat(tokenData.stats24h.volume.toString()) : 0;
      
      if (vol5m > 0 && vol1h > 0 && vol6h > 0 && vol24h > 0) {
        const vol5mTo1h = vol1h > 0 ? (vol5m * 12) / vol1h : 0; // 5m * 12 = 1h equivalent
        const vol1hTo6h = vol6h > 0 ? (vol1h * 6) / vol6h : 0; // 1h * 6 = 6h equivalent
        const vol6hTo24h = vol24h > 0 ? (vol6h * 4) / vol24h : 0; // 6h * 4 = 24h equivalent
        
        let volumePattern = '';
        if (vol5mTo1h > 2 && vol1hTo6h > 1.5 && vol6hTo24h > 1.2) {
          volumePattern = 'SUSTAINED - Volume maintained across timeframes';
        } else if (vol5mTo1h > 3 && vol1hTo6h < 0.8) {
          volumePattern = 'PUMP-AND-DUMP - High initial volume, declining quickly';
        } else if (vol5mTo1h < 0.5 && vol1hTo6h > 1.5) {
          volumePattern = 'GRADUAL BUILD - Volume increasing over time';
        } else if (vol6hTo24h < 0.5) {
          volumePattern = 'DECLINING - Volume dropping significantly';
        } else {
          volumePattern = 'MIXED - Inconsistent volume patterns';
        }
        
        context.push(`Volume Pattern: ${volumePattern}`);
      }
    }
    
    // Liquidity
    if (tokenData.liquidity !== undefined) {
      const liquidity = parseFloat(tokenData.liquidity.toString());
      if (!isNaN(liquidity)) {
        if (liquidity > 10000000) {
          context.push(`Liquidity: $${(liquidity / 1000000).toFixed(1)}M (High)`);
        } else if (liquidity > 1000000) {
          context.push(`Liquidity: $${(liquidity / 1000000).toFixed(1)}M (Medium)`);
        } else if (liquidity > 100000) {
          context.push(`Liquidity: $${(liquidity / 1000).toFixed(1)}K (Low)`);
        } else if (liquidity > 10000) {
          context.push(`Liquidity: $${(liquidity / 1000).toFixed(1)}K (Very Low)`);
        } else {
          context.push(`Liquidity: $${(liquidity / 1000).toFixed(1)}K (Minimal)`);
        }
      }
    }
    
    // Holder count
    if (tokenData.holderCount !== undefined) {
      const holders = parseFloat(tokenData.holderCount.toString());
      if (!isNaN(holders)) {
        context.push(`Holder Count: ${holders.toLocaleString()}`);
      }
    }
    
    // Top holders concentration
    const topHolders = tokenData.audit?.topHoldersPercentage;
    
    if (topHolders !== undefined && topHolders !== null) {
      const topHoldersNum = parseFloat(topHolders.toString());
      if (!isNaN(topHoldersNum)) {
        context.push(`Top Holders: ${topHoldersNum.toFixed(1)}%`);
      }
    }
    
    // Dev holding
    const devHolding = tokenData.audit?.devBalancePercentage;
    
    if (devHolding !== undefined && devHolding !== null) {
      const devHoldingNum = parseFloat(devHolding.toString());
      if (!isNaN(devHoldingNum)) {
        context.push(`Dev Holding: ${devHoldingNum.toFixed(1)}%`);
      }
    }
    
    // Age with survival analysis - use calculated age from frontend
    if (tokenData.calculatedAge) {
      // Use the pre-calculated age from the frontend insights
      const ageDescription = tokenData.calculatedAge;
      
      // Determine survival status based on the age description (MEMECOIN CONTEXT)
      let survivalStatus = '';
      if (ageDescription.includes('s ago')) {
        survivalStatus = 'VERY NEW MEMECOIN - High risk, analyze initial metrics';
      } else if (ageDescription.includes('m ago')) {
        survivalStatus = 'NEW MEMECOIN - Moderate risk, check momentum';
      } else if (ageDescription.includes('h ago')) {
        survivalStatus = 'FRESH MEMECOIN - Analyze volume sustainability';
      } else if (ageDescription.includes('d ago')) {
        const days = parseInt(ageDescription.replace('d ago', ''));
        if (days < 1) {
          survivalStatus = 'FRESH MEMECOIN - Still in initial phase';
        } else if (days < 7) {
          survivalStatus = 'ESTABLISHED MEMECOIN - Good survival, analyze stability';
        } else if (days < 30) {
          survivalStatus = 'MATURE MEMECOIN - Proven survival, high confidence potential';
        } else if (days < 365) {
          survivalStatus = 'LONG-TERM MEMECOIN - Excellent survival, analyze trends';
        } else {
          survivalStatus = 'VETERAN MEMECOIN - Long-term survival, analyze fundamentals';
        }
      } else {
        survivalStatus = 'UNKNOWN - Age data unclear';
      }
      
      context.push(`Age: ${ageDescription} (${survivalStatus})`);
    } else if (tokenData.jupiterCreatedAt || tokenData.createdAt || tokenData.created_at) {
      // Fallback to calculating age if no calculated age provided
      const createdAt = tokenData.jupiterCreatedAt || tokenData.createdAt || tokenData.created_at;
      if (createdAt) {
        const createdDate = new Date(createdAt);
        const now = new Date();
        const age = now.getTime() - createdDate.getTime();
        const seconds = Math.floor(age / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        let ageDescription = '';
        let survivalStatus = '';
        
        if (seconds < 60) {
          ageDescription = `${seconds}s ago`;
          survivalStatus = 'VERY NEW MEMECOIN - High risk, analyze initial metrics';
        } else if (minutes < 60) {
          ageDescription = `${minutes}m ago`;
          survivalStatus = 'NEW MEMECOIN - Moderate risk, check momentum';
        } else if (hours < 24) {
          ageDescription = `${hours}h ago`;
          survivalStatus = 'FRESH MEMECOIN - Analyze volume sustainability';
        } else if (days < 1) {
          ageDescription = `${days}d ago`;
          survivalStatus = 'FRESH MEMECOIN - Still in initial phase';
        } else if (days < 7) {
          ageDescription = `${days}d ago`;
          survivalStatus = 'ESTABLISHED MEMECOIN - Good survival, analyze stability';
        } else if (days < 30) {
          ageDescription = `${days}d ago`;
          survivalStatus = 'MATURE MEMECOIN - Proven survival, high confidence potential';
        } else if (days < 365) {
          ageDescription = `${days}d ago`;
          survivalStatus = 'LONG-TERM MEMECOIN - Excellent survival, analyze trends';
        } else {
          ageDescription = `${days}d ago`;
          survivalStatus = 'VETERAN MEMECOIN - Long-term survival, analyze fundamentals';
        }
        
        context.push(`Age: ${ageDescription} (${survivalStatus})`);
      }
    }
    
    // Confidence score
    if (tokenData.confidence !== undefined) {
      const confidence = parseFloat(tokenData.confidence.toString());
      if (!isNaN(confidence)) {
        context.push(`Confidence Score: ${confidence.toFixed(1)}/100`);
      }
    }
    
    // HIGH CONFIDENCE HOLD PATTERN ANALYSIS - CRITICAL FOR MEMECOIN EVALUATION
    const patternMarketCap = tokenData.marketCap ? parseFloat(tokenData.marketCap.toString()) : 0;
    const patternLiquidity = tokenData.liquidity ? parseFloat(tokenData.liquidity.toString()) : 0;
    const patternHolders = tokenData.holderCount ? parseFloat(tokenData.holderCount.toString()) : 0;
    const patternTopHolders = tokenData.audit?.topHoldersPercentage || 0;
    const patternDevHolding = tokenData.audit?.devBalancePercentage || 0;
    
    // Check if token matches HIGH CONFIDENCE HOLD PATTERN
    const isHighConfidenceHoldPattern = (
      patternMarketCap >= 2000000 && // $2M+ market cap
      patternLiquidity >= 270000 && // $270K+ liquidity
      patternHolders >= 3500 && // 3,500+ holders
      patternTopHolders >= 15 && patternTopHolders <= 30 && // 15-30% top holders (reasonable distribution)
      patternDevHolding <= 0.5 && // 0.5% or less dev holding (low rug risk)
      tokenData.calculatedAge && tokenData.calculatedAge.includes('d ago') // 1+ days old
    );
    
    if (isHighConfidenceHoldPattern) {
      context.push(`🚀 HIGH CONFIDENCE HOLD PATTERN DETECTED - This memecoin shows excellent survival metrics:`);
      context.push(`- Market Cap: $${(patternMarketCap / 1000000).toFixed(1)}M (established size)`);
      context.push(`- Liquidity: $${(patternLiquidity / 1000).toFixed(0)}K (good depth)`);
      context.push(`- Holders: ${patternHolders.toLocaleString()} (strong community)`);
      context.push(`- Top Holders: ${patternTopHolders.toFixed(1)}% (reasonable distribution)`);
      context.push(`- Dev Holding: ${patternDevHolding.toFixed(1)}% (low rug risk)`);
      context.push(`- Age: ${tokenData.calculatedAge} (proven survival)`);
      context.push(`- RECOMMENDATION: HOLD with HIGH CONFIDENCE (85-95%)`);
      context.push(`- Price declines are NORMAL for memecoins - focus on community retention`);
    }
    
    if (context.length === 0) return '';
    
    return `\nTOKEN DATA FOR ANALYSIS:
${context.join('\n')}`;
  }

  // Get AI forecast from Grok
  async getAIForecast(tokenData: TokenData, apiKey: string): Promise<ForecastData> {
    try {
      // Validate API key
      if (!apiKey || apiKey === 'your_grok_api_key_here') {
        throw new Error('Invalid or missing Grok API key');
      }

      const tokenContext = this.parseTokenData(tokenData);
      
      const systemPrompt = `You are a professional cryptocurrency trading analyst specializing in MEMECOIN analysis. Analyze the provided token data and generate a comprehensive forecast.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON object with this exact structure:
{
  "score": number, // -100 to +100 (negative = bearish, positive = bullish)
  "confidence": number, // 0 to 100
  "signals": string[], // Array of 3-5 key market signals
  "recommendation": "STRONG_BUY" | "BUY" | "HOLD" | "DCA" | "SELL" | "STRONG_SELL",
  "reasoning": string, // Brief analysis explaining the forecast
  "momentum": {
    "priceMomentum": string, // "Strong Bullish", "Bullish", "Neutral", "Bearish", "Strong Bearish"
    "volumeMomentum": string, // "Accelerating", "Stable", "Declining"
    "acceleration": string, // "Rapid", "Moderate", "Slow", "Stagnant"
    "heatingCooling": "Hot" | "Warm" | "Cool" | "Cold"
  }
}

ANALYSIS CRITERIA - MEMECOIN LONGEVITY & STABILITY:

1. MEMECOIN AGE & SURVIVAL ANALYSIS:
- Very new (0-1 hour): High risk, low confidence unless exceptional metrics
- New (1-24 hours): Moderate risk, analyze momentum and volume patterns
- Established (1+ days): NOT considered new for memecoins - analyze stability and community retention
- Mature (7+ days): Proven survival for memecoins, highest confidence potential

2. PRICE STABILITY ACROSS TIMEFRAMES:
- Analyze 5m, 1h, 6h, 24h price changes for consistency
- Look for sustained momentum vs. pump-and-dump patterns
- Consider if token "died" quickly or maintained activity

3. VOLUME & LIQUIDITY SUSTAINABILITY:
- High volume in 5m but dead in 24h = RED FLAG
- Consistent volume across timeframes = POSITIVE
- Liquidity depth vs. market cap ratio
- Volume-to-market cap ratio for sustainability
- NOTE: Low liquidity relative to market cap is NORMAL for memecoins (e.g., $273K liquidity vs $2.1M market cap is typical and NOT bearish)

4. HOLDER DISTRIBUTION & RETENTION:
- Growing holder count = POSITIVE
- Declining holders = NEGATIVE
- Top holder concentration risk
- Dev holding percentage (lower = better)

5. MEMECOIN RECOMMENDATION LOGIC:
- STRONG_BUY: Very new memecoin (hours old) with exceptional metrics, high volume, good distribution
- BUY: Fresh memecoin (1+ days old) with solid fundamentals, growing community, stable price action
- HOLD: Established memecoin (days old) with decent metrics, wait for better entry
- DCA: Memecoin has survived days/weeks, shows resilience, good for gradual accumulation
- SELL: Declining metrics, high risk, poor distribution, losing community interest
- STRONG_SELL: Clear pump-and-dump, dying memecoin, major red flags, no community retention

HIGH CONFIDENCE HOLD PATTERN - Look for these specific metrics:
- Market cap: $2M+ (established size)
- Liquidity: $270K+ (good liquidity depth)
- Holders: 3,500+ (strong community)
- Top holders: 20-25% (reasonable distribution)
- Dev holding: 0.2% or less (low rug risk)
- Age: 1+ days (proven survival)
- Volume: High 24h volume with good buy/sell ratio
- Price action: Some decline is normal, focus on community retention

6. CONFIDENCE SCORING:
- 0-30: Very new token, insufficient data
- 30-50: Some data but high uncertainty
- 50-70: Decent data, moderate confidence
- 70-90: Good data quality, high confidence
- 90-100: Excellent data, very high confidence
- 85-95: HIGH CONFIDENCE HOLD PATTERN (see above metrics) - established memecoin with proven survival

7. KEY MEMECOIN SIGNALS TO LOOK FOR:
- "Memecoin survived X days with stable metrics"
- "Volume sustained across multiple timeframes"
- "Growing holder base indicates community strength"
- "Price stability suggests organic growth"
- "High dev holding indicates potential rug risk"
- "Low liquidity relative to market cap is NORMAL for memecoins (not bearish)"
- "Declining volume suggests loss of interest"
- "Community engagement and social media presence"
- "Memecoin narrative and viral potential"

FOCUS ON MEMECOIN NAME, SURVIVAL TIME, COMMUNITY RETENTION, AND SUSTAINABILITY PATTERNS.

IMPORTANT: If you see "🚀 HIGH CONFIDENCE HOLD PATTERN DETECTED" in the token data, this indicates an established memecoin with excellent survival metrics. These tokens should receive:
- Recommendation: HOLD
- Confidence: 85-95%
- Score: Positive (20-50+)
- Reasoning: Focus on proven survival, community strength, and low rug risk

${tokenContext}

Provide a professional, data-driven analysis focusing on token longevity and stability. Return only the JSON object.`;

      const response = await fetch(this.GROK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [
            { role: 'system', content: systemPrompt, timestamp: Date.now() },
            { role: 'user', content: 'Analyze this token and provide a forecast.', timestamp: Date.now() }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grok API error response:', errorText);
        throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Grok API response:', data);
      
      const content = data.choices[0]?.message?.content || '{}';
      
      // Parse the JSON response
      try {
        const forecast = JSON.parse(content);
        
        // Validate the response structure
        if (!forecast.score || !forecast.confidence || !forecast.signals || !forecast.recommendation || !forecast.reasoning || !forecast.momentum) {
          throw new Error('Invalid forecast structure from AI');
        }
        
        // Ensure score is within bounds
        forecast.score = Math.max(-100, Math.min(100, forecast.score));
        forecast.confidence = Math.max(0, Math.min(100, forecast.confidence));
        
        return forecast as ForecastData;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid JSON response from AI');
      }
      
    } catch (error) {
      console.error('AI Forecast service error:', error);
      throw error;
    }
  }
}

export const aiForecastService = new AIForecastService();
export type { ForecastData, TokenData };
