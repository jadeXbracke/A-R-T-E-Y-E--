import type { Backend } from './backend';
import { DemoBackend } from './demo/backend';
import { supabase } from './supabase/client';
import { SupabaseBackend } from './supabase/backend';

/**
 * The active backend. Configure EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example) to run against Supabase;
 * without them the app runs in seeded demo mode so it is always demoable.
 */
export const api: Backend = supabase
  ? new SupabaseBackend(supabase)
  : new DemoBackend();
