interface SportsFixture {
  id: string;
  name: string;
  league: string;
  status: 'Upcoming' | 'Live' | 'Ended';
  finalScore?: string | null;
  currentScore?: string | null;
  scheduledTime: string;
  clock?: string;
  venue?: string;
  referee?: string | null;
  keyPlayers?: string[] | null;
  periodScores?: string[] | null;
  cards?: string[] | null;
  createdAt: string;
  updatedAt: string;
  mint: string;
  [key: string]: any;
}

interface SportsPredictionData {
  gameStatus: 'upcoming' | 'live' | 'ended';
  matchPrediction?: {
    homeWin: number; // 0-100
    draw: number; // 0-100
    awayWin: number; // 0-100
    confidence: number; // 0-100
  };
  bettingPrediction?: {
    recommendedBet: string;
    odds: string;
    confidence: number; // 0-100
    reasoning: string;
  };
  analysis: {
    keyFactors: string[];
    prediction: string;
    confidence: number; // 0-100
    reasoning: string;
  };
  scorePrediction?: {
    homeScore: number;
    awayScore: number;
    confidence: number;
  };
  gameSummary?: {
    performance: string;
    keyMoments: string[];
    standoutPlayers: string[];
    overallAssessment: string;
  };
}

class SportsPredictionService {
  private readonly GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

  private parseSportsData(fixture: SportsFixture): string {
    const context: string[] = [];
    
    // Basic match info
    context.push(`MATCH: ${fixture.name}`);
    context.push(`LEAGUE: ${fixture.league}`);
    context.push(`STATUS: ${fixture.status}`);
    
    // Venue and timing
    if (fixture.venue) context.push(`VENUE: ${fixture.venue}`);
    if (fixture.scheduledTime) context.push(`SCHEDULED: ${fixture.scheduledTime}`);
    if (fixture.clock) context.push(`CLOCK: ${fixture.clock}`);
    
    // Scores
    if (fixture.currentScore) context.push(`CURRENT SCORE: ${fixture.currentScore}`);
    if (fixture.finalScore) context.push(`FINAL SCORE: ${fixture.finalScore}`);
    
    // Additional details
    if (fixture.referee) context.push(`REFEREE: ${fixture.referee}`);
    if (fixture.keyPlayers && fixture.keyPlayers.length > 0) {
      context.push(`KEY PLAYERS: ${fixture.keyPlayers.join(', ')}`);
    }
    if (fixture.periodScores && fixture.periodScores.length > 0) {
      context.push(`PERIOD SCORES: ${fixture.periodScores.join(', ')}`);
    }
    if (fixture.cards && fixture.cards.length > 0) {
      context.push(`CARDS: ${fixture.cards.join(', ')}`);
    }
    
    // Timestamps
    context.push(`CREATED: ${fixture.createdAt}`);
    context.push(`UPDATED: ${fixture.updatedAt}`);
    
    return `\nSPORTS FIXTURE DATA FOR ANALYSIS:
${context.join('\n')}`;
  }

