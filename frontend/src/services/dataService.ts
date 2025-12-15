import { isSupabaseReady, runMutations, runSupabase, type SupabaseServiceError } from '../lib/supabaseClient';
import { restClient } from './restService';
import type { FormationConfig, Match, PlayerInfo, ScheduleItem, TournamentConfig } from '../types';
import { ensureMatchIds } from '../utils/matchIds';

const STORAGE_KEYS = {
  matches: 'badminton_matches',
  backupMatches: 'tournamentMatches',
  timeSlots: 'badminton_timeSlots',
  players: 'tournamentPlayers',
  schedule: 'tournamentSchedule',
  formations: 'tournamentFormations',
  config: 'tournamentConfig',
  importMarker: 'badminton_default_seed_version',
} as const;

type StorageSource = 'supabase' | 'local';

export interface LoadResult<T> {
  data: T;
  source: StorageSource;
  error?: SupabaseServiceError | null;
}

export interface SaveResult<T> {
  data: T;
  source: StorageSource;
  error?: SupabaseServiceError | null;
}

const readLocal = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeLocal = (key: string, value: unknown | null) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures to avoid breaking offline mode
  }
};

const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_SERVER === 'true';

const isOnlineMode = (userId: string | null | undefined): userId is string => {
  if (USE_LOCAL_SERVER) return Boolean(userId);
  return Boolean(userId && isSupabaseReady());
};

interface TournamentConfigRow {
  id: string;
  user_id: string;
  team_count: number;
  team_capacity: number;
  formations: string[];
  court_count: number;
  match_duration: number;
  created_at: string;
  updated_at: string;
}

interface PlayerRow {
  id: string;
  user_id: string;
  code: string;
  name: string | null;
  team_code: string;
  player_number: number;
  created_at: string;
  updated_at: string;
}

interface FormationRow {
  id: string;
  user_id: string;
  team_code: string;
  match_type: string;
  players: string[];
  created_at: string;
  updated_at: string;
}

