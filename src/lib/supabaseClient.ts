import { createClient } from '@supabase/supabase-js';

// Detect Jest to enable Node env fallbacks without touching process in the browser
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isJest =
  typeof process !== 'undefined' && !!(process as any).env?.JEST_WORKER_ID;

// Prefer Vite env at runtime/build; available in dev/prod builds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const viteEnv = (
  typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined
) as Record<string, string> | undefined;

// Read Supabase config: Vite first, then Jest/Node fallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseUrl: string | undefined =
  viteEnv?.VITE_SUPABASE_URL ??
  (isJest ? (process as any).env?.VITE_SUPABASE_URL : undefined);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseKey: string | undefined =
  viteEnv?.VITE_SUPABASE_ANON_KEY ??
  (isJest ? (process as any).env?.VITE_SUPABASE_ANON_KEY : undefined);

if ((!supabaseUrl || !supabaseKey) && !isJest) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars are not set. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export default supabase;
