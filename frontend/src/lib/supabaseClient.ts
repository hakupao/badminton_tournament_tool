import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const client = isConfigured && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'badminton-supabase-auth',
      },
    })
  : null;

export interface SupabaseServiceError {
  message: string;
  status?: number;
  hint?: string;
  cause?: unknown;
}

export interface SupabaseResult<T> {
  data: T | null;
  error: SupabaseServiceError | null;
}

const normalizeError = (error: PostgrestError | Error | unknown): SupabaseServiceError => {
  if (!error) {
    return {
      message: '未知错误',
    };
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const err = error as PostgrestError & Error & { hint?: string; code?: string };
    return {
      message: err.message ?? '请求失败',
      status: 'status' in err && typeof err.status === 'number' ? err.status : undefined,
      hint: 'hint' in err && typeof err.hint === 'string' ? err.hint : undefined,
      cause: err,
    };
  }

  return {
    message: String(error),
    cause: error,
  };
};

export const isSupabaseReady = () => Boolean(client);

export const getSupabaseClient = (): SupabaseClient | null => client;

export const runSupabase = async <T>(
  operation: (
    supabase: SupabaseClient
  ) => Promise<{ data: T | null; error: PostgrestError | null }> | PromiseLike<{ data: T | null; error: PostgrestError | null }>
): Promise<SupabaseResult<T>> => {
  if (!client) {
    return {
      data: null,
      error: {
        message: 'Supabase 未配置，请检查环境变量 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。',
        hint: '填写参数后重启 dev server，或使用离线缓存模式。',
      },
    };
  }

  try {
    const { data, error } = await operation(client);
    if (error) {
      return { data: null, error: normalizeError(error) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: normalizeError(err) };
  }
};

export const runMutations = async (
  operations: Array<
    (supabase: SupabaseClient) =>
      | Promise<{ error: PostgrestError | null }>
      | PromiseLike<{ error: PostgrestError | null }>
  >
): Promise<SupabaseServiceError | null> => {
  if (!client) {
    return {
      message: 'Supabase 未配置，无法执行写入操作。',
      hint: '确认环境变量已设置，或退回到离线模式。',
    };
  }

  for (const execute of operations) {
    try {
      const { error } = await execute(client);
      if (error) {
        return normalizeError(error);
      }
    } catch (err) {
      return normalizeError(err);
    }
  }

  return null;
};

export type { SupabaseClient };
