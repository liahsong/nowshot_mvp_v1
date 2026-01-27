import { getSupabase } from "./supabase";

export const getSignedUrl = async ({
  bucket,
  path,
  expiresIn = 3600,
}) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase(); // ✅ lazy-init 사용
  const publicBuckets = new Set(["cafe_photos"]);

  const raw = String(path);
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const cleaned = raw.replace(/^\/+/, "");
  if (publicBuckets.has(bucket)) {
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }
  let accessToken = null;
  const { data: sessionData } = await supabase.auth.getSession();
  accessToken = sessionData?.session?.access_token || null;
  if (!accessToken) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    accessToken = refreshed?.session?.access_token || null;
  }
  if (!accessToken) {
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }

  const { data, error } = await supabase.functions.invoke("sign-storage", {
    body: { bucket, path: cleaned, expiresIn },
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    if (error?.status !== 401) {
      console.warn("sign-storage failed:", error.message || error);
    }
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }

  if (data?.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(cleaned);
  return publicData?.publicUrl || "";
};
