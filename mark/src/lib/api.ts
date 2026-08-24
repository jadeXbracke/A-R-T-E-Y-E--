import { Api } from './api-types';
import { demoApi } from './demo-store';

export const DEMO_MODE = !process.env.EXPO_PUBLIC_SUPABASE_URL;

// The Supabase module is only pulled in when configured, so demo mode never
// constructs a client with missing credentials.
export const api: Api = DEMO_MODE
  ? demoApi
  : (require('./supabase-api').supabaseApi as Api);
