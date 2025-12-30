import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Session, Player, SessionSummary, PlayerSummary } from '../types/poker';
import * as api from '../lib/api';
import { useAuth } from './AuthContext';

interface PokerContextType {
  session: Session | null;
  previousSessions: Session[];
  players: Player[];
  isLoading: boolean;
  error: string | null;
  startSession: (sessionName: string, potValue: number, potMode: 'fixed' | 'direct') => Promise<void>;
  endSession: () => Promise<void>;
  addPlayer: (name: string) => Promise<void>;
  updatePotsTaken: (playerId: string, potsTaken: number) => Promise<void>;
  updatePotsReturned: (playerId: string, potsReturned: number) => Promise<void>;
  getSessionSummary: () => SessionSummary | null;
  fetchSessions: () => Promise<void>;
  fetchPlayers: (sessionId: string) => Promise<void>;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

// Helper function to map database player to TypeScript Player interface
function mapDbPlayerToPlayer(dbPlayer: any): Player {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    potsTaken: Number(dbPlayer.pots_taken) || 0,
    potsReturned: Number(dbPlayer.pots_returned) || 0,
  };
}

// Helper function to map database session to TypeScript Session interface
function mapDbSessionToSession(dbSession: any, players: Player[] = []): Session {
  return {
    id: dbSession.id,
    sessionName: dbSession.session_name,
    potValue: dbSession.pot_value,
    potMode: dbSession.pot_mode || 'fixed',
    players,
    startTime: new Date(dbSession.start_time),
    endTime: dbSession.end_time ? new Date(dbSession.end_time) : null,
    isActive: dbSession.is_active || false,
  };
}

