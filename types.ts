export interface PlayerStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  outBy?: string; // e.g., "b. Bowler Name" or "Run Out"
  isOut: boolean;
  
  // Bowling stats
  overs: number;
  ballsBowled: number; // 0-5 for current over calculation
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface Team {
  name: string;
  players: PlayerStats[];
  isBatting: boolean;
  score: number;
  wickets: number;
  oversPlayed: string; // "3.2"
}

export interface MatchConfig {
  teamA: string;
  teamB: string;
  totalOvers: number;
  tossWinner: string;
  electedTo: 'bat' | 'bowl';
}

export interface MatchState {
  id: string; // Unique ID for history
  date: string;
  config: MatchConfig;
  
  currentInning: 1 | 2;
  battingTeam: Team;
  bowlingTeam: Team;
  
  currentStrikerId: number; // Index in battingTeam.players
  currentNonStrikerId: number; // Index in battingTeam.players
  currentBowlerId: number; // Index in bowlingTeam.players
  
  thisOver: string[]; // Current over history
  ballByBallHistory: string[];
  
  target: number | null;
  status: 'live' | 'completed';
  winner?: string;
  winMargin?: string;
}

// Simplified definition for the History list
export interface MatchSummary {
  id: string;
  date: string;
  teamA: string;
  teamB: string;
  winner: string;
  result: string;
}

export interface AnalysisResponse {
  commentary: string;
  winProbability: number;
  tacticalAdvice: string;
}