  // Get AI prediction from Grok
  async getSportsPrediction(fixture: SportsFixture, apiKey: string): Promise<SportsPredictionData> {
    try {
      // Validate API key
      if (!apiKey || apiKey === 'your_grok_api_key_here') {
        throw new Error('Invalid or missing Grok API key');
      }

      const sportsContext = this.parseSportsData(fixture);
      
      const systemPrompt = `You are a professional sports analyst and betting expert specializing in match predictions and analysis. Analyze the provided sports fixture data and generate comprehensive predictions or summaries based on the game status.

CRITICAL REQUIREMENTS:
- Return ONLY a valid JSON object with this exact structure:

FOR UPCOMING GAMES:
{
  "gameStatus": "upcoming",
  "matchPrediction": {
    "homeWin": number, // 0-100 percentage
    "draw": number, // 0-100 percentage  
    "awayWin": number, // 0-100 percentage
    "confidence": number // 0-100 overall confidence
  },
  "bettingPrediction": {
    "recommendedBet": string, // e.g., "Home Win", "Over 2.5 Goals", "Both Teams to Score"
    "odds": string, // e.g., "1.85", "2.10", "1.45"
    "confidence": number, // 0-100 confidence in this bet
    "reasoning": string // Brief explanation of why this bet is recommended
  },
  "analysis": {
    "keyFactors": string[], // Array of 3-5 key factors affecting the match
    "prediction": string, // Overall match prediction summary
    "confidence": number, // 0-100 confidence in overall prediction
    "reasoning": string // Detailed reasoning for the prediction
  },
  "scorePrediction": {
    "homeScore": number, // Predicted home team score
    "awayScore": number, // Predicted away team score
    "confidence": number // 0-100 confidence in score prediction
  }
}

FOR LIVE GAMES:
{
  "gameStatus": "live",
  "matchPrediction": {
    "homeWin": number, // 0-100 percentage (based on current state)
    "draw": number, // 0-100 percentage  
    "awayWin": number, // 0-100 percentage
    "confidence": number // 0-100 overall confidence
  },
  "bettingPrediction": {
    "recommendedBet": string, // e.g., "Home Win", "Over 2.5 Goals", "Both Teams to Score"
    "odds": string, // e.g., "1.85", "2.10", "1.45"
    "confidence": number, // 0-100 confidence in this bet
    "reasoning": string // Brief explanation considering current match state
  },
  "analysis": {
    "keyFactors": string[], // Array of 3-5 key factors affecting the match
    "prediction": string, // Overall match prediction summary considering current state
    "confidence": number, // 0-100 confidence in overall prediction
    "reasoning": string // Detailed reasoning for the prediction
  },
  "scorePrediction": {
    "homeScore": number, // Predicted final home team score
    "awayScore": number, // Predicted final away team score
    "confidence": number // 0-100 confidence in score prediction
  }
}

FOR ENDED GAMES:
{
  "gameStatus": "ended",
  "analysis": {
    "keyFactors": string[], // Array of 3-5 key factors that influenced the match
    "prediction": string, // Summary of what happened in the match
    "confidence": number, // 0-100 confidence in the analysis
    "reasoning": string // Detailed analysis of the match outcome
  },
  "gameSummary": {
    "performance": string, // Overall performance assessment
    "keyMoments": string[], // Array of 3-5 key moments in the match
    "standoutPlayers": string[], // Array of standout players
    "overallAssessment": string // Overall match assessment
  }
}

ANALYSIS CRITERIA - SPORTS PREDICTION:

1. MATCH STATUS ANALYSIS:
- UPCOMING: Analyze team form, head-to-head, venue advantage, provide full predictions
- LIVE: Consider current score, momentum, remaining time, adjust predictions based on current state
- ENDED: Provide match summary and analysis, NO predictions (game is over)

2. GAME STATE SPECIFIC APPROACH:
- UPCOMING GAMES: Provide full match predictions, betting recommendations, and score predictions
- LIVE GAMES: Adjust predictions based on current match state, consider momentum and remaining time
- ENDED GAMES: Focus on match summary, key moments, standout players, and performance analysis

2. TEAM ANALYSIS:
- Extract team names from match name (format: "Team A vs Team B")
- Consider league context and team standings
- Analyze recent form and performance patterns
- Consider home/away advantage based on venue

3. LEAGUE CONTEXT:
- Different leagues have different playing styles
- Consider league competitiveness and scoring patterns
- Factor in league-specific trends and statistics

4. VENUE & TIMING FACTORS:
- Home advantage analysis
- Weather conditions (if available)
- Match timing and scheduling factors
- Crowd influence and atmosphere

5. SCORE ANALYSIS:
- Current score patterns for live matches
- Historical scoring patterns for teams
- League average goals per match
- Defensive vs offensive team characteristics

6. PREDICTION CONFIDENCE SCORING:
- 0-30: Very limited data, high uncertainty
- 30-50: Some data available, moderate uncertainty
- 50-70: Good data quality, reasonable confidence
- 70-90: Strong data, high confidence
- 90-100: Excellent data, very high confidence

7. BETTING RECOMMENDATIONS:
- Consider value bets based on analysis
- Factor in risk vs reward
- Provide realistic odds estimates
- Focus on most likely outcomes

8. KEY FACTORS TO CONSIDER:
- Team form and recent performance
- Head-to-head records
- Home/away advantage
- Key player availability
- League context and competitiveness
- Match importance and motivation
- Weather and venue conditions
- Referee tendencies (if available)

FOCUS ON DATA-DRIVEN ANALYSIS WITH REALISTIC CONFIDENCE LEVELS.

${sportsContext}

Provide a professional, data-driven sports analysis focusing on match outcome prediction and betting insights. Return only the JSON object.`;

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
            { role: 'user', content: 'Analyze this sports fixture and provide predictions.', timestamp: Date.now() }
          ],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grok API error response:', errorText);
        throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Grok Sports API response:', data);
      
      const content = data.choices[0]?.message?.content || '{}';
      
      // Parse the JSON response
      try {
        const prediction = JSON.parse(content);
        
        // Validate the response structure based on game status
        if (!prediction.gameStatus || !prediction.analysis) {
          throw new Error('Invalid prediction structure from AI');
        }
        
        // Validate structure based on game status
        if (prediction.gameStatus === 'upcoming' || prediction.gameStatus === 'live') {
          if (!prediction.matchPrediction || !prediction.bettingPrediction) {
            throw new Error('Invalid prediction structure for upcoming/live game');
          }
        } else if (prediction.gameStatus === 'ended') {
          if (!prediction.gameSummary) {
            throw new Error('Invalid prediction structure for ended game');
          }
        }
        
        // Ensure percentages are within bounds
        if (prediction.matchPrediction.homeWin !== undefined) {
          prediction.matchPrediction.homeWin = Math.max(0, Math.min(100, prediction.matchPrediction.homeWin));
        }
        if (prediction.matchPrediction.draw !== undefined) {
          prediction.matchPrediction.draw = Math.max(0, Math.min(100, prediction.matchPrediction.draw));
        }
        if (prediction.matchPrediction.awayWin !== undefined) {
          prediction.matchPrediction.awayWin = Math.max(0, Math.min(100, prediction.matchPrediction.awayWin));
        }
        if (prediction.matchPrediction.confidence !== undefined) {
          prediction.matchPrediction.confidence = Math.max(0, Math.min(100, prediction.matchPrediction.confidence));
        }
        if (prediction.bettingPrediction.confidence !== undefined) {
          prediction.bettingPrediction.confidence = Math.max(0, Math.min(100, prediction.bettingPrediction.confidence));
        }
        if (prediction.analysis.confidence !== undefined) {
          prediction.analysis.confidence = Math.max(0, Math.min(100, prediction.analysis.confidence));
        }
        
        return prediction as SportsPredictionData;
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid JSON response from AI');
      }
      
    } catch (error) {
      console.error('Sports Prediction service error:', error);
      throw error;
    }
  }
}

export const sportsPredictionService = new SportsPredictionService();
export type { SportsPredictionData, SportsFixture };