export function PokerProvider({ children }: { children: ReactNode }) {
  const { user, session: authSession } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [previousSessions, setPreviousSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use ref to track last user ID to avoid dependency issues
  const lastUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // Clear all data when user changes (logout or different user login)
  useEffect(() => {
    const currentUserId = user?.id || null;
    const lastUserId = lastUserIdRef.current;
    
    // If user changed (different user or logged out), clear all data immediately
    if (lastUserId !== null && lastUserId !== currentUserId) {
      console.log('🔄 User changed - clearing all poker data');
      console.log('   Previous user:', lastUserId);
      console.log('   Current user:', currentUserId);
      
      // Clear all state synchronously
      setSession(null);
      setPreviousSessions([]);
      setPlayers([]);
      setError(null);
      isFetchingRef.current = false;
    }
    
    // Update last user ID ref
    lastUserIdRef.current = currentUserId;
    
    // Fetch sessions when user is logged in (only if not already fetching)
    if (currentUserId && authSession && !isFetchingRef.current) {
      console.log('🔄 User logged in - fetching fresh data for user:', currentUserId);
      isFetchingRef.current = true;
      // Use setTimeout to ensure state updates are processed first (helps with browser)
      setTimeout(() => {
        fetchSessions().finally(() => {
          isFetchingRef.current = false;
        });
      }, 50);
    } else if (!currentUserId) {
      console.log('🔄 No user - clearing all data');
      setSession(null);
      setPreviousSessions([]);
      setPlayers([]);
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authSession]);

  const fetchSessions = useCallback(async () => {
    // Don't fetch if no user is logged in
    if (!user || !authSession) {
      console.log('⏸️ No user logged in - skipping fetchSessions');
      return;
    }
    
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('⏸️ Already fetching sessions - skipping');
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      console.log('📥 Fetching sessions for user:', user.id);
      const data = await api.fetchSessions();
      
      // Verify we're still fetching for the same user
      if (lastUserIdRef.current !== user.id) {
        console.log('⚠️ User changed during fetch - discarding results');
        return;
      }
      
      // Fetch players for each session
      const sessionsWithPlayers = await Promise.all(
        data?.map(async (dbSession: any) => {
          const playersData = await api.fetchPlayers(dbSession.id);
          const mappedPlayers = playersData?.map((dbPlayer: any) => mapDbPlayerToPlayer(dbPlayer)) || [];
          return mapDbSessionToSession(dbSession, mappedPlayers);
        }) || []
      );
      
      // Double-check user hasn't changed
      if (lastUserIdRef.current !== user.id) {
        console.log('⚠️ User changed after fetch - discarding results');
        return;
      }
      
      console.log('✅ Fetched', sessionsWithPlayers.length, 'sessions');
      setPreviousSessions(sessionsWithPlayers);
      // Optionally set current session if there's an active one
      const active = sessionsWithPlayers.find((s: Session) => s.isActive);
      setSession(active || null);
    } catch (err: any) {
      console.error('❌ Error fetching sessions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, authSession]);

  const fetchPlayers = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchPlayers(sessionId);
      const mappedPlayers = data?.map((dbPlayer: any) => mapDbPlayerToPlayer(dbPlayer)) || [];
      setPlayers(mappedPlayers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to update current session's players
  const updateCurrentSessionPlayers = useCallback(async (sessionId: string) => {
    const updatedPlayers = await api.fetchPlayers(sessionId);
    const mappedPlayers = updatedPlayers?.map((dbPlayer: any) => mapDbPlayerToPlayer(dbPlayer)) || [];
    setSession(prevSession => prevSession ? {
      ...prevSession,
      players: mappedPlayers
    } : null);
  }, []);

  const startSession = async (sessionName: string, potValue: number, potMode: 'fixed' | 'direct' = 'fixed') => {
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await api.createSession(sessionName, potValue, potMode);
      const mappedSession = mapDbSessionToSession(newSession);
      setSession(mappedSession);
      setPlayers([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.endSession(session.id);
      setSession(null);
      await fetchSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async (name: string) => {
    if (!session) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.addPlayer(session.id, name);
      await fetchPlayers(session.id);
      await updateCurrentSessionPlayers(session.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePotsTaken = async (playerId: string, potsTaken: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.updatePotsTaken(playerId, potsTaken);
      if (session) {
        await fetchPlayers(session.id);
        await updateCurrentSessionPlayers(session.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePotsReturned = async (playerId: string, potsReturned: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.updatePotsReturned(playerId, potsReturned);
      if (session) {
        await fetchPlayers(session.id);
        await updateCurrentSessionPlayers(session.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionSummary = (): SessionSummary | null => {
    if (!session) return null;
    const playerSummaries: PlayerSummary[] = players.map(player => {
      const totalPotsTaken = player.potsTaken;
      const totalPotsReturned = player.potsReturned ?? 0;
      
      // Calculate values based on pot mode
      const totalPotsTakenValue = session.potMode === 'direct' 
        ? totalPotsTaken 
        : totalPotsTaken * session.potValue;
      const totalPotsReturnedValue = session.potMode === 'direct'
        ? totalPotsReturned
        : totalPotsReturned * session.potValue;
      
      const netBalance = totalPotsReturnedValue - totalPotsTakenValue;
      return {
        playerId: player.id,
        playerName: player.name,
        totalPotsTaken,
        totalPotsReturned,
        totalPotsTakenValue,
        totalPotsReturnedValue,
        netBalance,
      };
    });
    return {
      sessionId: session.id,
      potValue: session.potValue,
      playerSummaries,
    };
  };

  return (
    <PokerContext.Provider
      value={{
        session,
        previousSessions,
        players,
        isLoading,
        error,
        startSession,
        endSession,
        addPlayer,
        updatePotsTaken,
        updatePotsReturned,
        getSessionSummary,
        fetchSessions,
        fetchPlayers,
      }}
    >
      {children}
    </PokerContext.Provider>
  );
}

export function usePoker() {
  const context = useContext(PokerContext);
  if (context === undefined) {
    throw new Error('usePoker must be used within a PokerProvider');
  }
  return context;
} 