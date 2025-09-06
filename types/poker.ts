export interface Player {
  id: string;
  name: string;
  potsTaken: number;
  potsReturned: number;
}

export type PotMode = 'fixed' | 'direct';

export interface Session {
  id: string;
  sessionName: string;
  potValue: number;
  potMode: PotMode;
  players: Player[];
  startTime: Date;
  endTime: Date | null;
  isActive: boolean;
}

export interface SessionSummary {
  sessionId: string;
  potValue: number;
  playerSummaries: PlayerSummary[];
}

export interface PlayerSummary {
  playerId: string;
  playerName: string;
  totalPotsTaken: number;
  totalPotsReturned: number;
  totalPotsTakenValue: number;
  totalPotsReturnedValue: number;
  netBalance: number;
} 