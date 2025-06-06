export interface Match {
  id: string;
  matchNumber?: string;
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