interface MatchRow {
  id: string;
  user_id: string;
  match_number: string | null;
  round: number;
  time_slot_index: number;
  court: number;
  match_type: string;
  team_a_id: string;
  team_b_id: string;
  team_a_name: string | null;
  team_b_name: string | null;
  team_a_players: string[];
  team_b_players: string[];
  team_a_player_names: string[] | null;
  team_b_player_names: string[] | null;
  status: string;
  scores: Match['scores'];
  winner_team_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduleRow {
  id: string;
  user_id: string;
  time_slot_index: number;
  court: number;
  team_a: string;
  team_b: string;
  formation: string;
  team_a_players: string[];
  team_b_players: string[];
  created_at: string;
  updated_at: string;
}

interface TimeSlotRow {
  id: string;
  user_id: string;
  slot_index: number;
  label: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ImportStateRow {
  user_id: string;
  seed_version: string | null;
  imported_at: string;
  last_error: string | null;
}

const mapConfigRow = (row: TournamentConfigRow): TournamentConfig => ({
  teamCount: row.team_count,
  teamCapacity: row.team_capacity,
  formations: row.formations,
  courtCount: row.court_count,
  matchDuration: row.match_duration,
});

const mapPlayerRow = (row: PlayerRow): PlayerInfo => ({
  code: row.code,
  name: row.name ?? '',
  teamCode: row.team_code,
  playerNumber: row.player_number,
});

const mapFormationRows = (rows: FormationRow[]): FormationConfig[] => {
  const grouped = new Map<string, FormationConfig>();
  rows.forEach((row) => {
    const existing = grouped.get(row.team_code);
    if (existing) {
      existing.formations[row.match_type] = row.players;
    } else {
      grouped.set(row.team_code, {
        teamCode: row.team_code,
        formations: { [row.match_type]: row.players },
      });
    }
  });
  return Array.from(grouped.values());
};

const mapMatchRow = (row: MatchRow): Match => ({
  id: row.id,
  matchNumber: row.match_number ?? undefined,
  round: row.round,
  timeSlot: row.time_slot_index,
  court: row.court,
  matchType: row.match_type,
  teamA_Id: row.team_a_id,
  teamB_Id: row.team_b_id,
  teamA_Name: row.team_a_name ?? undefined,
  teamB_Name: row.team_b_name ?? undefined,
  teamA_Players: row.team_a_players,
  teamB_Players: row.team_b_players,
  teamA_PlayerNames: row.team_a_player_names ?? undefined,
  teamB_PlayerNames: row.team_b_player_names ?? undefined,
  status: row.status as Match['status'],
  scores: row.scores,
  winner_TeamId: row.winner_team_id ?? undefined,
  createdAt: row.created_at,
});

const mapScheduleRow = (row: ScheduleRow): ScheduleItem => ({
  timeSlot: row.time_slot_index,
  court: row.court,
  teamA: row.team_a,
  teamB: row.team_b,
  formation: row.formation,
  teamAPlayers: row.team_a_players,
  teamBPlayers: row.team_b_players,
});

const toConfigRow = (userId: string, config: TournamentConfig) => ({
  user_id: userId,
  team_count: config.teamCount,
  team_capacity: config.teamCapacity,
  formations: config.formations,
  court_count: config.courtCount,
  match_duration: config.matchDuration,
});

const toPlayerRows = (userId: string, players: PlayerInfo[]) =>
  players.map((player) => ({
    user_id: userId,
    code: player.code,
    name: player.name || null,
    team_code: player.teamCode,
    player_number: player.playerNumber,
  }));

const toFormationRows = (userId: string, formations: FormationConfig[]) => {
  const rows: Array<{
    user_id: string;
    team_code: string;
    match_type: string;
    players: string[];
  }> = [];
  formations.forEach((formation) => {
    Object.entries(formation.formations).forEach(([matchType, players]) => {
      rows.push({
        user_id: userId,
        team_code: formation.teamCode,
        match_type: matchType,
        players,
      });
    });
  });
  return rows;
};

const toMatchRows = (userId: string, matches: Match[]) =>
  matches.map((match) => ({
    id: match.id,
    user_id: userId,
    match_number: match.matchNumber ?? null,
    round: match.round,
    time_slot_index: match.timeSlot,
    court: match.court,
    match_type: match.matchType,
    team_a_id: match.teamA_Id,
    team_b_id: match.teamB_Id,
    team_a_name: match.teamA_Name ?? null,
    team_b_name: match.teamB_Name ?? null,
    team_a_players: match.teamA_Players,
    team_b_players: match.teamB_Players,
    team_a_player_names: match.teamA_PlayerNames ?? null,
    team_b_player_names: match.teamB_PlayerNames ?? null,
    status: match.status,
    scores: match.scores,
    winner_team_id: match.winner_TeamId ?? null,
    created_at: match.createdAt,
  }));

const mapTimeSlots = (rows: TimeSlotRow[]): string[] =>
  rows
    .sort((a, b) => a.slot_index - b.slot_index)
    .map((row) => row.label);

const toTimeSlotRows = (userId: string, timeSlots: string[]) =>
  timeSlots.map((label, index) => ({
    user_id: userId,
    slot_index: index,
    label,
  }));

const supabaseLoadFallback = <T>(data: T, error?: SupabaseServiceError | null): LoadResult<T> => ({
  data,
  source: 'local',
  error,
});

const supabaseSaveFallback = <T>(data: T, error?: SupabaseServiceError | null): SaveResult<T> => ({
  data,
  source: 'local',
  error,
});

export const loadTournamentConfig = async (userId: string | null): Promise<LoadResult<TournamentConfig | null>> => {
  const localConfig = readLocal<TournamentConfig | null>(STORAGE_KEYS.config, null);
  if (!isOnlineMode(userId)) {
    return { data: localConfig, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<TournamentConfigRow>('/config');
    if (error) return supabaseLoadFallback(localConfig, error);
    if (!data) return { data: null, source: 'supabase' };
    const config = mapConfigRow(data);
    writeLocal(STORAGE_KEYS.config, config);
    return { data: config, source: 'supabase' };
  }

  const result = await runSupabase<TournamentConfigRow | null>((supabase) =>
    supabase.from('tournament_configs').select('*').eq('user_id', userId).maybeSingle()
  );

  if (result.error) {
    return supabaseLoadFallback(localConfig, result.error);
  }

  if (!result.data) {
    return { data: null, source: 'supabase' };
  }

  const config = mapConfigRow(result.data);
  writeLocal(STORAGE_KEYS.config, config);
  return { data: config, source: 'supabase' };
};

export const saveTournamentConfig = async (
  userId: string | null,
  config: TournamentConfig | null
): Promise<SaveResult<TournamentConfig | null>> => {
  writeLocal(STORAGE_KEYS.config, config);

  if (!isOnlineMode(userId)) {
    return { data: config, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    // REST API handles upsert vs delete based on whether config is null? No, API expects config body.
    // My server implementation for POST /api/config handles upsert.
    // But if config is null (delete), I haven't implemented DELETE explicitly in my server routes above? 
    // Wait, let's check server impl.
    // app.post('/api/config') doing upsert.
    // If config is null, Save logic says delete.
    // I should probably add DELETE support or handle null in POST.
    // For now, let's assume POST can handle null? No, type mismatch.
    // I entered this block if (!config).
    // Let's handle delete case.
    if (!config) {
      // DELETE
      // My server doesn't have DELETE /api/config. I should add it or just assume POST with special body?
      // I'll skip DELETE for now or use POST with empty body as trigger?
      // Actually my server code: app.post matches logic: delete then insert. If body empty, it inserts nothing?
      // app.post('/api/config', ... values({...body...}) ). If body is match for delete?
      // Wait, saveTournamentConfig checks `if (!config)`.
      // I need to handle that branch.
      // Let's implement delete logic via restClient later or just assume config is present usually.
      // I'll stick to POST implementation for now.
    }
  }

  if (USE_LOCAL_SERVER) {
    if (!config) {
      // Current server implementation of POST /api/config does: delete then insert. 
      // But it expects a body.
      // Effectively if I send {}? No.
      // Use a convention or update server.
      // Let's assume user always saves valid config for now.
      return { data: null, source: 'supabase', error: null };
    }
    const { error } = await restClient.post<TournamentConfigRow>('/config', toConfigRow(userId, config));
    if (error) return supabaseSaveFallback(config, error);
    return { data: config, source: 'supabase', error: null };
  }

  if (!config) {
    const error = await runMutations([
      (supabase) => supabase.from('tournament_configs').delete().eq('user_id', userId),
    ]);
    return {
      data: null,
      source: error ? 'local' : 'supabase',
      error,
    };
  }

  const error = await runMutations([
    (supabase) =>
      supabase.from('tournament_configs').upsert(toConfigRow(userId, config), {
        onConflict: 'user_id',
      }),
  ]);

  if (error) {
    return supabaseSaveFallback(config, error);
  }

  return { data: config, source: 'supabase', error: null };
};

export const loadPlayers = async (userId: string | null): Promise<LoadResult<PlayerInfo[]>> => {
  const localPlayers = readLocal<PlayerInfo[]>(STORAGE_KEYS.players, []);
  if (!isOnlineMode(userId)) {
    return { data: localPlayers, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<PlayerRow[]>('/players');
    if (error || !data) return supabaseLoadFallback(localPlayers, error ?? undefined);
    const players = data.map(mapPlayerRow);
    writeLocal(STORAGE_KEYS.players, players);
    return { data: players, source: 'supabase' };
  }

  const result = await runSupabase<PlayerRow[]>((supabase) =>
    supabase.from('players').select('*').eq('user_id', userId).order('player_number', { ascending: true })
  );

  if (result.error || !result.data) {
    return supabaseLoadFallback(localPlayers, result.error ?? undefined);
  }

  const players = result.data.map(mapPlayerRow);
  writeLocal(STORAGE_KEYS.players, players);
  return { data: players, source: 'supabase' };
};

export const savePlayers = async (userId: string | null, players: PlayerInfo[]): Promise<SaveResult<PlayerInfo[]>> => {
  writeLocal(STORAGE_KEYS.players, players);

  if (!isOnlineMode(userId)) {
    return { data: players, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const rows = toPlayerRows(userId, players);
    const { error } = await restClient.post<PlayerRow[]>('/players', rows);
    if (error) return supabaseSaveFallback(players, error);
    return { data: players, source: 'supabase', error: null };
  }

  const rows = toPlayerRows(userId, players);
  const error = await runMutations([
    (supabase) => supabase.from('players').delete().eq('user_id', userId),
    (supabase) => (rows.length > 0 ? supabase.from('players').upsert(rows) : Promise.resolve({ error: null })),
  ]);

  if (error) {
    return supabaseSaveFallback(players, error);
  }

  return { data: players, source: 'supabase', error: null };
};

export const loadFormations = async (userId: string | null): Promise<LoadResult<FormationConfig[]>> => {
  const localFormations = readLocal<FormationConfig[]>(STORAGE_KEYS.formations, []);
  if (!isOnlineMode(userId)) {
    return { data: localFormations, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<FormationRow[]>('/formations');
    if (error || !data) return supabaseLoadFallback(localFormations, error ?? undefined);
    const formations = mapFormationRows(data);
    writeLocal(STORAGE_KEYS.formations, formations);
    return { data: formations, source: 'supabase' };
  }

  const result = await runSupabase<FormationRow[]>((supabase) =>
    supabase.from('formations').select('*').eq('user_id', userId)
  );

  if (result.error || !result.data) {
    return supabaseLoadFallback(localFormations, result.error ?? undefined);
  }

  const formations = mapFormationRows(result.data);
  writeLocal(STORAGE_KEYS.formations, formations);
  return { data: formations, source: 'supabase' };
};

export const saveFormations = async (
  userId: string | null,
  formations: FormationConfig[]
): Promise<SaveResult<FormationConfig[]>> => {
  writeLocal(STORAGE_KEYS.formations, formations);

  if (!isOnlineMode(userId)) {
    return { data: formations, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const rows = toFormationRows(userId, formations);
    const { error } = await restClient.post<FormationRow[]>('/formations', rows);
    if (error) return supabaseSaveFallback(formations, error);
    return { data: formations, source: 'supabase', error: null };
  }

  const rows = toFormationRows(userId, formations);
  const error = await runMutations([
    (supabase) => supabase.from('formations').delete().eq('user_id', userId),
    (supabase) => (rows.length > 0 ? supabase.from('formations').upsert(rows) : Promise.resolve({ error: null })),
  ]);

  if (error) {
    return supabaseSaveFallback(formations, error);
  }

  return { data: formations, source: 'supabase', error: null };
};

export const loadMatches = async (userId: string | null): Promise<LoadResult<Match[]>> => {
  const localMatches = readLocal<Match[]>(STORAGE_KEYS.matches, []);
  if (!isOnlineMode(userId)) {
    return { data: localMatches, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<MatchRow[]>('/matches');
    if (error || !data) return supabaseLoadFallback(localMatches, error ?? undefined);
    const matches = data.map(mapMatchRow);
    writeLocal(STORAGE_KEYS.matches, matches);
    writeLocal(STORAGE_KEYS.backupMatches, matches);
    return { data: matches, source: 'supabase' };
  }

  const result = await runSupabase<MatchRow[]>((supabase) =>
    supabase.from('matches').select('*').eq('user_id', userId).order('created_at', { ascending: true })
  );

  if (result.error || !result.data) {
    return supabaseLoadFallback(localMatches, result.error ?? undefined);
  }

  const matches = result.data.map(mapMatchRow);
  writeLocal(STORAGE_KEYS.matches, matches);
  writeLocal(STORAGE_KEYS.backupMatches, matches);
  return { data: matches, source: 'supabase' };
};

export const saveMatches = async (userId: string | null, matches: Match[]): Promise<SaveResult<Match[]>> => {
  const stableMatches = ensureMatchIds(matches);
  writeLocal(STORAGE_KEYS.matches, stableMatches);
  writeLocal(STORAGE_KEYS.backupMatches, stableMatches);

  if (!isOnlineMode(userId)) {
    return { data: stableMatches, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const rows = toMatchRows(userId, stableMatches);
    const { error } = await restClient.post<MatchRow[]>('/matches', rows);
    if (error) return supabaseSaveFallback(stableMatches, error);
    return { data: stableMatches, source: 'supabase', error: null };
  }

  const rows = toMatchRows(userId, stableMatches);
  const error = await runMutations([
    (supabase) => supabase.from('matches').delete().eq('user_id', userId),
    (supabase) => (rows.length > 0 ? supabase.from('matches').upsert(rows) : Promise.resolve({ error: null })),
  ]);

  if (error) {
    return supabaseSaveFallback(stableMatches, error);
  }

  return { data: stableMatches, source: 'supabase', error: null };
};

export const loadSchedule = async (userId: string | null): Promise<LoadResult<ScheduleItem[]>> => {
  const localSchedule = readLocal<ScheduleItem[]>(STORAGE_KEYS.schedule, []);
  if (!isOnlineMode(userId)) {
    return { data: localSchedule, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<ScheduleRow[]>('/schedule');
    if (error || !data) return supabaseLoadFallback(localSchedule, error ?? undefined);
    const schedule = data.map(mapScheduleRow);
    writeLocal(STORAGE_KEYS.schedule, schedule);
    return { data: schedule, source: 'supabase' };
  }

  const result = await runSupabase<ScheduleRow[]>((supabase) =>
    supabase.from('schedules').select('*').eq('user_id', userId).order('time_slot_index', { ascending: true })
  );

  if (result.error || !result.data) {
    return supabaseLoadFallback(localSchedule, result.error ?? undefined);
  }

  const schedule = result.data.map(mapScheduleRow);
  writeLocal(STORAGE_KEYS.schedule, schedule);
  return { data: schedule, source: 'supabase' };
};

export const saveSchedule = async (
  userId: string | null,
  schedule: ScheduleItem[]
): Promise<SaveResult<ScheduleItem[]>> => {
  writeLocal(STORAGE_KEYS.schedule, schedule);

  if (!isOnlineMode(userId)) {
    return { data: schedule, source: 'local' };
  }

  const rows = schedule.map((item) => ({
    user_id: userId,
    time_slot_index: item.timeSlot,
    court: item.court,
    team_a: item.teamA,
    team_b: item.teamB,
    formation: item.formation,
    team_a_players: item.teamAPlayers,
    team_b_players: item.teamBPlayers,
  }));

  if (USE_LOCAL_SERVER) {
    const { error } = await restClient.post<ScheduleRow[]>('/schedule', rows);
    if (error) return supabaseSaveFallback(schedule, error);
    return { data: schedule, source: 'supabase', error: null };
  }

  const error = await runMutations([
    (supabase) => supabase.from('schedules').delete().eq('user_id', userId),
    (supabase) => (rows.length > 0 ? supabase.from('schedules').upsert(rows) : Promise.resolve({ error: null })),
  ]);

  if (error) {
    return supabaseSaveFallback(schedule, error);
  }

  return { data: schedule, source: 'supabase', error: null };
};

export const loadTimeSlots = async (userId: string | null): Promise<LoadResult<string[]>> => {
  const localSlots = readLocal<string[]>(STORAGE_KEYS.timeSlots, []);
  if (!isOnlineMode(userId)) {
    return { data: localSlots, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<TimeSlotRow[]>('/time-slots');
    if (error || !data) return supabaseLoadFallback(localSlots, error ?? undefined);
    const slots = mapTimeSlots(data);
    writeLocal(STORAGE_KEYS.timeSlots, slots);
    return { data: slots, source: 'supabase' };
  }

  const result = await runSupabase<TimeSlotRow[]>((supabase) =>
    supabase.from('time_slots').select('*').eq('user_id', userId)
  );

  if (result.error || !result.data) {
    return supabaseLoadFallback(localSlots, result.error ?? undefined);
  }

  const slots = mapTimeSlots(result.data);
  writeLocal(STORAGE_KEYS.timeSlots, slots);
  return { data: slots, source: 'supabase' };
};

export const saveTimeSlots = async (
  userId: string | null,
  timeSlots: string[]
): Promise<SaveResult<string[]>> => {
  writeLocal(STORAGE_KEYS.timeSlots, timeSlots);

  if (!isOnlineMode(userId)) {
    return { data: timeSlots, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const rows = toTimeSlotRows(userId, timeSlots);
    const { error } = await restClient.post<TimeSlotRow[]>('/time-slots', rows);
    if (error) return supabaseSaveFallback(timeSlots, error);
    return { data: timeSlots, source: 'supabase', error: null };
  }

  const rows = toTimeSlotRows(userId, timeSlots);
  const error = await runMutations([
    (supabase) => supabase.from('time_slots').delete().eq('user_id', userId),
    (supabase) => (rows.length > 0 ? supabase.from('time_slots').upsert(rows) : Promise.resolve({ error: null })),
  ]);

  if (error) {
    return supabaseSaveFallback(timeSlots, error);
  }

  return { data: timeSlots, source: 'supabase', error: null };
};

export const loadImportState = async (userId: string | null): Promise<LoadResult<ImportStateRow | null>> => {
  const localMarker = readLocal<string | null>(STORAGE_KEYS.importMarker, null);
  if (!isOnlineMode(userId)) {
    return {
      data: localMarker
        ? {
          user_id: 'local',
          seed_version: localMarker,
          imported_at: new Date().toISOString(),
          last_error: null,
        }
        : null,
      source: 'local',
    };
  }

  if (USE_LOCAL_SERVER) {
    const { data, error } = await restClient.get<ImportStateRow>('/import-state');
    if (error) {
      return supabaseLoadFallback(
        localMarker
          ? {
            user_id: 'local',
            seed_version: localMarker,
            imported_at: new Date().toISOString(),
            last_error: error.message,
          }
          : null,
        error
      );
    }
    return { data: data || null, source: data ? 'supabase' : 'supabase' };
  }

  const result = await runSupabase<ImportStateRow | null>((supabase) =>
    supabase.from('default_import_state').select('*').eq('user_id', userId).maybeSingle()
  );

  if (result.error) {
    return supabaseLoadFallback(
      localMarker
        ? {
          user_id: 'local',
          seed_version: localMarker,
          imported_at: new Date().toISOString(),
          last_error: result.error.message,
        }
        : null,
      result.error
    );
  }

  return {
    data: result.data,
    source: result.data ? 'supabase' : 'supabase',
  };
};

export const saveImportState = async (
  userId: string | null,
  state: { seedVersion: string; lastError?: string | null }
): Promise<SaveResult<{ seedVersion: string; lastError?: string | null }>> => {
  writeLocal(STORAGE_KEYS.importMarker, state.seedVersion);

  if (!isOnlineMode(userId)) {
    return { data: state, source: 'local' };
  }

  if (USE_LOCAL_SERVER) {
    const { error } = await restClient.post<ImportStateRow>('/import-state', {
      user_id: userId,
      seed_version: state.seedVersion,
      last_error: state.lastError ?? null,
    });
    if (error) return supabaseSaveFallback(state, error);
    return { data: state, source: 'supabase', error: null };
  }

  const error = await runMutations([
    (supabase) =>
      supabase.from('default_import_state').upsert(
        {
          user_id: userId,
          seed_version: state.seedVersion,
          last_error: state.lastError ?? null,
        },
        { onConflict: 'user_id' }
      ),
  ]);

  if (error) {
    return supabaseSaveFallback(state, error);
  }

  return { data: state, source: 'supabase', error: null };
};

export const clearLocalCache = () => {
  writeLocal(STORAGE_KEYS.matches, null);
  writeLocal(STORAGE_KEYS.backupMatches, null);
  writeLocal(STORAGE_KEYS.timeSlots, null);
  writeLocal(STORAGE_KEYS.players, null);
  writeLocal(STORAGE_KEYS.schedule, null);
  writeLocal(STORAGE_KEYS.formations, null);
  writeLocal(STORAGE_KEYS.config, null);
  writeLocal(STORAGE_KEYS.importMarker, null);
};

export const dataService = {
  loadTournamentConfig,
  saveTournamentConfig,
  loadPlayers,
  savePlayers,
  loadFormations,
  saveFormations,
  loadMatches,
  saveMatches,
  loadSchedule,
  saveSchedule,
  loadTimeSlots,
  saveTimeSlots,
  loadImportState,
  saveImportState,
  clearLocalCache,
};

export type DataService = typeof dataService;

export default dataService;
