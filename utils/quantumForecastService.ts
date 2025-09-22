export interface MarketInsights {
  marketCap: number;
  price: number;
  volume24h: number;
  liquidity: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  holderCount?: number;
  devHolding?: number;
  topHolderPercentage?: number;
  age?: number; // in hours
  volume5m?: number;
  volume1h?: number;
  volume6h?: number;
  buyVolume?: number;
  sellVolume?: number;
}

export interface QuantumForecast {
  confidence: number; // 0-1
  expectedRange: {
    min: number;
    max: number;
  };
  upProbability: number; // 0-1
  downProbability: number; // 0-1
  momentum: {
    priceMomentum: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
    volumeMomentum: 'Accelerating' | 'Stable' | 'Declining';
    acceleration: 'Rapid' | 'Moderate' | 'Slow' | 'Stagnant';
    heatingCooling: 'Hot' | 'Warm' | 'Cool' | 'Cold';
  };
  signals: string[];
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  timeHorizon: 'Short' | 'Medium' | 'Long';
}

export class QuantumForecastService {
  /**
   * Calculate quantum forecast based on market insights
   */
  static calculateForecast(insights: MarketInsights): QuantumForecast {
    // Calculate confidence based on data quality and market stability
    const confidence = this.calculateConfidence(insights);
    
    // Calculate expected price range based on volatility and momentum
    const expectedRange = this.calculateExpectedRange(insights);
    
    // Calculate probability distributions
    const probabilities = this.calculateProbabilities(insights);
    
    // Analyze momentum patterns
    const momentum = this.analyzeMomentum(insights);
    
    // Generate market signals
    const signals = this.generateSignals(insights);
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(insights);
    
    // Determine time horizon
    const timeHorizon = this.determineTimeHorizon(insights);

    return {
      confidence,
      expectedRange,
      upProbability: probabilities.up,
      downProbability: probabilities.down,
      momentum,
      signals,
      riskLevel,
      timeHorizon
    };
  }

  /**
   * Calculate confidence based on data quality and market stability
   */
  private static calculateConfidence(insights: MarketInsights): number {
    let confidence = 0.5; // Base confidence

    // Market cap factor (larger markets = more stable)
    if (insights.marketCap > 10000000) confidence += 0.2; // $10M+
    else if (insights.marketCap > 1000000) confidence += 0.15; // $1M+
    else if (insights.marketCap > 100000) confidence += 0.1; // $100K+
    else confidence += 0.05; // Smaller markets

    // Volume factor (higher volume = more reliable)
    const volumeRatio = insights.volume24h / insights.marketCap;
    if (volumeRatio > 0.5) confidence += 0.15; // High volume relative to market cap
    else if (volumeRatio > 0.2) confidence += 0.1;
    else if (volumeRatio > 0.1) confidence += 0.05;

    // Liquidity factor
    const liquidityRatio = insights.liquidity / insights.marketCap;
    if (liquidityRatio > 0.1) confidence += 0.1; // Good liquidity
    else if (liquidityRatio > 0.05) confidence += 0.05;

    // Age factor (older tokens = more established)
    if (insights.age) {
      if (insights.age > 168) confidence += 0.1; // 1 week+
      else if (insights.age > 72) confidence += 0.05; // 3 days+
      else if (insights.age < 1) confidence -= 0.1; // Very new
    }

    // Holder distribution factor
    if (insights.holderCount && insights.topHolderPercentage) {
      if (insights.holderCount > 1000 && insights.topHolderPercentage < 20) {
        confidence += 0.1; // Good distribution
      } else if (insights.topHolderPercentage > 50) {
        confidence -= 0.15; // High concentration risk
      }
    }

    // Dev holding factor
    if (insights.devHolding) {
      if (insights.devHolding < 5) confidence += 0.05; // Low dev holding
      else if (insights.devHolding > 20) confidence -= 0.1; // High dev holding risk
    }

    return Math.min(0.95, Math.max(0.1, confidence));
  }

