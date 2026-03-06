import { getSupabase } from "./supabase";

// public 버킷 목록 — getPublicUrl 사용 (sign 불필요)
// barista_latteart: 대시보드에서 Public으로 변경 완료 후 적용
const PUBLIC_BUCKETS = new Set([
  "cafe_photos",
  "barista_profile",
  "barista_latteart", // ← public 전환 완료
]);

/**
 * 스토리지 경로 또는 전체 URL을 받아 접근 가능한 URL 반환
 * - public 버킷: getPublicUrl
 * - private 버킷(barista_carrer 등): createSignedUrl
 * - Edge Function sign-storage 의존성 완전 제거
 */
export const getSignedUrl = async ({
  bucket,
  path,
  expiresIn = 3600,
}) => {
  if (!bucket || !path) return "";

  const supabase = getSupabase();
  const raw = String(path);

  // ── 1. 이미 완성된 URL이 들어온 경우 ──────────────────
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    if (raw.includes("/object/public/")) return raw;

    const match = raw.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(?:\?|$)/);
    if (!match) return raw;
    bucket = match[1];
    path = match[2];
  }

  // ── 2. 경로 앞에 버킷명 중복 제거 ────────────────────
  // 예: "cafe_photos/cafe_photos/cafe/file.jpg" → "cafe_photos/cafe/file.jpg"
  const cleaned = path
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${bucket}/`), "");

  // ── 3. public 버킷 → getPublicUrl ─────────────────────
  if (PUBLIC_BUCKETS.has(bucket)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(cleaned);
    return data?.publicUrl || "";
  }

  // ── 4. private 버킷(barista_carrer) → createSignedUrl ──
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleaned, expiresIn);

  if (!error && data?.signedUrl) return data.signedUrl;

  console.warn(`[storage] createSignedUrl 실패 (${bucket}/${cleaned}):`, error?.message);
  const { data: fallback } = supabase.storage.from(bucket).getPublicUrl(cleaned);
  return fallback?.publicUrl || "";
};