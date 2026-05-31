import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY not set — database calls will fail.');
}

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { realtime: { transport: ws } }
);
