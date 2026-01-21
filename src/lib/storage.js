import { getSupabase } from "./supabase";

export const getSignedUrl = async ({
  bucket,
  path,
  expiresIn = 3600,
}) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase(); // ✅ lazy-init 사용

  const cleaned = String(path).replace(/^\/+/, "");
  const { data, error } = await supabase.functions.invoke("sign-storage", {
    body: { bucket, path: cleaned, expiresIn },
  });

  if (error) {
    console.warn("sign-storage failed:", error.message || error);
    return "";
  }

  return data?.signedUrl || "";
};
