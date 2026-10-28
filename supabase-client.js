/**
 * Supabase browser client setup.
 * Fill in your project URL and anon/publishable key from Supabase Project Settings.
 * These are public browser values; NEVER place a service_role/secret key in frontend code.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
