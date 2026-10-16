import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { RunMode } from '@/lib/automation-types';

let cached: SupabaseClient | null = null;

/** Server-only Supabase client using the service-role key (bypasses RLS). */
export function getAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Reads the Demo Mode toggle from app_settings.
 * Falls back to the DEMO_MODE env var, then to demo (the safe default).
 */
export async function getStoredMode(db: SupabaseClient): Promise<RunMode> {
  const { data, error } = await db.from('app_settings').select('value').eq('key', 'demo_mode').maybeSingle();

  if (!error && data?.value && typeof data.value.enabled === 'boolean') {
    return data.value.enabled ? 'demo' : 'live';
  }
  return process.env.DEMO_MODE === 'false' ? 'live' : 'demo';
}

export async function setStoredMode(db: SupabaseClient, mode: RunMode): Promise<void> {
  const { error } = await db
    .from('app_settings')
    .upsert({ key: 'demo_mode', value: { enabled: mode === 'demo' } }, { onConflict: 'key' });
  if (error) throw new Error(`Could not save Demo Mode: ${error.message}`);
}
