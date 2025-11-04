import defaultData from './default-data.json';
import { Match } from '../types';

interface DefaultDataBundle {
  version?: string;
  exportedAt?: string;
  matches?: Match[];
  timeSlots?: string[];
  players?: unknown[];
  tournamentMatches?: Match[];
  tournamentSchedule?: unknown[];
  tournamentConfig?: Record<string, unknown> | null;
  tournamentFormations?: unknown[];
}

const STORAGE_KEYS = {
  matches: 'badminton_matches',
  backupMatches: 'tournamentMatches',
  timeSlots: 'badminton_timeSlots',
  players: 'tournamentPlayers',
  schedule: 'tournamentSchedule',
  formations: 'tournamentFormations',
  config: 'tournamentConfig',
  marker: 'badminton_default_seed_version',
} as const;

const parseArray = (raw: string | null) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseObject = (raw: string | null) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

const setIfMissingOrEmptyArray = (key: string, value: unknown[]) => {
  const existing = parseArray(localStorage.getItem(key));
  if (!existing || existing.length === 0) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const setIfMissingOrEmptyObject = (key: string, value: Record<string, unknown> | null | undefined) => {
  const existing = parseObject(localStorage.getItem(key));
  if (!existing || Object.keys(existing).length === 0) {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

export const seedDefaultDataIfNeeded = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    if (localStorage.getItem(STORAGE_KEYS.marker)) {
      return;
    }

    const bundle = defaultData as DefaultDataBundle;

    const matches = parseArray(localStorage.getItem(STORAGE_KEYS.matches));
    const config = parseObject(localStorage.getItem(STORAGE_KEYS.config));
    const players = parseArray(localStorage.getItem(STORAGE_KEYS.players));

    const needsSeeding =
      (!matches || matches.length === 0) ||
      !config ||
      (!players || players.length === 0);

    if (!needsSeeding) {
      // Mark as checked to avoid repeated parsing next time.
      localStorage.setItem(STORAGE_KEYS.marker, 'skipped');
      return;
    }

    if (Array.isArray(bundle.matches)) {
      setIfMissingOrEmptyArray(STORAGE_KEYS.matches, bundle.matches);
      setIfMissingOrEmptyArray(STORAGE_KEYS.backupMatches, bundle.matches);
    }

    if (Array.isArray(bundle.timeSlots)) {
      setIfMissingOrEmptyArray(STORAGE_KEYS.timeSlots, bundle.timeSlots);
    }

    if (Array.isArray(bundle.players)) {
      setIfMissingOrEmptyArray(STORAGE_KEYS.players, bundle.players);
    }

    if (Array.isArray(bundle.tournamentSchedule)) {
      setIfMissingOrEmptyArray(STORAGE_KEYS.schedule, bundle.tournamentSchedule);
    }

    if (Array.isArray(bundle.tournamentFormations)) {
      setIfMissingOrEmptyArray(STORAGE_KEYS.formations, bundle.tournamentFormations);
    }

    setIfMissingOrEmptyObject(STORAGE_KEYS.config, bundle.tournamentConfig ?? undefined);

    const seedMarker = bundle.exportedAt ?? 'seeded';
    localStorage.setItem(STORAGE_KEYS.marker, seedMarker);
  } catch (error) {
    console.error('Failed to seed default badminton data', error);
  }
};
