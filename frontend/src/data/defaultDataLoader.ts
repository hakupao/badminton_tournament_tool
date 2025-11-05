import defaultData from './default-data.json';
import dataService, {
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
  type LoadResult,
  type SaveResult,
} from '../services/dataService';
import type {
  FormationConfig,
  Match,
  PlayerInfo,
  ScheduleItem,
  TournamentConfig,
} from '../types';
import type { SupabaseServiceError } from '../lib/supabaseClient';

interface DefaultDataBundle {
  version?: string;
  exportedAt?: string;
  matches?: Match[];
  timeSlots?: string[];
  players?: PlayerInfo[];
  tournamentMatches?: Match[];
  tournamentSchedule?: ScheduleItem[];
  tournamentConfig?: TournamentConfig | null;
  tournamentFormations?: FormationConfig[];
}

interface SeededData {
  config: TournamentConfig | null;
  players: PlayerInfo[];
  matches: Match[];
  timeSlots: string[];
  schedule: ScheduleItem[];
  formations: FormationConfig[];
}

export interface SeedOutcome {
  seeded: boolean;
  data: SeededData;
  source: 'supabase' | 'local';
  errors: SupabaseServiceError[];
}

const bundle = defaultData as DefaultDataBundle;
const seedVersion = bundle.version ?? bundle.exportedAt ?? 'seeded';

const isEmptyData = (results: {
  config: LoadResult<TournamentConfig | null>;
  players: LoadResult<PlayerInfo[]>;
  matches: LoadResult<Match[]>;
}) => {
  const noConfig = !results.config.data;
  const noPlayers = results.players.data.length === 0;
  const noMatches = results.matches.data.length === 0;
  return noConfig || noPlayers || noMatches;
};

const bundleToSeededData = (): SeededData => ({
  config: bundle.tournamentConfig ?? null,
  players: Array.isArray(bundle.players) ? bundle.players : [],
  matches: Array.isArray(bundle.matches) ? bundle.matches : Array.isArray(bundle.tournamentMatches) ? bundle.tournamentMatches : [],
  timeSlots: Array.isArray(bundle.timeSlots) ? bundle.timeSlots : [],
  schedule: Array.isArray(bundle.tournamentSchedule) ? bundle.tournamentSchedule : [],
  formations: Array.isArray(bundle.tournamentFormations) ? bundle.tournamentFormations : [],
});

const collectError = <T>(result: SaveResult<T>, errors: SupabaseServiceError[]) => {
  if (result.error) {
    errors.push(result.error);
  }
};

export const ensureDefaultDataSeeded = async (
  userId: string | null
): Promise<SeedOutcome> => {
  const [config, players, matches, timeSlots, schedule, formations, importState] = await Promise.all([
    loadTournamentConfig(userId),
    loadPlayers(userId),
    loadMatches(userId),
    loadTimeSlots(userId),
    loadSchedule(userId),
    loadFormations(userId),
    loadImportState(userId),
  ]);

  const existing = { config, players, matches, timeSlots, schedule, formations };
  const seedData = bundleToSeededData();
  const errors: SupabaseServiceError[] = [];

  const needsSeeding = isEmptyData(existing);

  if (!needsSeeding) {
    if (importState.data?.seed_version !== seedVersion) {
      const saveMarker = await saveImportState(userId, {
        seedVersion,
        lastError: importState.error?.message ?? null,
      });
      collectError(saveMarker, errors);
    }
    return {
      seeded: false,
      data: {
        config: config.data ?? seedData.config,
        players: players.data.length > 0 ? players.data : seedData.players,
        matches: matches.data.length > 0 ? matches.data : seedData.matches,
        timeSlots: timeSlots.data.length > 0 ? timeSlots.data : seedData.timeSlots,
        schedule: schedule.data.length > 0 ? schedule.data : seedData.schedule,
        formations: formations.data.length > 0 ? formations.data : seedData.formations,
      },
      source: config.source,
      errors,
    };
  }

  const seededConfig = seedData.config;
  const seededPlayers = seedData.players;
  const seededMatches = seedData.matches;
  const seededTimeSlots = seedData.timeSlots;
  const seededSchedule = seedData.schedule;
  const seededFormations = seedData.formations;

  const saveResults: Array<Promise<void>> = [];

  if (seededConfig) {
    saveResults.push(
      (async () => {
        const result = await saveTournamentConfig(userId, seededConfig);
        collectError(result, errors);
      })()
    );
  } else {
    saveResults.push(
      (async () => {
        const result = await saveTournamentConfig(userId, null);
        collectError(result, errors);
      })()
    );
  }

  saveResults.push(
    (async () => {
      const result = await savePlayers(userId, seededPlayers);
      collectError(result, errors);
    })()
  );

  saveResults.push(
    (async () => {
      const result = await saveMatches(userId, seededMatches);
      collectError(result, errors);
    })()
  );

  saveResults.push(
    (async () => {
      const result = await saveTimeSlots(userId, seededTimeSlots);
      collectError(result, errors);
    })()
  );

  saveResults.push(
    (async () => {
      const result = await saveSchedule(userId, seededSchedule);
      collectError(result, errors);
    })()
  );

  saveResults.push(
    (async () => {
      const result = await saveFormations(userId, seededFormations);
      collectError(result, errors);
    })()
  );

  await Promise.all(saveResults);

  const markerResult = await saveImportState(userId, {
    seedVersion,
    lastError: errors[0]?.message ?? null,
  });
  collectError(markerResult, errors);

  return {
    seeded: true,
    data: {
      config: seededConfig,
      players: seededPlayers,
      matches: seededMatches,
      timeSlots: seededTimeSlots,
      schedule: seededSchedule,
      formations: seededFormations,
    },
    source: markerResult.source,
    errors,
  };
};

export const resetLocalCache = () => {
  dataService.clearLocalCache();
};
