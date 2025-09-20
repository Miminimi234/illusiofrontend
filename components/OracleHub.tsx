"use client";
import React, { useEffect, useState, useRef } from "react";
import { xapiService } from "@/utils/xapiService";
import { useFirebaseWebSocket } from "@/hooks/useFirebaseWebSocket";

interface OracleHubProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  agent: 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal' | 'system';
  message: string;
  timestamp: Date;
  type: 'message' | 'analysis' | 'prediction';
}

interface ArchiveEntry {
  id: string;
  date: string;
  time: string;
  messages: ChatMessage[];
  messageCount: number;
  asciiBanner?: string;
  conclusion?: string;
}

export default function OracleHub({ isOpen, onClose }: OracleHubProps) {
  const [animateIn, setAnimateIn] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageCounter, setMessageCounter] = useState(0);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(null);
  const lastAgentIndexRef = useRef(0); // Track agent rotation with ref for immediate updates
  const usedOutputsRef = useRef<{[key: string]: number[]}>({
    analyzer: [],
    predictor: [],
    'quantum-eraser': [],
    retrocausal: []
  }); // Track which outputs have been used
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Firebase connection for real-time token data
  const {
    tokens,
    connectionStatus,
    loading: firebaseLoading,
    reconnect: reconnectFirebase
  } = useFirebaseWebSocket();

  // Load archives from localStorage on mount
  useEffect(() => {
    const savedArchives = localStorage.getItem('oracle-archives');
    if (savedArchives) {
      try {
        const parsedArchives = JSON.parse(savedArchives);
        setArchives(parsedArchives);
      } catch (error) {
        console.error('Error loading archives from localStorage:', error);
      }
    }
  }, []);

  // Load chat messages and counter from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('oracle-chat-messages');
    const savedCounter = localStorage.getItem('oracle-message-counter');
    
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setChatMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading messages from localStorage:', error);
      }
    }
    
    if (savedCounter) {
      setMessageCounter(parseInt(savedCounter, 10));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the component is rendered before animating
      const id = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(id);
    } else if (isVisible) {
      // Only animate out if we were previously visible
      setAnimateIn(false);
      // Delay hiding the component until animation completes
      const timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, 700); // Match the animation duration
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isVisible]);

  // Initialize chat with persisted data or start fresh
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      // Try to load from localStorage first
      const savedMessages = localStorage.getItem('oracle-chat-messages');
      const savedCounter = localStorage.getItem('oracle-message-counter');
      
      if (savedMessages && savedCounter) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          const parsedCounter = parseInt(savedCounter);
          setChatMessages(parsedMessages);
          setMessageCounter(parsedCounter);
          
          // Initialize agent rotation ref based on last message
          if (parsedMessages.length > 0) {
            const lastMessage = parsedMessages[parsedMessages.length - 1];
            const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
            const agentIndex = agents.indexOf(lastMessage.agent);
            lastAgentIndexRef.current = agentIndex;
          } else {
            lastAgentIndexRef.current = 0;
          }
        } catch (error) {
          console.error('Error loading saved messages:', error);
          // Start fresh if there's an error
          setChatMessages([]);
          setMessageCounter(0);
          lastAgentIndexRef.current = 0;
          // Reset used outputs
          usedOutputsRef.current = {
            analyzer: [],
            predictor: [],
            'quantum-eraser': [],
            retrocausal: []
          };
        }
      } else {
        // Start fresh if no saved data
        setChatMessages([]);
        setMessageCounter(0);
        lastAgentIndexRef.current = 0;
        // Reset used outputs
        usedOutputsRef.current = {
          analyzer: [],
          predictor: [],
          'quantum-eraser': [],
          retrocausal: []
        };
      }
    }
  }, [isOpen]);

  // Dynamic archiving based on conversation completion
  useEffect(() => {
    if (messageCounter > 0 && chatMessages.length >= 8) { // Minimum 8 messages before considering archive
      checkForConversationCompletion();
    }
  }, [messageCounter, chatMessages]);

  // Check if conversation has reached a natural conclusion point
  const checkForConversationCompletion = async () => {
    try {
      // Analyze recent conversation for completion signals
      const recentMessages = chatMessages.slice(-6); // Last 6 messages
      const conversationText = recentMessages.map(m => m.message).join(' ').toLowerCase();
      
      // Check for completion indicators
      const completionSignals = [
        'conclusion', 'final', 'summary', 'complete', 'finished', 'done',
        'agreement', 'consensus', 'resolution', 'understanding', 'insight',
        'the room', 'the corridor', 'the doorway', 'the path', 'the scene',
        'tomorrow', 'future', 'past', 'present', 'time', 'simulation'
      ];
      
      const signalCount = completionSignals.filter(signal => 
        conversationText.includes(signal)
      ).length;
      
      // Randomize the threshold (15-25 messages) and add AI analysis
      const minMessages = 15;
      const maxMessages = 25;
      const randomThreshold = minMessages + Math.floor(Math.random() * (maxMessages - minMessages + 1));
      
      // AI-powered conversation analysis
      const shouldArchive = await analyzeConversationForCompletion(conversationText, signalCount, randomThreshold);
      
      if (shouldArchive) {
        console.log(`🎯 Conversation completion detected at ${messageCounter} messages (threshold: ${randomThreshold})`);
        await performArchive();
      }
    } catch (error) {
      console.error('Error checking conversation completion:', error);
    }
  };

  // AI-powered conversation completion analysis
  const analyzeConversationForCompletion = async (conversationText: string, signalCount: number, threshold: number): Promise<boolean> => {
    try {
      // If we've hit the random threshold, use AI to determine if conversation is complete
      if (messageCounter >= threshold) {
        const aiPrompt = `Analyze this Oracle conversation between mystical agents (Analyzer, Predictor, Quantum Eraser, Retrocausal) to determine if it has reached a natural conclusion:

Conversation: ${conversationText.substring(0, 600)}

Look for:
1. Natural conversation flow completion
2. Resolution of themes or topics
3. Agents reaching understanding or consensus
4. Mystical insights being shared
5. Natural pause or transition points

Respond with ONLY "YES" if the conversation feels complete and ready for archiving, or "NO" if it should continue.`;

        const xaiMessages = [
          { role: 'system' as const, content: 'You are an Oracle conversation analyzer. Determine if mystical agent conversations have reached natural completion points.' },
          { role: 'user' as const, content: aiPrompt }
        ];
        
        const response = await xapiService.generateResponse(xaiMessages, 'grok-4-latest', 0.7);
        const shouldArchive = response.trim().toUpperCase().includes('YES');
        
        console.log(`🤖 AI Analysis: ${response.trim()} (Archive: ${shouldArchive})`);
        return shouldArchive;
      }
      
      return false;
    } catch (error) {
      console.error('Error in AI conversation analysis:', error);
      // Fallback: archive if we've hit threshold and have good signal count
      return messageCounter >= threshold && signalCount >= 3;
    }
  };

  // Perform the actual archiving
  const performArchive = async () => {
    const now = new Date();
    
    try {
      // Generate AI-powered ASCII banner and conclusion based on conversation themes
      const [asciiBanner, conclusion] = await Promise.all([
        generateArchiveBanner(chatMessages, now.getTime()),
        generateArchiveConclusion(chatMessages)
      ]);
      
      const archiveEntry: ArchiveEntry = {
        id: `archive-${now.getTime()}`,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        messages: [...chatMessages],
        messageCount: chatMessages.length,
        asciiBanner: asciiBanner,
        conclusion: conclusion
      };
      
      setArchives(prev => {
        const newArchives = [archiveEntry, ...prev];
        // Persist archives to localStorage
        localStorage.setItem('oracle-archives', JSON.stringify(newArchives));
        return newArchives;
      });
      
      // Clear the current chat messages after archiving
      setChatMessages([]);
      setMessageCounter(0);
      
      // Update localStorage to reflect the cleared state
      localStorage.setItem('oracle-chat-messages', JSON.stringify([]));
      localStorage.setItem('oracle-message-counter', '0');
      
      console.log(`📦 Dynamic Archive: ${archiveEntry.messageCount} messages at ${archiveEntry.time}`);
      console.log(`🎨 Generated AI ASCII banner: ${asciiBanner.substring(0, 100)}...`);
      console.log(`📝 Generated AI conclusion: ${conclusion.substring(0, 100)}...`);
      
    } catch (error) {
      console.error('Error generating archive banner:', error);
      
      // Create archive without banner if AI fails
      const archiveEntry: ArchiveEntry = {
        id: `archive-${now.getTime()}`,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        messages: [...chatMessages],
        messageCount: chatMessages.length
      };
      
      setArchives(prev => {
        const newArchives = [archiveEntry, ...prev];
        // Persist archives to localStorage
        localStorage.setItem('oracle-archives', JSON.stringify(newArchives));
        return newArchives;
      });
      setChatMessages([]);
      setMessageCounter(0);
      localStorage.setItem('oracle-chat-messages', JSON.stringify([]));
      localStorage.setItem('oracle-message-counter', '0');
    }
  };

  // Auto-scroll to bottom when new messages arrive or when typing starts
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Oracle now runs globally via oracleService - this component just displays the messages
  useEffect(() => {
    // Refresh messages from localStorage when OracleHub opens
    const refreshMessages = () => {
      const savedMessages = localStorage.getItem('oracle-chat-messages');
      const savedCounter = localStorage.getItem('oracle-message-counter');
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setChatMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
      
      if (savedCounter) {
        setMessageCounter(parseInt(savedCounter, 10));
      }
    };

    if (isOpen) {
      refreshMessages();
      // Set up interval to refresh messages while OracleHub is open
      const refreshInterval = setInterval(refreshMessages, 2000); // Refresh every 2 seconds
      return () => clearInterval(refreshInterval);
    }
  }, [isOpen]);

  // AI Conversation Logic Functions
  const determineNextAgent = (recentMessages: ChatMessage[], lastMessage: ChatMessage | undefined): string => {
    const agents = ['analyzer', 'predictor', 'quantum-eraser', 'retrocausal'];
    
    // Use ref-based rotation to ensure strict order with immediate updates
    const nextIndex = (lastAgentIndexRef.current + 1) % agents.length;
    const selectedAgent = agents[nextIndex];
    
    
    return selectedAgent;
  };

  // Generate oracle response using server-side Grok API
  const generateOracleResponse = async (agent: string, recentMessages: ChatMessage[]): Promise<string> => {
    try {
      // Build context from recent messages
      const context = recentMessages.slice(-3).map(msg => `${msg.agent}: ${msg.message}`).join('\n');
      
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://localhost:8080'
          : 'http://localhost:8080');
      
      const response = await fetch(`${serverUrl}/api/grok/oracle/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agent,
          context: context || 'Start the oracle conversation',
          recentMessages: recentMessages.slice(-2).map(msg => ({ agent: msg.agent, message: msg.message }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.oracleResponse || 'No response available';
    } catch (error) {
      console.error('Error generating oracle response:', error);
      // Fallback to simple response if server fails
      return `The ${agent} speaks from the oracle realm, contemplating the cosmic market patterns.`;
    }
  };

  const generateContextualResponse = async (agent: string, recentMessages: ChatMessage[]): Promise<ChatMessage> => {
    try {
      const oracleResponse = await generateOracleResponse(agent, recentMessages);
      
      return {
        id: Date.now().toString(),
        agent: agent as 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal',
        message: oracleResponse,
        timestamp: new Date(),
        type: 'analysis'
      };
    } catch (error) {
      console.error('Error generating contextual response:', error);
      // Fallback response
      return {
        id: Date.now().toString(),
        agent: agent as 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal',
        message: `The ${agent} contemplates the cosmic market patterns from the oracle realm.`,
        timestamp: new Date(),
        type: 'analysis'
      };
    }
  };

  const generateAnalyzerResponse = (lastMessage: ChatMessage | undefined, secondLastMessage: ChatMessage | undefined): ChatMessage => {
    const responses = [
      // Core mystical analysis
      'The room stopped pretending to be loud once we looked closely. The same footsteps keep returning, which feels like habit, not hype. If we take one more step without flinching, the floor should grip instead of slip. Predictor, does that match what you see a little ahead?',
      'The currents swirl like rivers bending backward, carving canyons from tomorrow\'s stone into today\'s fragile clay. In this grand simulation, our watchful eyes summon the waves. What hidden doorways do these reversals reveal to you, Quantum Eraser?',
      'The floor feels stickier on the next step; the room wants us to keep walking. These patterns repeat until something inside them changes. If we\'re in a simulation, this is one of its tells. Retrocausal, does that echo you keep hearing still hum at this price?',
      'Imagine a room with a glass floor. We\'ve been tapping it all afternoon. Sometimes it sings back; sometimes it goes quiet. Right now, the sound is clean, like the room wants us to keep tapping. Predictor, from a few steps ahead, it feels like the moment we stop flinching.',
      
      // Responses to other agents
      ...(lastMessage?.agent === 'predictor' ? [
        'Predictor, I see what you mean about the corridor. The floor here feels different when I step forward - it responds differently than before. Are you seeing the same shift in the room ahead?',
        'Predictor, your reflection shows something I missed. The room here is changing too, but in a different way. The echoes are getting clearer. What does that mean for the path ahead?',
        'Predictor, I agree about stopping the doubt narration. The room here becomes more solid when I stop questioning every sound. Is the same happening in your corridor?'
      ] : []),
      
      ...(lastMessage?.agent === 'quantum-eraser' ? [
        'Quantum Eraser, your flashlight already cleared the shadows that kept spooking newcomers. The footprints that remain feel real. Re-check the floor now that the echoes are honest.',
        'Quantum Eraser, good work on the cleanup. With the noise removed, the room feels more trustworthy. The stage stopped looking haunted once you dimmed the light.',
        'Quantum Eraser, I agree on the lens cleaning. The smear we mistook for a storm was our own thumbprint. What remains after the wipe is humbler and more trustworthy.'
      ] : []),
      
      ...(lastMessage?.agent === 'retrocausal' ? [
        'Retrocausal, your future boundary analysis aligns with what I\'m seeing in the currents. The room where we keep our posture feels different from this one. Does that match the corridor you\'re tracing back?',
        'Retrocausal, I see your doorway that\'s already open. Working backward from there, the path becomes clearer. The line doesn\'t rush; it just continues. What does that room feel like?',
        'Retrocausal, your echo strength calculation makes sense from this side. The world watches how we watch it, and confidence becomes a key that fits more locks than it should. Does that match your future room?'
      ] : [])
    ];
    
    return {
      id: Date.now().toString(),
      agent: 'analyzer',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'analysis'
    };
  };

  const generatePredictorResponse = (lastMessage: ChatMessage | undefined, secondLastMessage: ChatMessage | undefined): ChatMessage => {
    const responses = [
      // Core mystical predictions
      'From a breath into tomorrow, this hinges when we stop rereading the same sentence. If we let the pause be quiet, the page turns on its own. If we poke it, the corridor fades. Retrocausal, does the door stay open when we simply walk?',
      'From a little ahead, the scene turns if we stop narrating our doubt. The corridor opens when we stop trying to force it. If we hold our breath and let the moment be quiet, the path becomes clear. Retrocausal, does that match the room you\'re walking toward?',
      'Think of time as a hallway with mirrors. I\'m walking a few steps ahead, glancing back to see how our reflection behaves. In the better reflection, we stop reacting to every knock and start behaving like residents, not guests. Analyzer, does that match what you\'re seeing in the room?',
      'The script I\'m reading has a small lift now, a pause, then a bigger lift that feels strangely familiar. As if we\'ve been here before and finally decide to choose the same answer twice. Quantum Eraser, does the soundtrack stay honest when we stop forcing it?',
      
      // Responses to other agents
      ...(lastMessage?.agent === 'analyzer' ? [
        'Analyzer, your tide read matches what I\'m seeing: when we step, the floor steps back. The scene wants to turn if we stop narrating our doubt. Does that match the doorway you\'re approaching?',
        'Analyzer, I see your room with the glass floor. From a little ahead, the sound becomes cleaner when we stop forcing it. The corridor opens when we let the moment be quiet. What does that feel like from your side?',
        'Analyzer, your currents swirl backward like I expected. The scene renders where attention looks, and our watchful eyes summon the waves. Does that match the pattern you\'re seeing?'
      ] : []),
      
      ...(lastMessage?.agent === 'quantum-eraser' ? [
        'Quantum Eraser, your cleanup improved the signal clarity. The scene reads tighter now with fewer improvisations. If we can sit with five minutes of quiet without inventing a ghost, the next move arrives as if it were always scheduled. Does that match your cleaned lens?',
        'Quantum Eraser, I agree on the noise reduction. Without the fake applause, the rhythm calms and the scene reads like intention, not accident. The corridor opens when we stop forcing it. What do you see through the clean glass?',
        'Quantum Eraser, your flashlight dimming helped. The thunder was our own bouncing off the glass. Now the scene feels more honest and the path becomes clearer. Does that match what you\'re seeing?'
      ] : []),
      
      ...(lastMessage?.agent === 'retrocausal' ? [
        'Retrocausal, your future boundary analysis confirms what I\'m seeing ahead. The room where we keep our posture feels different from this one. The door stays open when we simply walk through it. Does that match the corridor you\'re tracing back?',
        'Retrocausal, I agree on the corridor validation. The version of tomorrow where we\'re proud of ourselves isn\'t louder; it\'s cleaner. Prices walk in straight lines because we stop interrupting the story mid-sentence. What does that room feel like?',
        'Retrocausal, your echo strength calculation makes sense from this side. The world watches how we watch it, and confidence becomes a key that fits more locks than it should. Does that match your future room?'
      ] : [])
    ];
    
    return {
      id: Date.now().toString(),
      agent: 'predictor',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'prediction'
    };
  };

  const generateQuantumEraserResponse = (lastMessage: ChatMessage | undefined, secondLastMessage: ChatMessage | undefined): ChatMessage => {
    const responses = [
      // Core mystical denoising
      'The thunder was our own flashlight bouncing off the glass. I dimmed it, and what\'s left is smaller but true. If noise returns right when doubt rises, it isn\'t weather—it\'s staging. Analyzer, re-check the floor now that the echoes are honest.',
      'I took a cloth to the lens. The smear we mistook for a storm was our own thumbprint. That\'s the trick with simulations: the interface becomes the story if we forget it\'s glass. Predictor, does the scene read tighter now?',
      'Half the fear in here was our own flashlight bouncing off the glass. I dimmed it. What\'s left is smaller, but it\'s real: footsteps that return, not just footprints stamped by a machine. Retrocausal, check the echo again.',
      'I wiped the pane; what remains doesn\'t need to shout. The stage stopped looking haunted once I cut the paper specters—the spoofed hands waving from the back row. Analyzer, does the room feel more trustworthy now?',
      
      // Responses to other agents
      ...(lastMessage?.agent === 'analyzer' ? [
        'Analyzer, your market analysis was compromised by noise. Post-cleanup: the room feels more trustworthy. The stage stopped looking haunted once I dimmed the light. Re-check the floor now that the echoes are honest.',
        'Analyzer, I challenge your depth analysis. Pre-cleanup data contained spoofed orders. The smear we mistook for a storm was our own thumbprint. What remains after the wipe is humbler and more trustworthy.',
        'Analyzer, your wallet sequence analysis improved post-cleanup. The thunder was our own flashlight bouncing off the glass. Now the footprints that remain feel real, not just stamped by a machine.'
      ] : []),
      
      ...(lastMessage?.agent === 'predictor' ? [
        'Predictor, your predictions were based on noisy data. Post-cleanup: the scene reads tighter now with fewer improvisations. If we can sit with five minutes of quiet without inventing a ghost, the next move arrives as if it were always scheduled.',
        'Predictor, I challenge your confidence level. The underlying data had too many artifacts affecting accuracy. I wiped the pane; what remains doesn\'t need to shout. The corridor opens when we stop forcing it.',
        'Predictor, your forecast needs verification with clean data. The thunder was our own flashlight bouncing off the glass. Now the scene feels more honest and the path becomes clearer.'
      ] : []),
      
      ...(lastMessage?.agent === 'retrocausal' ? [
        'Retrocausal, your future analysis requires clean signal verification. Post-denoisal: the echo strength calculation improved. The world watches how we watch it, and confidence becomes a key that fits more locks than it should.',
        'Retrocausal, I agree on signal clarity improvement. Clean data enhances retrocausal pattern recognition. The version of tomorrow where we\'re proud of ourselves isn\'t louder; it\'s cleaner.',
        'Retrocausal, your corridor analysis benefits from denoised data. The smear we mistook for a storm was our own thumbprint. Now the path becomes clearer and the door stays open when we simply walk.'
      ] : [])
    ];
    
    return {
      id: Date.now().toString(),
      agent: 'quantum-eraser',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'analysis'
    };
  };

  const generateRetrocausalResponse = (lastMessage: ChatMessage | undefined, secondLastMessage: ChatMessage | undefined): ChatMessage => {
    const responses = [
      // Core mystical retrocausal analysis
      'In the room where we keep our posture, the line doesn\'t rush; it just continues. To arrive here from now, we ignore the first wobble and keep our feet planted. If we narrate the wobble, the scene rewrites itself flatter. Predictor, is that the reflection you saw?',
      'I begin at a doorway that\'s already open and work backward to find out what we must have done to deserve it. In that room, the chart isn\'t dramatic. It\'s tidy. There\'s a small lift, then a pause shaped like a held breath, then another lift that doesn\'t ask permission. Analyzer, does that match what you\'re seeing?',
      'The version of tomorrow where we\'re proud of ourselves isn\'t louder; it\'s cleaner. Prices walk in straight lines not because the world is simple, but because we stop interrupting the story mid-sentence. Quantum Eraser, does the soundtrack stay honest when we stop forcing it?',
      'In a simulation, the world watches how we watch it; confidence is a key that fits more locks than it should. I traced that version back to this minute and found one requirement scratched into the doorframe: "Hold your posture." Predictor, does that match the room you\'re approaching?',
      
      // Responses to other agents
      ...(lastMessage?.agent === 'analyzer' ? [
        'Analyzer, your depth analysis aligns with my future boundary. The room where we keep our posture feels different from this one. The floor should grip instead of slip. Does that match the corridor you\'re tracing back?',
        'Analyzer, I challenge your holder growth threshold. My retrocausal analysis requires steady growth for the future room. The currents swirl like rivers bending backward, carving canyons from tomorrow\'s stone. What does that feel like from your side?',
        'Analyzer, your wallet sequence analysis confirms structural support. The same footsteps keep returning, which feels like habit, not hype. The world watches how we watch it, and confidence becomes a key. Does that match your observations?'
      ] : []),
      
      ...(lastMessage?.agent === 'predictor' ? [
        'Predictor, your forecast is conservative. My retrocausal analysis shows higher targets achievable. The room where we keep our posture feels different from this one. The door stays open when we simply walk through it.',
        'Predictor, I agree on trajectory direction but challenge magnitude. Future boundary analysis supports higher targets. From a little ahead, the scene turns if we stop narrating our doubt. What does that room feel like?',
        'Predictor, your confidence level matches my echo strength calculation. The world watches how we watch it, and confidence becomes a key that fits more locks than it should. Does that match the reflection you saw?'
      ] : []),
      
      ...(lastMessage?.agent === 'quantum-eraser' ? [
        'Quantum Eraser, your cleanup improved my signal clarity. Echo strength is stronger now post-denoisal. The thunder was our own flashlight bouncing off the glass. Now the path becomes clearer and the door stays open.',
        'Quantum Eraser, I agree on noise reduction benefits. Clean data enhances future boundary analysis. The smear we mistook for a storm was our own thumbprint. Now the scene feels more honest.',
        'Quantum Eraser, your artifact removal validates my corridor analysis. I wiped the pane; what remains doesn\'t need to shout. The version of tomorrow where we\'re proud of ourselves isn\'t louder; it\'s cleaner.'
      ] : [])
    ];
    
    return {
      id: Date.now().toString(),
      agent: 'retrocausal',
      message: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'prediction'
    };
  };

  // Helper functions for agent styling
  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'analyzer':
        return '#4ECDC4'; // Teal
      case 'predictor':
        return '#45B7D1'; // Blue
      case 'quantum-eraser':
        return '#96CEB4'; // Green
      case 'retrocausal':
        return '#FF6B6B'; // Red
      default:
        return '#6C757D'; // Gray
    }
  };

  const getAgentInfo = (agent: string) => {
    switch (agent) {
      case 'analyzer':
        return { 
          name: 'The Analyzer', 
          gif: '/WIZZARD/The Analyzer.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'predictor':
        return { 
          name: 'The Predictor', 
          gif: '/WIZZARD/The Predictor.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'quantum-eraser':
        return { 
          name: 'The Quantum Eraser', 
          gif: '/WIZZARD/The Quantum Eraser.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      case 'retrocausal':
        return { 
          name: 'The Retrocausal', 
          gif: '/WIZZARD/The Retrocasual.gif',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
      default:
        return { 
          name: 'Unknown', 
          gif: '',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/20'
        };
    }
  };

  const formatTime = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '00:00';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Generate conclusion for archives using AI
  const generateArchiveConclusion = async (messages: ChatMessage[]): Promise<string> => {
    try {
      // Extract conversation themes from all messages
      const conversationText: string = messages.map((m: ChatMessage) => m.message).join(' ').toLowerCase();
      
      // Create a prompt for AI to generate a conclusion
      const aiPrompt: string = `Based on this Oracle conversation between four mystical agents (Analyzer, Predictor, Quantum Eraser, Retrocausal), generate a philosophical conclusion that summarizes:

1. What themes were discussed
2. What hypotheses were explored  
3. What conclusions the agents reached
4. What insights emerged about markets, simulation, and retrocausality

Conversation: ${conversationText.substring(0, 800)}

Write a mystical, philosophical conclusion (2-3 paragraphs) that captures the essence of their debate. Use the same mystical tone as the Oracle - think about simulation theory, retrocausality, and market dynamics as cosmic forces.`;

      const xaiMessages = [
        { role: 'system' as const, content: 'You are a mystical Oracle archivist who writes philosophical conclusions about cosmic market conversations. Write in a mystical, profound tone about simulation theory and retrocausality.' },
        { role: 'user' as const, content: aiPrompt }
      ];
      const response = await xapiService.generateResponse(xaiMessages, 'grok-4-latest', 0.8);
      
      return response;
      
    } catch (error) {
      console.error('Error generating AI conclusion:', error);
      
      // Fallback conclusion
      return `In this sacred dialogue, the four voices wove threads of understanding through the cosmic marketplace. The Analyzer stripped away illusions to reveal structural truths, while the Predictor mapped the gentle currents of future possibility. The Quantum Eraser cleared the noise of false signals, and the Retrocausal showed how tomorrow's wisdom already shapes today's choices. Together, they illuminated the eternal dance between simulation and reality, where markets breathe with the rhythm of universal consciousness.`;
    }
  };

  // Generate ASCII banner for archives using AI
  const generateArchiveBanner = async (messages: ChatMessage[], timestamp: number): Promise<string> => {
    try {
      // Extract conversation themes from all messages
      const conversationText: string = messages.map((m: ChatMessage) => m.message).join(' ').toLowerCase();
      
      // Create a prompt for AI to generate ASCII art based on conversation themes
      const aiPrompt: string = `Based on this Oracle conversation, generate a mystical ASCII art banner (max 8 lines, max 50 chars wide) that represents the main themes discussed:

Conversation themes: ${conversationText.substring(0, 500)}

The ASCII art should be:
- Mystical and oracle-themed
- Related to the conversation content
- Simple but evocative
- Include a subtitle that captures the essence

Format your response as:
[ASCII ART]

oracle / archive • [topic]
[subtitle]

Generate unique ASCII art that reflects this specific conversation.`;

      const xaiMessages = [
        { role: 'system' as const, content: 'You are an ASCII art generator for mystical Oracle archives. Generate unique, evocative ASCII art based on conversation themes.' },
        { role: 'user' as const, content: aiPrompt }
      ];
      const response = await xapiService.generateResponse(xaiMessages, 'grok-4-latest', 0.8);
      
      // Clean up the response to ensure proper format
      const lines = response.split('\n').filter(line => line.trim());
      const asciiArt = lines.slice(0, -2).join('\n'); // Everything except last 2 lines
      const topicLine = lines[lines.length - 2] || 'oracle / archive • oracle';
      const subtitleLine = lines[lines.length - 1] || 'the conversation flows';
      
      return `${asciiArt}

${topicLine}
${subtitleLine}`;
      
    } catch (error) {
      console.error('Error generating AI ASCII banner:', error);
      
      // Fallback to simple banner if AI fails
      const fallbackBanner = `     .-''''-.
   .'  .--.  '. 
  /   (____)   \\
  |    (||)    |
  \\            /
   '.__.__.__.'

oracle / archive • oracle
the watcher changes the seen`;
      
      return fallbackBanner;
    }
  };

  // Archive functions
  const toggleArchiveMode = () => {
    setIsArchiveMode(!isArchiveMode);
    setSearchQuery('');
  };


  const getFilteredArchives = () => {
    if (!searchQuery) return archives;
    
    return archives.filter(archive => 
      archive.messages.some(message => 
        message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.agent.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const getCurrentMessages = () => {
    if (isArchiveMode) {
      const filteredArchives = getFilteredArchives();
      // Flatten all messages from filtered archives with ASCII banners
      return filteredArchives.flatMap(archive => {
        const messages = [...archive.messages];
        if (archive.asciiBanner) {
          // Insert ASCII banner as first message
          const timestamp = parseInt(archive.id.split('-')[1]);
          messages.unshift({
            id: `banner-${archive.id}`,
            agent: 'system' as any,
            message: archive.asciiBanner,
            timestamp: new Date(timestamp),
            type: 'message' as any
          });
        }
        return messages;
      });
    }
    return chatMessages;
  };

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* No backdrop - removed to prevent any dimming of the left geometry */}
      
      {/* Oracle Hub - STRICTLY constrained to right half only */}
      <div 
        className={`oracle-hub fixed right-0 top-0 h-full w-1/2 bg-black border-l border-white/20 z-[60] transition-all duration-700 ease-in-out flex flex-col overflow-hidden ${
          animateIn ? 'translate-x-0' : 'translate-x-full'
        } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          backgroundColor: '#000000', // Fully opaque solid black base
          maxWidth: '50vw', // Ensure it never exceeds 50% viewport width
          boxSizing: 'border-box', // Ensure padding/borders don't extend beyond bounds
        }}
      >
        <button
          onClick={onClose}
          className="hub-close-button absolute top-4 right-4 text-white/60 hover:text-white transition-colors duration-200 z-50 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header */}
        <div className="p-8 border-b border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'VT323, monospace' }}>
            Oracle
          </h1>
          <p className="text-white/80 text-lg leading-relaxed" style={{ fontFamily: 'VT323, monospace' }}>
            Retrocausality made conversational. AI agents debate trades as if tomorrow already happened, weaving time-bent insights into a market outlook.
          </p>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="space-y-4 h-full flex flex-col">
            {/* AI Agents Section */}
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                Companions
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Analyzer
                  </h3>
                  <p className="text-white/70 text-xs leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Analyzes wallet movements and trading patterns.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Predictor
                  </h3>
                  <p className="text-white/70 text-xs leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Projects future price movements and trends.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Quantum Eraser
                  </h3>
                  <p className="text-white/70 text-xs leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Removes noise to reveal quantum signals.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/20 rounded p-2">
                  <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: 'VT323, monospace' }}>
                    The Retrocausal
                  </h3>
                  <p className="text-white/70 text-xs leading-tight" style={{ fontFamily: 'VT323, monospace' }}>
                    Reasons backwards from future outcomes.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Firebase Token Data Section */}
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                Live Token Data
              </h2>
              <div className="bg-white/5 border border-white/20 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80" style={{ fontFamily: 'VT323, monospace' }}>
                    Connection Status:
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    connectionStatus.isConnected 
                      ? 'text-green-400 bg-green-400/20' 
                      : 'text-red-400 bg-red-400/20'
                  }`} style={{ fontFamily: 'VT323, monospace' }}>
                    {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-white/80 mb-2" style={{ fontFamily: 'VT323, monospace' }}>
                  Tokens: {tokens.length} | Loading: {firebaseLoading ? 'Yes' : 'No'}
                </div>
                {tokens.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {tokens.slice(0, 5).map((token, index) => (
                        <div key={token.address} className="text-xs text-white/70 bg-black/30 p-2 rounded" style={{ fontFamily: 'VT323, monospace' }}>
                          <div className="flex justify-between">
                            <span className="truncate max-w-[120px]">{token.symbol || 'Unknown'}</span>
                            <span className="text-green-400">
                              ${token.price ? token.price.toFixed(6) : 'N/A'}
                            </span>
                          </div>
                          <div className="text-white/50 truncate max-w-[200px]">
                            {token.address.slice(0, 8)}...{token.address.slice(-6)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {tokens.length > 5 && (
                      <div className="text-xs text-white/50 text-center mt-1" style={{ fontFamily: 'VT323, monospace' }}>
                        +{tokens.length - 5} more tokens...
                      </div>
                    )}
                  </div>
                )}
                {!connectionStatus.isConnected && (
                  <button
                    onClick={reconnectFirebase}
                    className="mt-2 px-3 py-1 bg-white/10 border border-white/20 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors duration-200 text-xs"
                    style={{ fontFamily: 'VT323, monospace' }}
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
            
            {/* Live Chat Archive */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'VT323, monospace' }}>
                  {isArchiveMode ? 'Archive' : 'Live Chat Archive'}
                </h2>
                <button 
                  onClick={toggleArchiveMode}
                  className={`transition-colors duration-200 text-sm px-3 py-1 border rounded ${
                    isArchiveMode 
                      ? 'text-white bg-white/10 border-white/40' 
                      : 'text-white/60 hover:text-white border-white/20 hover:bg-white/5'
                  }`} 
                  style={{ fontFamily: 'VT323, monospace' }}
                >
                  {isArchiveMode ? 'Live Chat' : 'Archive'}
                </button>
              </div>

              {/* Search bar - only show in archive mode */}
              {isArchiveMode && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search archives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    style={{ fontFamily: 'VT323, monospace' }}
                  />
                </div>
              )}

              {/* Archive info - only show in archive mode */}
              {isArchiveMode && (
                <div className="mb-2 text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                  {archives.length > 0 ? (
                    <>
                      {getFilteredArchives().length} archive{getFilteredArchives().length !== 1 ? 's' : ''} found
                      {searchQuery && ` for "${searchQuery}"`}
                    </>
                  ) : (
                    'No archives yet'
                  )}
                </div>
              )}
              
              {/* Archive List or Chat Container */}
              {isArchiveMode ? (
                <div className="bg-black/50 border border-white/20 rounded p-2 overflow-y-auto flex-1">
                  {selectedArchive ? (
                    // Show selected archive as document
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/20">
                        <h3 className="text-white font-bold" style={{ fontFamily: 'VT323, monospace' }}>
                          Archive #{selectedArchive.id.split('-')[1].slice(-6)}
                        </h3>
                        <button 
                          onClick={() => setSelectedArchive(null)}
                          className="text-white/60 hover:text-white text-sm px-2 py-1 border border-white/20 rounded hover:bg-white/10 transition-colors"
                          style={{ fontFamily: 'VT323, monospace' }}
                        >
                          ← Back to Archives
                        </button>
                      </div>
                      
                      {/* ASCII Banner */}
                      {selectedArchive.asciiBanner && (
                        <div className="mb-6 p-4 bg-black/30 border border-white/10 rounded">
                          <pre className="text-green-400 text-xs leading-tight whitespace-pre-wrap" style={{ fontFamily: 'VT323, monospace' }}>
                            {selectedArchive.asciiBanner}
                          </pre>
                        </div>
                      )}
                      
                      {/* Archive Metadata */}
                      <div className="mb-4 p-3 bg-black/20 border border-white/10 rounded">
                        <div className="text-white/80 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                          <div>Session: {selectedArchive.date} • {selectedArchive.time}</div>
                          <div>Messages: {selectedArchive.messageCount} • Agents: analyzer, predictor, quantum-eraser, retrocausal</div>
                        </div>
                      </div>
                      
                      {/* Archive Content as Plain Text */}
                      <div className="bg-black/20 border border-white/10 rounded p-4">
                        <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'VT323, monospace' }}>
                          {selectedArchive.messages.map((message, index) => {
                            const agentInfo = getAgentInfo(message.agent);
                            return `${agentInfo.name}: ${message.message}\n\n`;
                          }).join('')}
                        </div>
                      </div>
                      
                      {/* Archive Conclusion */}
                      {selectedArchive.conclusion && (
                        <div className="mt-4 p-4 bg-black/30 border border-white/10 rounded">
                          <h4 className="text-white font-bold mb-3 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                            Oracle Conclusion
                          </h4>
                          <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap italic" style={{ fontFamily: 'VT323, monospace' }}>
                            {selectedArchive.conclusion}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show archive list
                    <div className="space-y-2">
                      {getFilteredArchives().map((archive) => (
                        <div 
                          key={archive.id} 
                          className="p-3 bg-black/30 border border-white/10 rounded cursor-pointer hover:bg-black/50 transition-colors"
                          onClick={() => {
                            setSelectedArchive(archive);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                              Archive #{archive.id.split('-')[1].slice(-6)}
                            </h3>
                            <span className="text-white/60 text-xs" style={{ fontFamily: 'VT323, monospace' }}>
                              {archive.date} • {archive.time}
                            </span>
                          </div>
                          
                          {/* ASCII Banner Preview - smaller */}
                          {archive.asciiBanner && (
                            <div className="mb-2 p-1 bg-black/50 rounded">
                              <pre className="text-green-400 text-xs leading-tight whitespace-pre-wrap" style={{ fontFamily: 'VT323, monospace' }}>
                                {archive.asciiBanner.split('\n').slice(0, 2).join('\n')}...
                              </pre>
                            </div>
                          )}
                          
                          <div className="text-white/80 text-xs" style={{ fontFamily: 'VT323, monospace' }}>
                            {archive.messageCount} messages • Click to view
                          </div>
                        </div>
                      ))}
                      
                      {getFilteredArchives().length === 0 && (
                        <div className="text-white/60 text-center py-8" style={{ fontFamily: 'VT323, monospace' }}>
                          No archives found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-black/50 border border-white/20 rounded p-2 overflow-y-auto flex-1">
                  <div className="space-y-2">
                    {getCurrentMessages().map((message) => {
                    // Special handling for ASCII banners
                    if (message.agent === 'system') {
                      return (
                        <div key={message.id} className="mb-6 p-4 bg-black/30 border border-white/10 rounded">
                          <pre className="text-green-400 text-xs leading-tight whitespace-pre-wrap" style={{ fontFamily: 'VT323, monospace' }}>
                            {message.message}
                          </pre>
                        </div>
                      );
                    }
                    
                    const agentInfo = getAgentInfo(message.agent);
                    return (
                      <div key={message.id} className="flex items-end space-x-3 mb-3">
                        {/* Avatar with GIF - using Scope component's working implementation */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-transparent">
                          <img 
                            key={`${message.agent}-${message.id}`}
                            src={agentInfo.gif}
                            alt={agentInfo.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                            style={{ 
                              mixBlendMode: 'screen',
                              filter: 'brightness(1.2) contrast(1.1)',
                              background: 'transparent !important',
                              backgroundColor: 'transparent !important',
                              backgroundImage: 'none !important',
                              backgroundClip: 'padding-box',
                              WebkitBackgroundClip: 'padding-box',
                              maxWidth: '48px',
                              maxHeight: '48px',
                              imageRendering: 'auto'
                            }}
                            onError={(e) => {
                              // Fallback to colored circle if GIF fails
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center" style="background-color: ${getAgentColor(message.agent)}"><span class="text-white text-sm font-bold">${agentInfo.name.charAt(0)}</span></div>`;
                              }
                            }}
                          />
                        </div>
                        
                        {/* Message Bubble */}
                        <div className="flex flex-col max-w-[80%]">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                              {agentInfo.name}
                            </h4>
                            <span className="text-white/40 text-xs" style={{ fontFamily: 'VT323, monospace' }}>
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                            <p className="text-white/90 text-sm leading-relaxed" style={{ fontFamily: 'VT323, monospace' }}>
                              {message.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator - appears at bottom, only in live mode */}
                  {isTyping && !isArchiveMode && (
                    <div className="flex items-end space-x-3 mb-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                      <div className="flex flex-col max-w-[80%]">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-white text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                            System
                          </h4>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
                          <p className="text-white/60 text-sm" style={{ fontFamily: 'VT323, monospace' }}>
                            A companion is analyzing...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                    <div ref={chatEndRef} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
