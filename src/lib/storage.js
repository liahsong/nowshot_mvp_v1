import { getSupabase } from "./supabase";

const PUBLIC_BUCKETS = new Set(["cafe_photos", "barista_profile"]);

export const getSignedUrl = async ({ bucket, path, expiresIn = 3600 }) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase();
  const raw = String(path);

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const cleaned = raw.replace(/^\/+/, "").replace(new RegExp(`^${bucket}/`), "");

  if (PUBLIC_BUCKETS.has(bucket)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleaned);
    return data?.publicUrl || "";
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleaned, expiresIn);

  if (!error && data?.signedUrl) return data.signedUrl;

  console.warn(`[storage] createSignedUrl 실패 (${bucket}/${cleaned}):`, error?.message);
  return "";
};
