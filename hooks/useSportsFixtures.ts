import { useState, useEffect } from 'react';
import { database, ref, onValue, off } from '../lib/firebase-sports';

export interface SportsFixture {
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
  [key: string]: any; // Allow for additional properties
}

export interface SportsData {
  fixtures: SportsFixture[];
  lastUpdated: string;
  count: number;
}

export interface SportCategory {
  fixtures: SportsData;
  live: SportsData;
}

export const useSportsFixtures = (sportType: string = 'soccer', dataType: 'fixtures' | 'live' = 'fixtures') => {
  const [fixtures, setFixtures] = useState<SportsFixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connected' | 'Disconnected'>('Disconnected');

  useEffect(() => {
    const sportsRef = ref(database, `sports/${sportType}/${dataType}`);
    
    const handleData = (snapshot: any) => {
      try {
        const data = snapshot.val();
        console.log(`📊 Raw data for ${sportType}/${dataType}:`, data);
        
        let fixturesArray: SportsFixture[] = [];
        
        if (data) {
          // Handle nested structure (soccer, nba, etc.): data.fixtures.fixtures
          if (data.fixtures && Array.isArray(data.fixtures)) {
            fixturesArray = data.fixtures as SportsFixture[];
          }
          // Handle direct array structure (tennis): data is directly an array
          else if (Array.isArray(data)) {
            fixturesArray = data as SportsFixture[];
          }
          // Handle object with fixtures property: data.fixtures
          else if (data.fixtures && Array.isArray(data.fixtures)) {
            fixturesArray = data.fixtures as SportsFixture[];
          }
        }
        
        console.log(`✅ Processed ${fixturesArray.length} fixtures for ${sportType}/${dataType}`);
        setFixtures(fixturesArray);
        setConnectionStatus('Connected');
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing sports fixtures data:', err);
        setError('Failed to process sports data');
        setIsLoading(false);
      }
    };

    const handleError = (error: any) => {
      console.error('Firebase sports connection error:', error);
      setError('Connection failed');
      setConnectionStatus('Disconnected');
      setIsLoading(false);
    };

    // Set up the listener
    onValue(sportsRef, handleData, handleError);

    // Cleanup function
    return () => {
      off(sportsRef, 'value', handleData);
    };
  }, [sportType, dataType]);

  return {
    fixtures,
    isLoading,
    error,
    connectionStatus
  };
};
