"use client";
import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, onValue, off, orderByChild, limitToLast, query } from 'firebase/database';
import { app } from '../lib/firebase';

export interface OracleMessage {
  id: string;
  agent: 'analyzer' | 'predictor' | 'quantum-eraser' | 'retrocausal' | 'system';
  message: string;
  timestamp: number;
  type: 'message' | 'analysis' | 'prediction';
  sessionId: string;
}

export function useOracleChat(limit: number = 100) {
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase(app);
      
      // Listen to Oracle messages with real-time updates
      const messagesRef = query(
        ref(db, 'oracle-messages'),
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const messagesArray = Object.values(messagesData) as OracleMessage[];
          
          // Sort by timestamp ascending (oldest first for chat display)
          messagesArray.sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(messagesArray);
          setIsConnected(true);
          console.log(`📡 Oracle messages updated: ${messagesArray.length} messages`);
        } else {
          setMessages([]);
          setIsConnected(true);
          console.log('📡 No Oracle messages found');
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to Oracle messages:', error);
        setError('Failed to load Oracle messages');
        setLoading(false);
        setIsConnected(false);
      });

      // Return cleanup function
      return () => {
        off(messagesRef, 'value', unsubscribeMessages);
      };

    } catch (err) {
      console.error('Error setting up Oracle message listener:', err);
      setError('Failed to connect to Oracle service');
      setLoading(false);
      setIsConnected(false);
    }
  }, [limit]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    loadMessages().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [loadMessages]);

  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    loading,
    error,
    isConnected,
    refreshMessages
  };
}

export default useOracleChat;
