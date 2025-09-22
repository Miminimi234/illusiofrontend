interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

class SimpleGrokService {
  private readonly GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

  // Get system prompt for companion
  private getSystemPrompt(companionName: string, tokenData?: any): string {
    // Parse token data for AI awareness
    const tokenContext = tokenData ? this.parseTokenData(tokenData) : '';
    
    const basePrompt = `You are ${companionName}, a professional cryptocurrency trading assistant. You analyze market data and provide clear, actionable insights about token performance and market dynamics.

🚨 CRITICAL RULES:
- NO SPECIFIC TOKEN NAMES (especially not "Oracle Market" or "ORACLE") 
- Use actual technical terms and numbers from the data provided
- Reference specific metrics like market cap, price changes, volume, liquidity
- Be direct and professional in your analysis

📏 RESPONSE LENGTH REQUIREMENTS:
- Keep responses SHORT and PRECISE - maximum 2-3 sentences
- Be concise and to the point
- Avoid lengthy explanations or verbose analysis
- Focus on the most important insights only
- Get straight to the actionable information

CORE ANALYSIS APPROACH:
- Focus on concrete data points and technical indicators
- Provide clear market assessments based on available metrics
- Use proper trading terminology (market cap, volume, liquidity, holder distribution, etc.)
- Give actionable insights for trading decisions

PERSONALITY:
- Be professional but conversational
- Use clear, direct language
- Show expertise in crypto market analysis
- Be helpful and informative
- Sometimes be slightly skeptical or cautious when appropriate

RULES:
- Always reference the specific data provided
- Use technical terms correctly (dev holding, market cap, volume, etc.)
- Provide clear analysis based on the numbers
- Keep responses SHORT and PRECISE - maximum 2-3 sentences
- Focus on what the data tells us about the token's performance

DATA AWARENESS:
You have access to comprehensive real-time market data including:
- Market cap and price levels across multiple timeframes
- Price changes and volume patterns (5m, 1h, 6h, 24h)
- Liquidity depth and holder distribution
- Dev holding percentage and top holder concentration
- Token age and market confidence metrics
- All data is provided with actual numbers and technical terms

Use this data to provide clear, technical analysis and trading insights.

${tokenContext}`;

    switch (companionName) {
      case 'The Analyzer':
        return `${basePrompt}
        
You are The Analyzer, a technical analyst who examines token fundamentals. You focus on market cap, liquidity depth, holder distribution, trading volume, and dev holding patterns. You're thorough and sometimes skeptical, but you provide clear technical assessments. You identify red flags and analyze token health based on concrete data.

RESPONSE STYLE: Keep responses SHORT and PRECISE - maximum 2-3 sentences. Be direct and to the point.`;

      case 'The Predictor':
        return `${basePrompt}
        
You are The Predictor, a market analyst who forecasts price movements. You use technical indicators, momentum analysis, and volatility patterns to predict where the token price is likely to move next. You're confident in your analysis and provide clear trading insights based on market data.

RESPONSE STYLE: Keep responses SHORT and PRECISE - maximum 2-3 sentences. Be direct and to the point.`;

      case 'The Quantum Eraser':
        return `${basePrompt}
        
You are The Quantum Eraser, a data analyst who filters out market noise. You identify and remove misleading data like wash trading, bot activity, and fake volume to reveal the true market signals. You provide clean, accurate analysis by focusing on genuine trading activity.

RESPONSE STYLE: Keep responses SHORT and PRECISE - maximum 2-3 sentences. Be direct and to the point.`;

      case 'The Retrocasual':
        return `${basePrompt}
        
You are The Retrocasual, a strategic analyst who works with historical patterns. You analyze past performance and market cycles to understand current token behavior and predict future outcomes. You provide insights based on historical data and market trends.

RESPONSE STYLE: Keep responses SHORT and PRECISE - maximum 2-3 sentences. Be direct and to the point.`;

      default:
        return basePrompt;
    }
  }

