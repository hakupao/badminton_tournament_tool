import { useMemo } from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  loadFormations,
  loadImportState,
  loadMatches,
  loadPlayers,
  loadSchedule,
  loadTimeSlots,
  loadTournamentConfig,
  saveFormations,
  saveImportState,
  saveMatches,
  savePlayers,
  saveSchedule,
  saveTimeSlots,
  saveTournamentConfig,
} from '../services/dataService';
import type { FormationConfig, Match, PlayerInfo, ScheduleItem, TournamentConfig } from '../types';

export const useUserDataService = () => {
  const { user, mode } = useAuth();
  const userId = mode === 'online' ? user?.id ?? null : null;

  return useMemo(
    () => ({
      userId,
      loadTournamentConfig: () => loadTournamentConfig(userId),
      saveTournamentConfig: (config: TournamentConfig | null) => saveTournamentConfig(userId, config),
      loadPlayers: () => loadPlayers(userId),
      savePlayers: (players: PlayerInfo[]) => savePlayers(userId, players),
      loadFormations: () => loadFormations(userId),
      saveFormations: (formations: FormationConfig[]) => saveFormations(userId, formations),
      loadMatches: () => loadMatches(userId),
      saveMatches: (matches: Match[]) => saveMatches(userId, matches),
      loadTimeSlots: () => loadTimeSlots(userId),
      saveTimeSlots: (slots: string[]) => saveTimeSlots(userId, slots),
      loadSchedule: () => loadSchedule(userId),
      saveSchedule: (items: ScheduleItem[]) => saveSchedule(userId, items),
      loadImportState: () => loadImportState(userId),
      saveImportState: (state: { seedVersion: string; lastError?: string | null }) => saveImportState(userId, state),
    }),
    [userId]
  );
};

export default useUserDataService;