  /**
   * Calculate expected price range based on volatility and momentum
   */
  private static calculateExpectedRange(insights: MarketInsights): { min: number; max: number } {
    const currentPrice = insights.price || 0;
    
    // If no price data, return default range
    if (currentPrice <= 0) {
      return { min: 0, max: 0 };
    }
    
    const volatility = Math.abs(insights.priceChangePercent24h || 0) / 100;
    
    // Base volatility multiplier
    let volatilityMultiplier = 0.1; // 10% base range
    
    // Adjust based on actual volatility
    if (volatility > 0.5) volatilityMultiplier = 0.3; // 30% for high volatility
    else if (volatility > 0.2) volatilityMultiplier = 0.2; // 20% for medium volatility
    else if (volatility > 0.1) volatilityMultiplier = 0.15; // 15% for low volatility

    // Adjust based on market cap (smaller markets = more volatile)
    if (insights.marketCap < 100000) volatilityMultiplier *= 1.5; // 50% more volatile
    else if (insights.marketCap < 1000000) volatilityMultiplier *= 1.2; // 20% more volatile

    // Adjust based on volume (low volume = more volatile)
    const volumeRatio = insights.marketCap > 0 ? insights.volume24h / insights.marketCap : 0;
    if (volumeRatio < 0.05) volatilityMultiplier *= 1.3; // 30% more volatile
    else if (volumeRatio < 0.1) volatilityMultiplier *= 1.1; // 10% more volatile

    const range = currentPrice * volatilityMultiplier;
    
    return {
      min: Math.max(0, currentPrice - range),
      max: currentPrice + range
    };
  }

  /**
   * Calculate probability distributions
   */
  private static calculateProbabilities(insights: MarketInsights): { up: number; down: number } {
    let upProbability = 0.5; // Base 50/50

    // Price momentum factor
    if (insights.priceChangePercent24h > 20) upProbability += 0.2; // Strong bullish
    else if (insights.priceChangePercent24h > 10) upProbability += 0.15; // Bullish
    else if (insights.priceChangePercent24h > 5) upProbability += 0.1; // Slightly bullish
    else if (insights.priceChangePercent24h < -20) upProbability -= 0.2; // Strong bearish
    else if (insights.priceChangePercent24h < -10) upProbability -= 0.15; // Bearish
    else if (insights.priceChangePercent24h < -5) upProbability -= 0.1; // Slightly bearish

    // Volume momentum factor
    if (insights.buyVolume && insights.sellVolume) {
      const buyRatio = insights.buyVolume / (insights.buyVolume + insights.sellVolume);
      if (buyRatio > 0.6) upProbability += 0.1; // More buying pressure
      else if (buyRatio < 0.4) upProbability -= 0.1; // More selling pressure
    }

    // Market cap momentum (growing market cap = positive)
    if (insights.marketCap > 1000000) upProbability += 0.05; // Established market

    // Liquidity factor
    const liquidityRatio = insights.liquidity / insights.marketCap;
    if (liquidityRatio > 0.1) upProbability += 0.05; // Good liquidity

    // Age factor (survival = positive)
    if (insights.age && insights.age > 24) upProbability += 0.05; // Survived 24+ hours

    return {
      up: Math.min(0.9, Math.max(0.1, upProbability)),
      down: Math.min(0.9, Math.max(0.1, 1 - upProbability))
    };
  }

  /**
   * Analyze momentum patterns
   */
  private static analyzeMomentum(insights: MarketInsights): QuantumForecast['momentum'] {
    // Price momentum
    let priceMomentum: QuantumForecast['momentum']['priceMomentum'] = 'Neutral';
    if (insights.priceChangePercent24h > 20) priceMomentum = 'Strong Bullish';
    else if (insights.priceChangePercent24h > 10) priceMomentum = 'Bullish';
    else if (insights.priceChangePercent24h < -20) priceMomentum = 'Strong Bearish';
    else if (insights.priceChangePercent24h < -10) priceMomentum = 'Bearish';

    // Volume momentum
    let volumeMomentum: QuantumForecast['momentum']['volumeMomentum'] = 'Stable';
    const volumeRatio = insights.volume24h / insights.marketCap;
    if (volumeRatio > 0.3) volumeMomentum = 'Accelerating';
    else if (volumeRatio < 0.05) volumeMomentum = 'Declining';

    // Acceleration
    let acceleration: QuantumForecast['momentum']['acceleration'] = 'Moderate';
    const volatility = Math.abs(insights.priceChangePercent24h);
    if (volatility > 30) acceleration = 'Rapid';
    else if (volatility < 5) acceleration = 'Slow';
    else if (volatility < 2) acceleration = 'Stagnant';

    // Heating/Cooling
    let heatingCooling: QuantumForecast['momentum']['heatingCooling'] = 'Warm';
    if (volumeRatio > 0.5 && volatility > 20) heatingCooling = 'Hot';
    else if (volumeRatio < 0.1 && volatility < 5) heatingCooling = 'Cool';
    else if (volumeRatio < 0.05 && volatility < 2) heatingCooling = 'Cold';

    return {
      priceMomentum,
      volumeMomentum,
      acceleration,
      heatingCooling
    };
  }

