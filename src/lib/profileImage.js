export function resolveProfileImageUrl(supabase, imagePath) {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  const trimmed = imagePath.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.includes("/storage/v1/object/public/")
  ) {
    return trimmed;
  }

  const bucketName = "barista_profile";
  const baseUrl =
    supabase?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "";
  if (!baseUrl) {
    return "";
  }

  const cleanPath = trimmed
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${bucketName}/`), "")
    .replace(/^profile\//, "");

  const encodedPath = cleanPath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `${baseUrl}/storage/v1/object/public/${bucketName}/profile/${encodedPath}`;
}
