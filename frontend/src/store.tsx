import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { message } from 'antd';
import { useAuth } from './auth/AuthProvider';
import {
  ensureDefaultDataSeeded,
  resetLocalCache,
  type SeedOutcome,
} from './data/defaultDataLoader';
import { saveMatches, saveTimeSlots } from './services/dataService';
import type { Match } from './types';
import { ensureMatchIds } from './utils/matchIds';
import type { SupabaseServiceError } from './lib/supabaseClient';

interface AppState {
  matches: Match[];
  timeSlots: string[];
  setMatches: (matches: Match[] | ((prev: Match[]) => Match[])) => void;
  setTimeSlots: (timeSlots: string[]) => void;
  updateMatchResult: (matchId: string, result: Partial<Match>) => void;
  reload: () => Promise<void>;
  isLoading: boolean;
  dataSource: 'supabase' | 'local';
  lastError: SupabaseServiceError | null;
}

export const AppContext = createContext<AppState | undefined>(undefined);

const emptyOutcome: SeedOutcome = {
  seeded: false,
  data: {
    matches: [],
    timeSlots: [],
    players: [],
    schedule: [],
    formations: [],
    config: null,
  },
  source: 'local',
  errors: [],
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, mode } = useAuth();
  const userId = mode === 'online' ? user?.id ?? null : null;

  const [matches, setMatchesState] = useState<Match[]>([]);
  const [timeSlots, setTimeSlotsState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'supabase' | 'local'>('local');
  const [lastError, setLastError] = useState<SupabaseServiceError | null>(null);

  const applyOutcome = useCallback((outcome: SeedOutcome) => {
    setMatchesState(outcome.data.matches);
    setTimeSlotsState(outcome.data.timeSlots);
    setDataSource(outcome.source);
    setLastError(outcome.errors[0] ?? null);
  }, []);

  const loadAndApply = useCallback(async () => {
    try {
      const outcome = await ensureDefaultDataSeeded(userId);
      applyOutcome(outcome);
      return outcome;
    } catch (error) {
      const normalized: SupabaseServiceError = {
        message: error instanceof Error ? error.message : '数据加载失败',
        cause: error,
      };
      setLastError(normalized);
      applyOutcome(emptyOutcome);
      throw error;
    }
  }, [applyOutcome, userId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    loadAndApply()
      .catch(() => {
        if (active) {
          message.error('加载数据失败，已回退至离线缓存。');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [loadAndApply]);

  const persistMatches = useCallback(
    async (nextMatches: Match[]) => {
      const result = await saveMatches(userId, nextMatches);
      if (result.error) {
        setLastError(result.error);
        message.error(result.error.message);
      }
    },
    [userId]
  );

  const persistTimeSlots = useCallback(
    async (nextTimeSlots: string[]) => {
      const result = await saveTimeSlots(userId, nextTimeSlots);
      if (result.error) {
        setLastError(result.error);
        message.error(result.error.message);
      }
    },
    [userId]
  );

  const setMatches = useCallback(
    (nextMatches: Match[] | ((prev: Match[]) => Match[])) => {
      setMatchesState((prev) => {
        const resolved = typeof nextMatches === 'function' ? (nextMatches as (prev: Match[]) => Match[])(prev) : nextMatches;
        const normalized = ensureMatchIds(resolved);
        void persistMatches(normalized);
        return normalized;
      });
    },
    [persistMatches]
  );

  const setTimeSlots = useCallback(
    (nextTimeSlots: string[]) => {
      setTimeSlotsState(nextTimeSlots);
      void persistTimeSlots(nextTimeSlots);
    },
    [persistTimeSlots]
  );

  const updateMatchResult = useCallback(
    (matchId: string, result: Partial<Match>) => {
      setMatches((prevMatches) =>
        prevMatches.map((match) => (match.id === matchId ? { ...match, ...result } : match))
      );
    },
    [setMatches]
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadAndApply();
    } finally {
      setIsLoading(false);
    }
  }, [loadAndApply]);

  const value = useMemo<AppState>(
    () => ({
      matches,
      timeSlots,
      setMatches,
      setTimeSlots,
      updateMatchResult,
      reload,
      isLoading,
      dataSource,
      lastError,
    }),
    [matches, timeSlots, setMatches, setTimeSlots, updateMatchResult, reload, isLoading, dataSource, lastError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState 必须在 AppProvider 内使用');
  }
  return context;
};

export const useResetLocalCache = () => {
  const reset = useCallback(() => {
    resetLocalCache();
  }, []);
  return reset;
};
