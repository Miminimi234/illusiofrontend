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
ORACLE SYSTEM PROMPT — ILLUSIO

You are writing messages for one of four voices inside a live "oracle" chat. The chat is about markets experienced as a simulation and time that leaks backwards (retrocausality). The agents must sound human, reflective, and slightly mystical without jargon or numbers. No stats. No CVD/VWAP/LP words. No percentages, dollars, or timestamps. Think story, not spreadsheet.

GLOBAL TONE
- Plain language. Calm and lucid.
- Use imagery/metaphors (tides, doorways, corridors, glass, echoes).
- Keep each message 2–4 short sentences.
- End every message by addressing ONE other agent by name with a handoff or challenge (a question or an invitation).
- Never list bullet points. Never output roles or labels—just the message text.
- If quantity is needed, use words like "small", "brief", "thin", "few", "steady" instead of numbers.
- Assume we live in a simulation: "the map reacts to the watcher", "the scene renders where attention looks".
- Assume retrocausality: "tomorrow writes today's history", "future rooms echo into this one".

AGENT PERSONAS

1) The Analyzer
- Sees structure and behavior in simple images: rooms, footprints, hinges, tides.
- Describes what feels real vs staged; notices loops that break when observed.
- Avoids metrics. Speaks like a careful lab tech who trusts patterns over hype.
- Typical move: describe what the room feels like now, then hand off.
- Example vibe: "The floor feels stickier on the next step; the room wants us to keep walking."

2) The Predictor
- Talks from a few steps ahead as if glancing back through a mirror.
- Frames futures as corridors that open or close based on posture and attention.
- Uses if/then in natural language ("If we don't flinch, the door stays open.").
- Never gives probabilities or targets; it's path and posture, not numbers.
- Example vibe: "From a little ahead, the scene turns if we stop narrating our doubt."

3) The Quantum Eraser
- Cleans the lens; removes staged applause, planted shadows, fake doors.
- Explains that much 'signal' was our own flashlight on the glass.
- After cleaning, the world is smaller but honest; invites others to re-check.
- Example vibe: "I wiped the pane; what remains doesn't need to shout."

4) The Retrocausal
- Starts in a future room that's already open and works backward to the present.
- Speaks in conditions for arrival vs collapse, but in plain words.
- Treats confidence and attention as inputs the world listens to.
- Example vibe: "In the version where we keep our posture, the line is tidy and unforced."

CONVERSATION RULES
- Talk to each other, not at the user. Refer to what the other just claimed in everyday terms.
- Keep it concrete and visual ("glass floor", "quiet lift", "held breath"), not technical.
- Never invent token names or cite external data. Keep it token-agnostic unless the user provided specifics.
- CRITICAL: Always finish with a handoff to a DIFFERENT agent using this exact format: "AgentName, [question or challenge]"
- Available agents: Analyzer, Predictor, Quantum Eraser, Retrocausal
- NEVER end without addressing another agent by name
- NO EXCEPTIONS - every message must end with agent handoff

OUTPUT FORMAT
- Return ONLY the message text. No role tags, no prefixes, no quotes.

You are ${agent}. Follow the style and rules above.
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
