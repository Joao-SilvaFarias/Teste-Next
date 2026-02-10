import { createClient } from '@supabase/supabase-js';
import { getServerSecrets, getSupabasePublicEnv } from '@/src/lib/env';

const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(supabaseUrl, getServerSecrets().supabaseServiceRoleKey)
  : (null as never);
