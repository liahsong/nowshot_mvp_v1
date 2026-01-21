import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

const hasSupabaseUrl = supabaseUrl.length > 0;
const hasSupabaseKey = supabaseAnonKey.length > 0;

if (import.meta.env.DEV) {
  console.log("SUPABASE URL:", supabaseUrl);
  console.log("SUPABASE KEY:", hasSupabaseKey ? "present" : "missing");
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.error(
      "Supabase env missing. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
