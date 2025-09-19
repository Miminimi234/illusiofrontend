"use client";

interface ChatMessage {
  id: string;
  agent: 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal' | 'system';
  message: string;
  timestamp: Date;
  type: 'message' | 'analysis' | 'prediction';
}

class OracleService {
  private static instance: OracleService;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastAgentIndex = 0;
  private usedOutputs: {[key: string]: number[]} = {
    analyzer: [],
    predictor: [],
    'quantum-eraser': [],
    retrocausal: []
  };

  private constructor() {
    this.loadPersistedData();
  }

  public static getInstance(): OracleService {
    if (!OracleService.instance) {
      OracleService.instance = new OracleService();
    }
    return OracleService.instance;
  }

  private loadPersistedData() {
    // Only access localStorage on client side
    if (typeof window === 'undefined') return;
    
    try {
      const savedMessages = localStorage.getItem('oracle-chat-messages');
      const savedCounter = localStorage.getItem('oracle-message-counter');
      
      if (savedMessages && savedCounter) {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 0) {
          const lastMessage = parsedMessages[parsedMessages.length - 1];
          const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
          const agentIndex = agents.indexOf(lastMessage.agent);
          this.lastAgentIndex = agentIndex;
        }
      }
    } catch (error) {
      console.error('Error loading Oracle persisted data:', error);
    }
  }

  public startOracle() {
    if (this.isRunning) {
      console.log('Oracle is already running');
      return;
    }

    console.log('🚀 Starting Oracle service 24/7...');
    this.isRunning = true;

    // Start immediately if there are existing messages, otherwise after a short delay
    const savedMessages = localStorage.getItem('oracle-chat-messages');
    const delay = savedMessages ? 0 : 2000;

    setTimeout(() => {
      this.interval = setInterval(async () => {
        try {
          await this.generateNextMessage();
        } catch (error) {
          console.error('Error in Oracle service:', error);
        }
      }, 5000); // Every 5 seconds for 24/7 operation
    }, delay);
  }

  public stopOracle() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Oracle service stopped');
  }

  private async generateNextMessage() {
    try {
      // Get current messages
      const savedMessages = localStorage.getItem('oracle-chat-messages');
      const messages: ChatMessage[] = savedMessages ? JSON.parse(savedMessages) : [];
      
      // Determine next agent
      const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
      const nextIndex = (this.lastAgentIndex + 1) % agents.length;
      const nextAgent = agents[nextIndex];
      this.lastAgentIndex = nextIndex;

      console.log(`🎯 Oracle generating message for: ${nextAgent}`);

      // Generate contextual response
      const newMessage = await this.generateContextualResponse(nextAgent, messages);
      
      // Update messages
      const updatedMessages = [...messages, newMessage];
      const finalMessages = updatedMessages.length > 100 ? updatedMessages.slice(-100) : updatedMessages;
      
      // Save to localStorage
      localStorage.setItem('oracle-chat-messages', JSON.stringify(finalMessages));
      
      // Update counter
      const savedCounter = localStorage.getItem('oracle-message-counter');
      const counter = savedCounter ? parseInt(savedCounter) + 1 : 1;
      localStorage.setItem('oracle-message-counter', counter.toString());

      console.log(`✅ Oracle message generated and saved: ${newMessage.message.substring(0, 50)}...`);

    } catch (error) {
      console.error('Error generating Oracle message:', error);
    }
  }

  private async generateContextualResponse(agent: string, messages: ChatMessage[]): Promise<ChatMessage> {
    try {
      // Build context from recent messages
      const context = messages.slice(-3).map(msg => `${msg.agent}: ${msg.message}`).join('\n');
      
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
      console.log('🔮 Oracle Service URL:', serverUrl);
      
      const response = await fetch(`${serverUrl}/api/grok/oracle/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agent,
          context: context || 'Start the oracle conversation',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const oracleResponse = data.oracleResponse || `The ${agent} speaks from the oracle realm, contemplating the cosmic market patterns.`;

      return {
        id: `oracle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agent: agent as any,
        message: oracleResponse,
        timestamp: new Date(),
        type: 'message'
      };

    } catch (error) {
      console.error('Error generating oracle response:', error);
      return {
        id: `oracle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        agent: agent as any,
        message: `The ${agent} contemplates the cosmic market patterns from the oracle realm.`,
        timestamp: new Date(),
        type: 'message'
      };
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastAgentIndex: this.lastAgentIndex,
      usedOutputs: this.usedOutputs
    };
  }
}

// Export singleton instance
export const oracleService = OracleService.getInstance();
