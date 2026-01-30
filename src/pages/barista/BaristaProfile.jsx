import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, PencilLine, User as UserIcon } from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import SkillBadge from "../../components/ui/SkillBadge";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { resolveProfileImageUrl } from "@/lib/profileImage";

const SKILLS = [
  "샷 추출",
  "고객 응대(POS 포함)",
  "매장 관리(청소)",
  "베버리지 제조",
  "드립 추출",
  "재고 관리",
  "베이커리 제조(냉동제품)",
  "베이커리 제조",
];

const TIME_SLOTS = ["오픈", "미들", "오후", "마감"];
const normalizeArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item;
        return item.url || item.previewUrl || null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeArrayField(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const extractStorageRef = (url) => {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/
  );
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
};

const extractFilename = (path) => {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
};

const extractLatteArtList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item;
        return item.url || item.previewUrl || null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return extractLatteArtList(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const normalizeLatteArtPaths = (value) => {
  const items = extractLatteArtList(value);
  return items
    .map((item) => {
      if (item.includes("barista-skill/latte-art/")) return item;
      const match = item.match(
        /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/
      );
      const path = match?.[1] ?? item;
      const filename = extractFilename(path);
      return filename ? `barista-skill/latte-art/${filename}` : null;
    })
    .filter(Boolean);
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Blob read failed"));
    reader.readAsDataURL(blob);
  });

