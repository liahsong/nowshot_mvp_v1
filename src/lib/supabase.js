import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function getSupabase() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

  if (import.meta.env.DEV) {
    console.log("SUPABASE URL:", supabaseUrl);
    console.log("SUPABASE KEY:", supabaseAnonKey ? "present" : "missing");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Supabase env missing. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
      );
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env missing at runtime");
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