  /**
   * Generate market signals
   */
  private static generateSignals(insights: MarketInsights): string[] {
    const signals: string[] = [];

    // Price signals
    if (insights.priceChangePercent24h > 20) {
      signals.push('🚀 Strong bullish momentum detected');
    } else if (insights.priceChangePercent24h > 10) {
      signals.push('📈 Bullish price action');
    } else if (insights.priceChangePercent24h < -20) {
      signals.push('📉 Strong bearish momentum');
    } else if (insights.priceChangePercent24h < -10) {
      signals.push('🔻 Bearish price action');
    }

    // Volume signals
    const volumeRatio = insights.volume24h / insights.marketCap;
    if (volumeRatio > 0.5) {
      signals.push('🔥 High volume activity');
    } else if (volumeRatio < 0.05) {
      signals.push('❄️ Low volume - potential consolidation');
    }

    // Liquidity signals
    const liquidityRatio = insights.liquidity / insights.marketCap;
    if (liquidityRatio > 0.15) {
      signals.push('💧 Strong liquidity depth');
    } else if (liquidityRatio < 0.05) {
      signals.push('⚠️ Low liquidity - higher volatility expected');
    }

    // Market cap signals
    if (insights.marketCap > 10000000) {
      signals.push('🏛️ Established market cap');
    } else if (insights.marketCap < 100000) {
      signals.push('🌱 Early stage token');
    }

    // Age signals
    if (insights.age) {
      if (insights.age > 168) {
        signals.push('⏰ Mature token (1+ weeks)');
      } else if (insights.age < 1) {
        signals.push('🆕 Very new token (< 1 hour)');
      }
    }

    // Holder signals
    if (insights.holderCount && insights.topHolderPercentage) {
      if (insights.holderCount > 1000 && insights.topHolderPercentage < 20) {
        signals.push('👥 Good holder distribution');
      } else if (insights.topHolderPercentage > 50) {
        signals.push('⚠️ High holder concentration risk');
      }
    }

    // Dev holding signals
    if (insights.devHolding) {
      if (insights.devHolding < 5) {
        signals.push('✅ Low dev holding risk');
      } else if (insights.devHolding > 20) {
        signals.push('🚨 High dev holding risk');
      }
    }

    return signals;
  }

  /**
   * Assess risk level
   */
  private static assessRiskLevel(insights: MarketInsights): QuantumForecast['riskLevel'] {
    let riskScore = 0;

    // Market cap risk
    if (insights.marketCap < 100000) riskScore += 3; // Very high risk
    else if (insights.marketCap < 1000000) riskScore += 2; // High risk
    else if (insights.marketCap < 10000000) riskScore += 1; // Medium risk

    // Liquidity risk
    const liquidityRatio = insights.liquidity / insights.marketCap;
    if (liquidityRatio < 0.05) riskScore += 2; // High risk
    else if (liquidityRatio < 0.1) riskScore += 1; // Medium risk

    // Volatility risk
    const volatility = Math.abs(insights.priceChangePercent24h);
    if (volatility > 50) riskScore += 2; // High risk
    else if (volatility > 20) riskScore += 1; // Medium risk

    // Age risk
    if (insights.age && insights.age < 1) riskScore += 2; // Very new
    else if (insights.age && insights.age < 24) riskScore += 1; // New

    // Holder concentration risk
    if (insights.topHolderPercentage && insights.topHolderPercentage > 50) riskScore += 2;
    else if (insights.topHolderPercentage && insights.topHolderPercentage > 30) riskScore += 1;

    // Dev holding risk
    if (insights.devHolding && insights.devHolding > 20) riskScore += 2;
    else if (insights.devHolding && insights.devHolding > 10) riskScore += 1;

    if (riskScore >= 6) return 'Extreme';
    if (riskScore >= 4) return 'High';
    if (riskScore >= 2) return 'Medium';
    return 'Low';
  }

  /**
   * Determine time horizon
   */
  private static determineTimeHorizon(insights: MarketInsights): QuantumForecast['timeHorizon'] {
    // Based on market stability and age
    const volatility = Math.abs(insights.priceChangePercent24h);
    const volumeRatio = insights.volume24h / insights.marketCap;
    const liquidityRatio = insights.liquidity / insights.marketCap;

    // High volatility + low liquidity = short term only
    if (volatility > 30 && liquidityRatio < 0.1) return 'Short';
    
    // Established market with good liquidity = longer term
    if (insights.marketCap > 10000000 && liquidityRatio > 0.1 && volatility < 20) return 'Long';
    
    // Medium conditions = medium term
    return 'Medium';
  }
}
