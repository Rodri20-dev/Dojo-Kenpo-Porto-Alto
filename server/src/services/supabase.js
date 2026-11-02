
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClients(config) {
  const authClient = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  const adminClient = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return {
    authClient,
    adminClient,
  };
}
