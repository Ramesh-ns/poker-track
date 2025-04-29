import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Session, Player, SessionSummary, PlayerSummary } from '../types/poker';

// Action types
type Action =
  | { type: 'START_SESSION'; payload: { potValue: number } }
  | { type: 'END_SESSION' }
  | { type: 'ADD_PLAYER'; payload: { name: string } }
  | { type: 'UPDATE_POTS_TAKEN'; payload: { playerId: string; potsTaken: number } }
  | { type: 'UPDATE_POTS_RETURNED'; payload: { playerId: string; potsReturned: number } };

// Initial state
interface PokerState {
  currentSession: Session | null;
  previousSessions: Session[];
}

const initialState: PokerState = {
  currentSession: null,
  previousSessions: [],
};

// Reducer function
function pokerReducer(state: PokerState, action: Action): PokerState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        currentSession: {
          id: Date.now().toString(),
          potValue: action.payload.potValue,
          players: [],
          startTime: new Date(),
          endTime: null,
          isActive: true,
        },
      };
    
    case 'END_SESSION':
      if (!state.currentSession) return state;
      
      const endedSession = {
        ...state.currentSession,
        endTime: new Date(),
        isActive: false,
      };
      
      return {
        currentSession: null,
        previousSessions: [...state.previousSessions, endedSession],
      };
    
    case 'ADD_PLAYER':
      if (!state.currentSession) return state;
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: action.payload.name,
        potsTaken: 0,
        potsReturned: 0,
      };
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          players: [...state.currentSession.players, newPlayer],
        },
      };
    
    case 'UPDATE_POTS_TAKEN':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          players: state.currentSession.players.map(player => 
            player.id === action.payload.playerId
              ? { ...player, potsTaken: action.payload.potsTaken }
              : player
          ),
        },
      };
    
    case 'UPDATE_POTS_RETURNED':
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          players: state.currentSession.players.map(player => 
            player.id === action.payload.playerId
              ? { ...player, potsReturned: action.payload.potsReturned }
              : player
          ),
        },
      };
    
    default:
      return state;
  }
}

// Context
interface PokerContextType {
  session: Session | null;
  previousSessions: Session[];
  startSession: (potValue: number) => void;
  endSession: () => void;
  addPlayer: (name: string) => void;
  updatePotsTaken: (playerId: string, potsTaken: number) => void;
  updatePotsReturned: (playerId: string, potsReturned: number) => void;
  getSessionSummary: () => SessionSummary | null;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

// Provider component
export function PokerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pokerReducer, initialState);
  const { currentSession, previousSessions } = state;

  const startSession = (potValue: number) => {
    dispatch({ type: 'START_SESSION', payload: { potValue } });
  };

  const endSession = () => {
    if (currentSession?.isActive) {
      dispatch({ type: 'END_SESSION' });
    }
  };

  const addPlayer = (name: string) => {
    if (currentSession?.isActive) {
      dispatch({ type: 'ADD_PLAYER', payload: { name } });
    }
  };

  const updatePotsTaken = (playerId: string, potsTaken: number) => {
    if (currentSession?.isActive) {
      dispatch({ type: 'UPDATE_POTS_TAKEN', payload: { playerId, potsTaken } });
    }
  };

  const updatePotsReturned = (playerId: string, potsReturned: number) => {
    if (currentSession?.isActive) {
      dispatch({ type: 'UPDATE_POTS_RETURNED', payload: { playerId, potsReturned } });
    }
  };

  const getSessionSummary = (): SessionSummary | null => {
    if (!currentSession) return null;

    const playerSummaries: PlayerSummary[] = currentSession.players.map(player => {
      const totalPotsTaken = player.potsTaken;
      const totalPotsReturned = player.potsReturned;
      const totalPotsTakenValue = totalPotsTaken * currentSession.potValue;
      const totalPotsReturnedValue = totalPotsReturned * currentSession.potValue;
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
      sessionId: currentSession.id,
      potValue: currentSession.potValue,
      playerSummaries,
    };
  };

  return (
    <PokerContext.Provider
      value={{
        session: currentSession,
        previousSessions,
        startSession,
        endSession,
        addPlayer,
        updatePotsTaken,
        updatePotsReturned,
        getSessionSummary,
      }}
    >
      {children}
    </PokerContext.Provider>
  );
}

// Custom hook
export function usePoker() {
  const context = useContext(PokerContext);
  if (context === undefined) {
    throw new Error('usePoker must be used within a PokerProvider');
  }
  return context;
} 