import { getSupabase } from "./supabase";

export const getSignedUrl = async ({
  bucket,
  path,
  expiresIn = 3600,
}) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase(); // ✅ lazy-init 사용
  const publicBuckets = new Set(["cafe_photos", "barista_profile"]);

  const raw = String(path);
  let resolvedBucket = bucket;
  let resolvedPath = raw;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const match = raw.match(
      /\/storage\/v1\/object\/(public|sign)\/([^/]+)\/(.+?)(?:\?|$)/
    );
    if (!match) return raw;
    resolvedBucket = match[2];
    resolvedPath = match[3];
    if (match[1] === "public") {
      const publicPath = resolvedPath.replace(/^\/+/, "");
      const { data: publicData } = supabase.storage
        .from(resolvedBucket)
        .getPublicUrl(publicPath);
      return publicData?.publicUrl || raw;
    }
  }

  if (resolvedPath.startsWith(`${resolvedBucket}/`)) {
    resolvedPath = resolvedPath.slice(resolvedBucket.length + 1);
  }

  const cleaned = resolvedPath.replace(/^\/+/, "");
  if (publicBuckets.has(resolvedBucket)) {
    const { data: publicData } = supabase.storage
      .from(resolvedBucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }

  const { data: directData, error: directError } = await supabase.storage
    .from(resolvedBucket)
    .createSignedUrl(cleaned, expiresIn);
  if (!directError && directData?.signedUrl) {
    return directData.signedUrl;
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
      .from(resolvedBucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }

  const { data, error } = await supabase.functions.invoke("sign-storage", {
    body: { bucket: resolvedBucket, path: cleaned, expiresIn },
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    if (error?.status !== 401) {
      console.warn("sign-storage failed:", error.message || error);
    }
    const { data: publicData } = supabase.storage
      .from(resolvedBucket)
      .getPublicUrl(cleaned);
    return publicData?.publicUrl || "";
  }

  if (data?.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicData } = supabase.storage
    .from(resolvedBucket)
    .getPublicUrl(cleaned);
  return publicData?.publicUrl || "";
};
