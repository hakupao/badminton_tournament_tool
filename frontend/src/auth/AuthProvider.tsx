import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseReady, type SupabaseServiceError } from '../lib/supabaseClient';

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
  message: '当前运行于离线模式，无法连接 Supabase。',
  hint: '请配置环境变量后重启应用，或者继续使用本地缓存。',
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>(() => (isSupabaseReady() ? 'online' : 'offline'));

  useEffect(() => {
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

  const signInWithOtp = async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return notConfiguredError();
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
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
