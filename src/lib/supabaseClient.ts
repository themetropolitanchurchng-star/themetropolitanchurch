import { createClient } from '@supabase/supabase-js';

// Supabase client configured for The Metropolitan Church project
export const supabase = createClient(
  'https://ygcdmascxytzfmtwizls.supabase.co',
  'sb_publishable_fEtbb8j68LSlaUnblv3clA_6k6B9Y_y'
);
