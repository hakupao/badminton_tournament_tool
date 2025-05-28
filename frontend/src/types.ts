export interface Team {
  id: string;
  name: string;
  createdAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  gender: 'M' | 'F';
  skillLevel: number;
  createdAt: string;
}

export interface Formation {
  id: string;
  teamId: string;
  type: 'MD1' | 'MD2' | 'XD1';
  playerIds: string[];
  createdAt: string;
}

export interface Match {
  id: string;
  round: number;
  timeSlot: number;
  court: number;
  matchType: string;
  teamA_Id: string;
  teamB_Id: string;
  teamA_Name?: string;
  teamB_Name?: string;
  teamA_Players: string[];
  teamB_Players: string[];
  teamA_PlayerNames?: string[];
  teamB_PlayerNames?: string[];
  status: 'pending' | 'ongoing' | 'finished';
  scores: Array<{
    set: number;
    teamAScore: number;
    teamBScore: number;
  }>;
  winner_TeamId?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  matches: string[];
  totalRounds: number;
  totalTimeSlots: number;
  courtsUsed: number;
  createdAt: string;
} 