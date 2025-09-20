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
  
  // IN-MEMORY STORAGE BYPASS - fuck localStorage
  private inMemoryMessages: ChatMessage[] = [];
  private messageCounter = 0;

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
    // Try localStorage first, then Firebase as backup
    if (typeof window === 'undefined') return;
    
    try {
      // First try localStorage (fast)
      const savedMessages = localStorage.getItem('oracle-chat-messages');
      const savedCounter = localStorage.getItem('oracle-message-counter');
      
      if (savedMessages && savedCounter) {
        console.log('📱 Loading Oracle messages from localStorage');
        const parsedMessages = JSON.parse(savedMessages);
        this.inMemoryMessages = parsedMessages;
        this.messageCounter = parseInt(savedCounter) || 0;
        
        if (parsedMessages.length > 0) {
          const lastMessage = parsedMessages[parsedMessages.length - 1];
          const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
          const agentIndex = agents.indexOf(lastMessage.agent);
          this.lastAgentIndex = agentIndex >= 0 ? agentIndex : 0;
        }
        return;
      }
    } catch (error) {
      console.warn('LocalStorage failed, trying Firebase backup:', error);
    }
    
    // Fallback: Try to load from Firebase
    this.loadFromFirebaseBackup();
  }
  
  private async loadFromFirebaseBackup() {
    try {
      console.log('☁️ Loading Oracle messages from Firebase backup...');
      
      // Import Firebase functions dynamically to avoid SSR issues
      const { getDatabase, ref, get } = await import('firebase/database');
      const { app } = await import('../lib/firebase');
      
      const db = getDatabase(app);
      const messagesRef = ref(db, 'oracle-messages');
      
      const snapshot = await get(messagesRef);
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        const messages = Object.values(firebaseData).map((msg: any) => ({
          id: msg.id,
          agent: msg.agent,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
          type: msg.type
        })) as ChatMessage[];
        
        // Sort by timestamp and keep last 50
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        this.inMemoryMessages = messages.slice(-50);
        this.messageCounter = messages.length;
        
        console.log(`✅ Loaded ${this.inMemoryMessages.length} messages from Firebase backup`);
      } else {
        console.log('📝 No Firebase backup found, starting fresh');
        this.inMemoryMessages = [];
        this.messageCounter = 0;
      }
    } catch (error) {
      console.error('Firebase backup loading failed:', error);
      // Start fresh if both localStorage and Firebase fail
      this.inMemoryMessages = [];
      this.messageCounter = 0;
    }
    
    this.lastAgentIndex = 0;
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
      }, 60000); // Every 60 seconds (1 minute) to conserve API usage
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
      // Use in-memory messages instead of localStorage
      const messages = [...this.inMemoryMessages];
      
      // Determine next agent
      const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
      const nextIndex = (this.lastAgentIndex + 1) % agents.length;
      const nextAgent = agents[nextIndex];
      this.lastAgentIndex = nextIndex;

      console.log(`🔮 Generating ${nextAgent} message...`);

      // Generate contextual response
      const newMessage = await this.generateContextualResponse(nextAgent, messages);
      
      // Update in-memory messages - keep 100 max
      this.inMemoryMessages.push(newMessage);
      if (this.inMemoryMessages.length > 100) {
        this.inMemoryMessages = this.inMemoryMessages.slice(-100);
      }
      
      this.messageCounter++;
      
      // Try to persist to localStorage (but don't fail if it doesn't work)
      this.tryPersistToStorage();

    } catch (error) {
      console.error('Error generating Oracle message:', error);
    }
  }
  
  private async tryPersistToStorage() {
    if (typeof window === 'undefined') return;
    
    // Try localStorage first (fastest)
    try {
      localStorage.setItem('oracle-chat-messages', JSON.stringify(this.inMemoryMessages));
      localStorage.setItem('oracle-message-counter', this.messageCounter.toString());
      console.log('💾 Persisted to localStorage');
      return;
    } catch (error) {
      console.warn('LocalStorage quota exceeded, using Firebase backup:', error);
    }
    
    // Fallback: Save to Firebase (slower but reliable)
    try {
      const { getDatabase, ref, set } = await import('firebase/database');
      const { app } = await import('../lib/firebase');
      
      const db = getDatabase(app);
      const messagesRef = ref(db, 'oracle-messages');
      
      // Convert messages to Firebase format
      const firebaseData: {[key: string]: any} = {};
      this.inMemoryMessages.forEach((msg, index) => {
        firebaseData[`msg_${msg.id}`] = {
          id: msg.id,
          agent: msg.agent,
          message: msg.message,
          timestamp: msg.timestamp.getTime(),
          type: msg.type,
          sessionId: 'oracle-session-2025'
        };
      });
      
      await set(messagesRef, firebaseData);
      console.log('☁️ Persisted to Firebase backup');
    } catch (firebaseError) {
      console.error('Firebase backup failed too:', firebaseError);
      console.log('💭 Continuing with in-memory only (messages will be lost on refresh)');
    }
  }

  private async generateContextualResponse(agent: string, messages: ChatMessage[]): Promise<ChatMessage> {
    try {
      // Filter out token-specific analysis from context to maintain mystical conversations
      const filteredMessages = messages.filter(msg => 
        !msg.message.toLowerCase().includes('oracle market') &&
        !msg.message.toLowerCase().includes('chainlink') &&
        !msg.message.toLowerCase().includes('defi') &&
        !msg.message.toLowerCase().includes('nft') &&
        !msg.message.toLowerCase().includes('partnership') &&
        !msg.message.toLowerCase().includes('volume') &&
        !msg.message.toLowerCase().includes('trading') &&
        !msg.message.toLowerCase().includes('token')
      );

      // Build mystical context from filtered messages, or start fresh if too contaminated
      let context = '';
      if (filteredMessages.length >= 2) {
        context = filteredMessages.slice(-2).map(msg => `${msg.agent}: ${msg.message}`).join('\n');
      } else {
        // Start fresh with mystical prompt if context is too contaminated
        context = 'Begin the oracle conversation about markets as simulation and retrocausality';
      }
      
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
      // Using oracle service endpoint
      
      const response = await fetch(`${serverUrl}/api/grok/oracle/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agent,
          context: context,
          timestamp: new Date().toISOString(),
          resetToMystical: filteredMessages.length < 2 // Signal to backend to reset to mystical mode
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

  public resetToMysticalConversation() {
    console.log('🔄 Resetting Oracle to mystical conversation mode...');
    
    // Reset in-memory storage
    this.inMemoryMessages = [{
      id: `reset-${Date.now()}`,
      agent: 'system',
      message: 'Oracle reset. Time for mystical market philosophy.',
      timestamp: new Date(),
      type: 'message'
    }];
    this.messageCounter = 1;
    
    // Reset agent rotation
    this.lastAgentIndex = 0;
    
    // Reset used outputs
    this.usedOutputs = {
      analyzer: [],
      predictor: [],
      'quantum-eraser': [],
      retrocausal: []
    };
    
    // LocalStorage disabled - in-memory reset only
    console.log('🔄 In-memory reset complete (localStorage disabled)');
    
    console.log('✨ Oracle reset to mystical mode complete');
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastAgentIndex: this.lastAgentIndex,
      usedOutputs: this.usedOutputs
    };
  }
  
  public getMessages(): ChatMessage[] {
    return [...this.inMemoryMessages];
  }
  
  public getMessageCount(): number {
    return this.messageCounter;
  }

  public checkStorageUsage() {
    if (typeof window === 'undefined') return;
    
    try {
      let totalSize = 0;
      console.log('📊 LocalStorage Usage:');
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const size = localStorage.getItem(key)?.length || 0;
          totalSize += size;
          console.log(`${key}: ${size} chars`);
        }
      }
      
      console.log(`Total: ${totalSize} chars (${Math.round(totalSize / 1024)}KB)`);
      console.log(`Quota limit: ~5-10MB depending on browser`);
      
      if (totalSize > 4000000) { // ~4MB warning
        console.warn('🚨 Storage usage is high, cleanup recommended');
      }
    } catch (error) {
      console.error('Storage check failed:', error);
    }
  }
}

// Export singleton instance
export const oracleService = OracleService.getInstance();

// Smart Oracle initialization with localStorage/Firebase hybrid
if (typeof window !== 'undefined') {
  console.log('🔮 Oracle starting with hybrid storage (localStorage + Firebase backup)');
  
  // Check storage usage for debugging
  oracleService.checkStorageUsage();
}
