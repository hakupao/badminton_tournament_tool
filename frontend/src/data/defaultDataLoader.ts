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

const REQUIRED_KEYS = ['badminton_matches', 'tournamentConfig', 'tournamentPlayers'] as const;

const setIfMissing = (key: string, value: unknown) => {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const seedDefaultDataIfNeeded = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    const isFreshInstall = REQUIRED_KEYS.every((key) => localStorage.getItem(key) === null);
    if (!isFreshInstall) {
      return;
    }

    const bundle = defaultData as DefaultDataBundle;

    if (Array.isArray(bundle.matches)) {
      setIfMissing('badminton_matches', bundle.matches);
      setIfMissing('tournamentMatches', bundle.matches);
    }

    if (Array.isArray(bundle.timeSlots)) {
      setIfMissing('badminton_timeSlots', bundle.timeSlots);
    }

    if (Array.isArray(bundle.players)) {
      setIfMissing('tournamentPlayers', bundle.players);
    }

    if (Array.isArray(bundle.tournamentSchedule)) {
      setIfMissing('tournamentSchedule', bundle.tournamentSchedule);
    }

    if (Array.isArray(bundle.tournamentFormations)) {
      setIfMissing('tournamentFormations', bundle.tournamentFormations);
    }

    if (bundle.tournamentConfig && typeof bundle.tournamentConfig === 'object') {
      setIfMissing('tournamentConfig', bundle.tournamentConfig);
    }

    const seedMarker = bundle.exportedAt ?? 'seeded';
    localStorage.setItem('badminton_default_seed_version', seedMarker);
  } catch (error) {
    console.error('Failed to seed default badminton data', error);
  }
};