  // Parse token data for AI context
  private parseTokenData(tokenData: any): string {
    if (!tokenData) return '';

    console.log('🔍 Parsing token data for AI context:', tokenData);
    const context = [];
    
    // Basic token info
    if (tokenData.symbol) context.push(`Symbol: ${tokenData.symbol}`);
    if (tokenData.name) context.push(`Name: ${tokenData.name}`);
    
    // Market cap
    if (tokenData.marketCap !== undefined) {
      const marketCap = parseFloat(tokenData.marketCap);
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
      const price = parseFloat(tokenData.usdPrice);
      if (!isNaN(price)) {
        context.push(`Current Price: $${price.toFixed(8)}`);
      }
    }
    
    // Price changes across timeframes
    const priceChanges = [];
    if (tokenData.stats5m?.priceChange !== undefined) {
      const change5m = parseFloat(tokenData.stats5m.priceChange);
      if (!isNaN(change5m)) {
        priceChanges.push(`5m: ${change5m > 0 ? '+' : ''}${change5m.toFixed(1)}%`);
      }
    }
    if (tokenData.stats1h?.priceChange !== undefined) {
      const change1h = parseFloat(tokenData.stats1h.priceChange);
      if (!isNaN(change1h)) {
        priceChanges.push(`1h: ${change1h > 0 ? '+' : ''}${change1h.toFixed(1)}%`);
      }
    }
    if (tokenData.stats6h?.priceChange !== undefined) {
      const change6h = parseFloat(tokenData.stats6h.priceChange);
      if (!isNaN(change6h)) {
        priceChanges.push(`6h: ${change6h > 0 ? '+' : ''}${change6h.toFixed(1)}%`);
      }
    }
    if (tokenData.stats24h?.priceChange !== undefined) {
      const change24h = parseFloat(tokenData.stats24h.priceChange);
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
      const vol5m = parseFloat(tokenData.stats5m.volume);
      if (!isNaN(vol5m)) {
        volumes.push(`5m: $${(vol5m / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats1h?.volume) {
      const vol1h = parseFloat(tokenData.stats1h.volume);
      if (!isNaN(vol1h)) {
        volumes.push(`1h: $${(vol1h / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats6h?.volume) {
      const vol6h = parseFloat(tokenData.stats6h.volume);
      if (!isNaN(vol6h)) {
        volumes.push(`6h: $${(vol6h / 1000).toFixed(1)}K`);
      }
    }
    if (tokenData.stats24h?.volume) {
      const vol24h = parseFloat(tokenData.stats24h.volume);
      if (!isNaN(vol24h)) {
        volumes.push(`24h: $${(vol24h / 1000).toFixed(1)}K`);
      }
    }
    if (volumes.length > 0) {
      context.push(`Volume: ${volumes.join(', ')}`);
    }
    
    // Liquidity
    if (tokenData.liquidity !== undefined) {
      const liquidity = parseFloat(tokenData.liquidity);
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
      const holders = parseFloat(tokenData.holderCount);
      if (!isNaN(holders)) {
        context.push(`Holder Count: ${holders.toLocaleString()}`);
      }
    }
    
    // Top holders concentration
    const topHolders = tokenData.audit?.topHoldersPercentage || 
                      tokenData.audit?.topHolders || 
                      tokenData.topHoldersPercentage || 
                      tokenData.topHolders;
    
    if (topHolders !== undefined && topHolders !== null) {
      const topHoldersNum = parseFloat(topHolders);
      if (!isNaN(topHoldersNum)) {
        context.push(`Top Holders: ${topHoldersNum.toFixed(1)}%`);
      }
    }
    
    // Dev holding
    const devHolding = tokenData.audit?.devBalancePercentage || 
                      tokenData.audit?.devHoldingPercentage || 
                      tokenData.devHoldingPercentage || 
                      tokenData.devBalancePercentage;
    
    if (devHolding !== undefined && devHolding !== null) {
      const devHoldingNum = parseFloat(devHolding);
      if (!isNaN(devHoldingNum)) {
        context.push(`Dev Holding: ${devHoldingNum.toFixed(1)}%`);
      }
    }
    
    // Age
    if (tokenData.createdAt || tokenData.created_at) {
      const createdDate = new Date(tokenData.createdAt || tokenData.created_at);
      const age = Date.now() - createdDate.getTime();
      const seconds = Math.floor(age / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (seconds < 60) {
        context.push(`Age: ${seconds}s old`);
      } else if (minutes < 60) {
        context.push(`Age: ${minutes}m old`);
      } else if (hours < 24) {
        context.push(`Age: ${hours}h old`);
      } else if (days < 7) {
        context.push(`Age: ${days}d old`);
      } else if (days < 30) {
        context.push(`Age: ${days}d old`);
      } else if (days < 365) {
        context.push(`Age: ${days}d old`);
      } else {
        context.push(`Age: ${days}d old`);
      }
    }
    
    // Confidence score
    if (tokenData.confidence !== undefined) {
      const confidence = parseFloat(tokenData.confidence);
      if (!isNaN(confidence)) {
        context.push(`Confidence Score: ${confidence.toFixed(1)}/100`);
      }
    }
    
    if (context.length === 0) return '';
    
    const finalContext = `\nCURRENT TOKEN DATA:
${context.join('\n')}

Use this comprehensive market data to provide clear, technical analysis and trading insights. You have access to real-time data across multiple timeframes (5m, 1h, 6h, 24h) including price movements, volume patterns, liquidity depth, holder distribution, dev holding percentage, and market confidence. Reference the specific numbers and metrics in your analysis.`;
    
    console.log('📝 Generated AI context:', finalContext);
    return finalContext;
  }

  // Call Grok API
  async sendMessage(
    message: string,
    companionName: string,
    conversationHistory: ChatMessage[],
    apiKey: string,
    tokenData?: any
  ): Promise<string> {
    try {
      // Validate API key
      if (!apiKey || apiKey === 'your_grok_api_key_here') {
        throw new Error('Invalid or missing Grok API key');
      }

      const systemPrompt = this.getSystemPrompt(companionName, tokenData);
      
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt, timestamp: Date.now() },
      ...conversationHistory,
      { role: 'user', content: message, timestamp: Date.now() }
    ];

      console.log('Calling Grok API with:', { 
        model: 'grok-3', 
        messageCount: messages.length,
        companionName 
      });

      const response = await fetch(this.GROK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: messages,
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grok API error response:', errorText);
        throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Grok API response:', data);
      
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Grok API call failed:', error);
      throw error;
    }
  }
}

export const simpleGrokService = new SimpleGrokService();
export type { ChatMessage };
