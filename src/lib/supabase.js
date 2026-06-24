import { createBrowserClient } from '@supabase/ssr';

// ------------------------------------------------------------------
// VUL HIER JE EIGEN SUPABASE GEGEVENS IN
// Te vinden in je Supabase project onder: Project Settings -> API
// ------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://JOUW-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'JOUW-ANON-KEY';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Singleton voor gebruik in client-components
export const supabase = createClient();
