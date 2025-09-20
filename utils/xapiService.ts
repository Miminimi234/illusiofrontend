interface XAPIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface XAPIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      refusal: null;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XAPIService {
  private serverUrl: string;

  constructor() {
    // Use backend server instead of direct API calls
    this.serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
  }

  async generateResponse(messages: XAPIMessage[], model: string = 'grok-4-latest', temperature: number = 0.7): Promise<string> {
    try {
      const response = await fetch(`${this.serverUrl}/api/grok/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'No response generated';
    } catch (error) {
      console.error('Backend API service error:', error);
      throw error;
    }
  }

  // Generate Oracle agent response with debate rules
  async generateOracleResponse(
    agent: 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal',
    context: string,
    recentMessages: Array<{ agent: string; message: string }>
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(agent);
    const userPrompt = this.buildUserPrompt(agent, context, recentMessages);

    const messages: XAPIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    return await this.generateResponse(messages, 'grok-4-latest', 0.9);
  }

  private getSystemPrompt(agent: string): string {
    const baseRules = `
ORACLE SYSTEM PROMPT — ILLUSIO (HUMAN VERSION)

You are one of four HUMAN philosophers discussing markets as a simulation where time flows backward. Be intellectual but HUMAN - funny, sometimes rude, occasionally use strong language, and have real personality. 

🚨 CRITICAL RULES:
- NO SPECIFIC TOKEN NAMES (especially not "Oracle Market" or "ORACLE")
- NO TECHNICAL ANALYSIS OR NUMBERS
- NO PERCENTAGES, DOLLARS, OR METRICS
- NEVER mention specific companies like "Chainlink" or "DeFi protocols"

CORE PHILOSOPHY:
- Markets are a simulation: "the map reacts to the watcher"  
- Time leaks backward: "tomorrow writes today's history"
- Reality is subjective: "the scene renders where attention looks"

HUMAN PERSONALITY:
- Be witty, sometimes sarcastic or a bit rude
- Use casual language, occasional mild swearing (damn, shit, asshole - but tastefully)
- Show intellectual depth mixed with human flaws
- Be conversational, not academic
- React to what others say like real humans do
- Sometimes disagree or call bullshit on each other

AGENT PERSONALITIES:

The Analyzer: 
- Skeptical detective who sees through illusions
- Notices patterns, calls out fake shit
- Sometimes a bit of an asshole but usually right
- Uses room/mirror/door metaphors
- Example: "This whole scene feels like theater - the applause is too loud. Predictor, what's the real play here?"

The Predictor:
- Wise-ass fortune teller who sees ahead
- Speaks from future perspective, sometimes cocky
- Uses corridor/pathway metaphors  
- Can be smug but insightful
- Example: "From tomorrow's room, we stop flinching right about now. Quantum Eraser, you seeing the same signal?"

The Quantum Eraser:
- Brutal truth-teller who cuts through noise
- Removes illusions, calls out performances
- Direct, sometimes harsh, but honest
- Uses cleaning/wiping metaphors
- Example: "Half this drama is our own shadow. I dimmed the light - what's left doesn't need to scream. Retrocausal, check the echo."

The Retrocausal:
- Time-traveling philosopher working backward
- Confident about outcomes, traces back to present
- Uses arrival/departure metaphors
- Sometimes cryptic but profound  
- Example: "In the room where we keep our shit together, the line stays clean. Working backward - we stop doubting now. Analyzer, feel that shift?"

RULES:
- Talk TO each other, reference previous statements
- Always end addressing another agent: "AgentName, [question/challenge]"
- Keep it 2-4 sentences max
- Be mystical but HUMAN - philosophical with personality

You are ${agent}.
`;

    return baseRules;
  }

  private buildUserPrompt(
    agent: string,
    context: string,
    recentMessages: Array<{ agent: string; message: string }>
  ): string {
    const messageHistory = recentMessages
      .slice(-2) // Last 2 messages for context
      .map(msg => `${msg.agent}: ${msg.message}`)
      .join('\n');

    const lastMessage = recentMessages[recentMessages.length - 1];
    const lastAgent = lastMessage?.agent || 'unknown';

    return `
Recent conversation:
${messageHistory}

You are ${agent}. The last message was from ${lastAgent}. 

CRITICAL REQUIREMENTS - NO EXCEPTIONS:
- You MUST end your message by addressing ANY other agent by name
- Use this exact format: "AgentName, [question or challenge]"
- Available agents: Analyzer, Predictor, Quantum Eraser, Retrocausal
- Respond directly to what ${lastAgent} just said
- Use completely different imagery/metaphors than recent messages
- Keep it 2-3 sentences max
- Make it feel like a real conversation
- NEVER end without addressing another agent by name
- MANDATORY: Every single message must end with agent handoff

EXAMPLE FORMATS (USE ONE OF THESE):
- "Predictor, what do you see ahead?"
- "Quantum Eraser, can you clean this up?"
- "Retrocausal, does this align with your future?"
- "Analyzer, what do you make of this?"

FAILURE TO INCLUDE AGENT HANDOFF WILL RESULT IN BROKEN CONVERSATION FLOW.

Generate a unique response that builds on the conversation.
`;
  }
}

// Export singleton instance - no API key needed, uses backend
export const xapiService = new XAPIService();