const buildSignedUrl = async (
  url,
  defaultBucket,
  fallbackPaths = [],
  preferPublic = false
) => {
  const supabase = getSupabase();
  if (!url || typeof url !== "string") return url;
  const ref = extractStorageRef(url);
  if (!ref) {
    if (defaultBucket && !url.startsWith("http")) {
      const candidates = [
        url.replace(/^\/+/, ""),
        ...fallbackPaths.map((path) => `${path.replace(/\/+$/, "")}/${url}`),
      ];
      for (const candidate of candidates) {
        const { data, error } = await supabase.storage
          .from(defaultBucket)
          .createSignedUrl(candidate, 60 * 60);
        if (!error && data?.signedUrl) return data.signedUrl;
        if (preferPublic) {
          const publicUrl = supabase.storage
            .from(defaultBucket)
            .getPublicUrl(candidate)?.data?.publicUrl;
          if (publicUrl) return publicUrl;
        }
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(defaultBucket)
          .download(candidate);
        if (!downloadError && fileData) {
          try {
            return await blobToDataUrl(fileData);
          } catch {
            return url;
          }
        }
      }
    }
    return url;
  }
  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, 60 * 60);
  if (!error && data?.signedUrl) return data.signedUrl;
  if (fallbackPaths.length > 0) {
    const filename = extractFilename(ref.path);
    for (const pathPrefix of fallbackPaths) {
      if (!filename) continue;
      const candidate = `${pathPrefix.replace(/\/+$/, "")}/${filename}`;
      const { data: fallbackData, error: fallbackError } =
        await supabase.storage
          .from(ref.bucket)
          .createSignedUrl(candidate, 60 * 60);
      if (!fallbackError && fallbackData?.signedUrl) {
        return fallbackData.signedUrl;
      }
    }
  }
  if (preferPublic) {
    const publicUrl = supabase.storage
      .from(ref.bucket)
      .getPublicUrl(ref.path)?.data?.publicUrl;
    if (publicUrl) return publicUrl;
  }
  if (fallbackPaths.length > 0) {
    const filename = extractFilename(ref.path);
    for (const pathPrefix of fallbackPaths) {
      if (!filename) continue;
      const candidate = `${pathPrefix.replace(/\/+$/, "")}/${filename}`;
      const publicUrl = supabase.storage
        .from(ref.bucket)
        .getPublicUrl(candidate)?.data?.publicUrl;
      if (publicUrl) return publicUrl;
    }
  }
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(ref.bucket)
    .download(ref.path);
  if (!downloadError && fileData) {
    try {
      return await blobToDataUrl(fileData);
    } catch {
      return url;
    }
  }
  if (fallbackPaths.length > 0) {
    const filename = extractFilename(ref.path);
    for (const pathPrefix of fallbackPaths) {
      if (!filename) continue;
      const candidate = `${pathPrefix.replace(/\/+$/, "")}/${filename}`;
      const { data: fallbackFile, error: fallbackDownloadError } =
        await supabase.storage.from(ref.bucket).download(candidate);
      if (!fallbackDownloadError && fallbackFile) {
        try {
          return await blobToDataUrl(fallbackFile);
        } catch {
          return url;
        }
      }
    }
  }
  if (error || !data?.signedUrl) return url;
  return data.signedUrl;
};
const parseCareerSummary = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export default function BaristaProfile() {
  const supabase = getSupabase();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["baristaProfile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barista_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const latteArtPhotos = useMemo(() => {
    return normalizeArrayField(profile?.latte_art_photos).map((item) => {
      if (typeof item === "string" && !item.includes("/") && !item.startsWith("http")) {
        return `barista-skill/latte-art/${item}`;
      }
      return item;
    });
  }, [profile?.latte_art_photos]);
  const careerDocuments = useMemo(
    () => normalizeArrayField(profile?.career_documents),
    [profile?.career_documents]
  );
  const [latteArtDisplayUrls, setLatteArtDisplayUrls] = useState([]);
  const [careerDocumentDisplayUrls, setCareerDocumentDisplayUrls] = useState([]);
  const migrationRef = useRef(false);

  useEffect(() => {
    let active = true;
    const resolveProfilePhoto = async () => {
      if (!profile?.profile_photo) {
        if (active) setProfilePhotoUrl("");
        return;
      }
      const imageUrl = resolveProfileImageUrl(supabase, profile.profile_photo);
      if (active) setProfilePhotoUrl(imageUrl || "");
    };
    resolveProfilePhoto();
    return () => {
      active = false;
    };
  }, [profile?.profile_photo]);

  useEffect(() => {
    if (!profile || migrationRef.current) return;
    const currentList = extractLatteArtList(profile.latte_art_photos);
    const normalized = normalizeLatteArtPaths(profile.latte_art_photos);
    const needsMigration =
      currentList.length > 0 &&
      currentList.some((item) => !item.includes("barista-skill/latte-art/"));

    if (!needsMigration || normalized.length === 0) {
      migrationRef.current = true;
      return;
    }

    migrationRef.current = true;
    supabase
      .from("barista_profiles")
      .update({ latte_art_photos: normalized, updated_at: new Date() })
      .eq("user_id", user.id)
      .then(() => {});
  }, [profile, user?.id]);

  useEffect(() => {
    let active = true;
    const resolveUrls = async () => {
      const latteResolved = await Promise.all(
        latteArtPhotos.map((url) =>
          buildSignedUrl(url, "barista_latteart", ["barista-skill/latte-art"])
        )
      );
      const careerResolved = await Promise.all(
        careerDocuments.map((url) =>
          buildSignedUrl(url, "barista_carrer", [`${user?.id}/career`])
        )
      );
      if (active) {
        setLatteArtDisplayUrls(latteResolved);
        setCareerDocumentDisplayUrls(careerResolved);
      }
    };
    resolveUrls();
    return () => {
      active = false;
    };
  }, [latteArtPhotos, careerDocuments]);
  const careerItems = useMemo(
    () => parseCareerSummary(profile?.career_summary),
    [profile?.career_summary]
  );

  return (
    <SplitLayout
      leftContent={
        <div className="p-12">
          <img
            src="/images/main_illust.png"
            alt="Barista Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
        <div className="min-h-screen bg-white pb-24">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="font-semibold text-gray-900">바리스타 프로필</h1>
            </div>
          </div>

          {isLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <p className="text-sm text-gray-500">불러오는 중...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 space-y-6 max-w-3xl mx-auto"
            >
              <div className="flex justify-center">
                <div className="relative">
                  {profile?.profile_photo ? (
                    <img
                      src={profilePhotoUrl || profile.profile_photo}
                      alt=""
                      loading="eager"
                      fetchpriority="high"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>이메일</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>

              <div>
                <Label>이름</Label>
                <Input
                  value={profile?.name || ""}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>

              <div>
                <Label>전화번호</Label>
                <Input
                  value={profile?.phone || ""}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>

              <div>
                <Label>주소</Label>
                <Input
                  value={profile?.address || ""}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>

              <div>
                <Label>우수 스킬 (최대 3개)</Label>
                <div className="flex flex-wrap gap-2 mt-2 pointer-events-none">
                  {SKILLS.map((skill) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      selected={Boolean(
                        profile?.excellent_skills?.includes(skill)
                      )}
                      onClick={() => {}}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>선호 시간대</Label>
                <div className="flex flex-wrap gap-2 mt-2 pointer-events-none">
                  {TIME_SLOTS.map((slot) => (
                    <SkillBadge
                      key={slot}
                      skill={slot}
                      selected={Boolean(profile?.preferred_time?.includes(slot))}
                      onClick={() => {}}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>경력</Label>
                <Input
                  value=""
                  disabled
                  placeholder="등록된 경력이 없습니다."
                  className="mt-1.5 bg-gray-50"
                />
                <div className="mt-3 space-y-2">
                  {careerItems.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      등록된 경력이 없습니다.
                    </p>
                  ) : (
                    careerItems.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      >
                        {item}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">
                  라떼아트 사진 (최대 3장)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {latteArtDisplayUrls.length > 0 ? (
                    latteArtDisplayUrls.map((url) => (
                      <div
                        key={url}
                        className="relative rounded-xl overflow-hidden bg-gray-100"
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-sm text-gray-400">
                      등록된 사진이 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">
                  경력 증명서
                </div>
                {careerDocumentDisplayUrls.length > 0 ? (
                  <div className="space-y-2">
                    {careerDocumentDisplayUrls.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-gray-300"
                      >
                        경력 증명서 {index + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    등록된 파일이 없습니다.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
            <Button
              variant="outline"
              onClick={() => navigate("/barista/profile/edit")}
              className="w-full h-12 rounded-xl text-gray-700 border-gray-200 hover:bg-gray-50"
            >
              <PencilLine className="w-4 h-4 mr-2" />
              수정하기
            </Button>
          </div>
        </div>
      }
    />
  );
}
