
import type { PostgrestError } from '@supabase/supabase-js';

const API_Base = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3000/api';

export const restClient = {
    async get<T>(path: string): Promise<{ data: T | null; error: PostgrestError | null }> {
        try {
            const res = await fetch(`${API_Base}${path}`);
            if (!res.ok) {
                return { data: null, error: { name: 'HttpError', message: res.statusText, hint: '', details: '', code: String(res.status) } };
            }
            const data = await res.json();
            return { data, error: null };
        } catch (e) {
            return { data: null, error: { name: 'FetchError', message: String(e), hint: '', details: '', code: 'FETCH_ERROR' } };
        }
    },

    async post<T>(path: string, body: any): Promise<{ data: T | null; error: PostgrestError | null }> {
        try {
            const res = await fetch(`${API_Base}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                return { data: null, error: { name: 'HttpError', message: res.statusText, hint: '', details: '', code: String(res.status) } };
            }
            const data = await res.json();
            return { data, error: null };
        } catch (e) {
            return { data: null, error: { name: 'FetchError', message: String(e), hint: '', details: '', code: 'FETCH_ERROR' } };
        }
    }
};
