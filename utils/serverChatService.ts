interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TokenData {
  id: number;
  name?: string;
  symbol?: string;
  mint: string;
  status?: string;
  price_usd?: number;
  marketcap?: number;
  created_at?: string;
}

class ServerChatService {
  private serverUrl: string;

  constructor() {
    // Use environment variable for server URL, fallback to Railway for production
    this.serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
  }

  async analyzeToken(
    tokenData: TokenData,
    companionName: string,
    userMessage: string
  ): Promise<string> {
    try {
      console.log(`🤖 Analyzing token ${tokenData.mint} with ${companionName}...`);
      
      const response = await fetch(`${this.serverUrl}/api/grok/analyze/${tokenData.mint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companionName,
          userMessage,
          tokenData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error:', response.status, response.statusText, errorText);
        throw new Error(`Server API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Server Response:', data);
      
      return data.analysis || 'No analysis available';
    } catch (error) {
      console.error('❌ Server chat service error:', error);
      throw error;
    }
  }

  async chatWithCompanion(
    mint: string,
    companionName: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    try {
      console.log(`💬 Chatting with ${companionName} about token ${mint}...`);
      
      const response = await fetch(`${this.serverUrl}/api/grok/chat/${mint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companionName,
          conversationHistory,
          userMessage
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error:', response.status, response.statusText, errorText);
        throw new Error(`Server API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Server Response:', data);
      
      return data.response || 'No response available';
    } catch (error) {
      console.error('❌ Server chat service error:', error);
      throw error;
    }
  }

  async generalChat(
    companionName: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    try {
      console.log(`💬 General chat with ${companionName}...`);
      
      const response = await fetch(`${this.serverUrl}/api/grok/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companionName,
          conversationHistory,
          userMessage
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server API Error:', response.status, response.statusText, errorText);
        throw new Error(`Server API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Server Response:', data);
      
      return data.response || 'No response available';
    } catch (error) {
      console.error('❌ Server chat service error:', error);
      throw error;
    }
  }
}

export const serverChatService = new ServerChatService();
export type { ChatMessage, TokenData };
