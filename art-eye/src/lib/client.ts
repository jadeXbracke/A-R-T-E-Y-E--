import type { DataClient } from './api';
import { LocalClient } from './localClient';
import { SupabaseClient } from './supabaseClient';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase when configured (see .env.example); otherwise the bundled
 * local demo store, seeded with the July 2026 Sydney agenda.
 */
export const client: DataClient =
  url && anonKey ? new SupabaseClient(url, anonKey) : new LocalClient();
