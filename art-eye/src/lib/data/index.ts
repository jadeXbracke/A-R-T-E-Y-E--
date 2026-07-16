import { DataAdapter } from './adapter';
import { LocalAdapter } from './local';
import { RemoteAdapter } from './remote';
import { hasSupabase, supabase } from './supabaseClient';

/**
 * Single data entry point. With EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY set, the app
 * runs against Supabase; without them it runs a fully local demo (AsyncStorage)
 * so a fresh checkout is demoable immediately.
 */
export const data: DataAdapter = hasSupabase ? new RemoteAdapter(supabase!) : new LocalAdapter();
