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

export interface OracleSession {
  id: string;
  lastAgentIndex: number;
  messageCount: number;
  lastMessageTime: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export function useOracleMessages(limit: number = 50) {
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const [session, setSession] = useState<OracleSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase(app);
      
      // Listen to Oracle messages
      const messagesRef = query(
        ref(db, 'oracle-messages'),
        orderByChild('timestamp'),
        limitToLast(limit)
      );

      const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const messagesArray = Object.values(messagesData) as OracleMessage[];
          // Sort by timestamp descending (newest first)
          messagesArray.sort((a, b) => b.timestamp - a.timestamp);
          setMessages(messagesArray);
        } else {
          setMessages([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error listening to Oracle messages:', error);
        setError('Failed to load Oracle messages');
        setLoading(false);
      });

      // Listen to Oracle session
      const sessionRef = ref(db, 'oracle-session/oracle-session-2025');
      const unsubscribeSession = onValue(sessionRef, (snapshot) => {
        if (snapshot.exists()) {
          setSession(snapshot.val() as OracleSession);
        }
      }, (error) => {
        console.error('Error listening to Oracle session:', error);
      });

      // Return cleanup function
      return () => {
        off(messagesRef, 'value', unsubscribeMessages);
        off(sessionRef, 'value', unsubscribeSession);
      };

    } catch (err) {
      console.error('Error setting up Oracle message listener:', err);
      setError('Failed to connect to Oracle service');
      setLoading(false);
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
    session,
    loading,
    error,
    refreshMessages
  };
}

export default useOracleMessages;
