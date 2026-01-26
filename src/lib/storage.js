import { getSupabase } from "./supabase";

export const getSignedUrl = async ({
  bucket,
  path,
  expiresIn = 3600,
}) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase(); // ✅ lazy-init 사용

  const raw = String(path);
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const cleaned = raw.replace(/^\/+/, "");
  const { data, error } = await supabase.functions.invoke("sign-storage", {
    body: { bucket, path: cleaned, expiresIn },
  });

  if (error) {
    console.warn("sign-storage failed:", error.message || error);
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
