import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseReady, type SupabaseServiceError } from '../lib/supabaseClient';
import { restClient } from '../services/restService';

const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_SERVER === 'true';

type AuthMode = 'online' | 'offline';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  mode: AuthMode;
  signInWithOtp: (email: string) => Promise<SupabaseServiceError | null>;
  signOut: () => Promise<SupabaseServiceError | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const notConfiguredError = (): SupabaseServiceError => ({
  message: '当前运行于离线模式，无法连接 Supabase/Backend。',
  hint: '请配置环境变量后重启应用，或者继续使用本地缓存。',
});

const LOCAL_SESSION_KEY = 'badminton-local-session';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>(() => {
    if (USE_LOCAL_SERVER) return 'online';
    return isSupabaseReady() ? 'online' : 'offline';
  });

  useEffect(() => {
    if (USE_LOCAL_SERVER) {
      setMode('online');
      const savedSession = localStorage.getItem(LOCAL_SESSION_KEY);
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession);
          setSession(sessionData);
          setUser(sessionData.user);
        } catch {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        }
      }
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setMode('offline');
      setIsLoading(false);
      return;
    }

    setMode('online');
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (input: string) => {
    if (USE_LOCAL_SERVER) {
      // In local mode, input is treated as password
      const { data, error } = await restClient.post<{ session: Session }>('/auth/login', { password: input });
      if (error || !data) {
        return { message: error?.message || 'Login failed' };
      }
      setSession(data.session);
      setUser(data.session.user);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data.session));
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return notConfiguredError();
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: input,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        },
      });
      if (error) {
        return {
          message: error.message,
          status: error.status,
          cause: error,
        };
      }
      return null;
    } catch (err) {
      return {
        message: err instanceof Error ? err.message : '登录请求失败',
        cause: err,
      };
    }
  };

  const signOut = async () => {
    if (USE_LOCAL_SERVER) {
      setSession(null);
      setUser(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return notConfiguredError();
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          message: error.message,
          status: error.status,
          cause: error,
        };
      }
      return null;
    } catch (err) {
      return {
        message: err instanceof Error ? err.message : '退出登录失败',
        cause: err,
      };
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      mode,
      signInWithOtp,
      signOut,
    }),
    [user, session, isLoading, mode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
};
