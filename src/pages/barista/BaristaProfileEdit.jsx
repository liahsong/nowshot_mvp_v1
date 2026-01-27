import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  User as UserIcon,
  X,
} from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import PhotoUploader from "../../components/ui/PhotoUploader";
import SkillBadge from "../../components/ui/SkillBadge";
import AddressSearchModal from "../../components/AddressSearchModal";
import { getSupabase } from "../../lib/supabase";
import { getSignedUrl } from "../../lib/storage";
import { useAuth } from "../../contexts/AuthContext";
import { resizeImageFile } from "../../utils/resizeImage";

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
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const BUCKETS = {
  profile: "barista_profile",
  latteArt: "barista_latteart",
};
const PUBLIC_BUCKETS = new Set([BUCKETS.profile]);

const extractStorageRef = (url) => {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/
  );
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
};

const extractStoragePath = (url) => {
  if (!url || typeof url !== "string") return "";
  const ref = extractStorageRef(url);
  if (ref?.path) return ref.path;
  return url;
};

const normalizeProfilePhotoPath = (value) => {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const path = extractStoragePath(value);
  if (path.startsWith("barista_profile/")) {
    return path.replace(/^barista_profile\//, "");
  }
  return path;
};

const extractFilename = (path) => {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Blob read failed"));
    reader.readAsDataURL(blob);
  });

const resolveSignedUrl = async (
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

const normalizePhotoItems = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          const resolved =
            !item.includes("/") && !item.startsWith("http")
              ? `barista-skill/latte-art/${item}`
              : item;
          return {
            previewUrl: resolved,
            url: resolved,
            originalUrl: resolved,
          };
        }
        const candidate = item.url || item.previewUrl;
        const resolved =
          candidate && !candidate.includes("/") && !candidate.startsWith("http")
            ? `barista-skill/latte-art/${candidate}`
            : candidate;
        return resolved
          ? {
              previewUrl: resolved,
              url: resolved,
              originalUrl: resolved,
            }
          : null;
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizePhotoItems(parsed);
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const resolved =
            !item.includes("/") && !item.startsWith("http")
              ? `barista-skill/latte-art/${item}`
              : item;
          return {
            previewUrl: resolved,
            url: resolved,
            originalUrl: resolved,
          };
        });
    }
  }
  return [];
};

const parseCareerSummary = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const uploadFile = async (bucket, userId, file, folder) => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일은 50MB 이하만 업로드할 수 있습니다.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueId =
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`);
  const path = PUBLIC_BUCKETS.has(bucket)
    ? `${folder}/${uniqueId}_${safeName}`
    : `${userId}/${folder}/${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  if (PUBLIC_BUCKETS.has(bucket)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    return publicUrl ? `${publicUrl}?t=${Date.now()}` : path;
  }

  return path;
};

export default function BaristaProfileEdit() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phoneError, setPhoneError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [careerInput, setCareerInput] = useState("");
  const [careerItems, setCareerItems] = useState([]);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
    profile_photo: "",
    excellent_skills: [],
    preferred_time: [],
    latte_art_photos: [],
  });

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

  useEffect(() => {
    if (!profile) return;

    const hydrateLatteArt = async () => {
      const latteArtItems = normalizePhotoItems(profile.latte_art_photos);
      const resolved = await Promise.all(
        latteArtItems.map(async (item) => ({
          ...item,
          previewUrl: await resolveSignedUrl(item.url, "barista_latteart", [
            "barista-skill/latte-art",
          ]),
        }))
      );
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        lat: profile.lat ?? null,
        lng: profile.lng ?? null,
        profile_photo: profile.profile_photo || "",
        excellent_skills: profile.excellent_skills || [],
        preferred_time: profile.preferred_time || [],
        latte_art_photos: resolved,
      });
      setCareerItems(parseCareerSummary(profile.career_summary));
    };

    hydrateLatteArt();
  }, [profile]);

  useEffect(() => {
    let active = true;
    const resolveProfilePhoto = async () => {
      if (!formData.profile_photo) {
        if (active) setProfilePhotoPreviewUrl("");
        return;
      }
      if (typeof formData.profile_photo !== "string") {
        if (active) setProfilePhotoPreviewUrl(formData.profile_photo.previewUrl);
        return;
      }
      const resolved = await getSignedUrl({
        bucket: "barista_profile",
        path: normalizeProfilePhotoPath(formData.profile_photo),
        expiresIn: 3600,
      });
      if (active) setProfilePhotoPreviewUrl(resolved || "");
    };
    resolveProfilePhoto();
    return () => {
      active = false;
    };
  }, [formData.profile_photo]);

  const profilePhotoPreview = useMemo(() => {
    return profilePhotoPreviewUrl;
  }, [profilePhotoPreviewUrl]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다.");
      setUploadError("");

      let profilePhotoUrl = "";
      if (formData.profile_photo) {
        if (typeof formData.profile_photo === "string") {
          profilePhotoUrl = normalizeProfilePhotoPath(
            formData.profile_photo
          );
        } else if (formData.profile_photo.file) {
          profilePhotoUrl = await uploadFile(
            BUCKETS.profile,
            user.id,
            formData.profile_photo.file,
            "profile"
          );
        }
      }

      const existingLatteArtUrls = formData.latte_art_photos
        .filter((item) => !item.file)
        .map((item) => item.url || item.previewUrl);

      const newLatteArtItems = formData.latte_art_photos.filter(
        (item) => item.file
      );
      const newLatteArtUrls = [];
      for (const item of newLatteArtItems) {
        newLatteArtUrls.push(
          await uploadFile(BUCKETS.latteArt, user.id, item.file, "latte-art")
        );
      }

      const { error } = await supabase.from("barista_profiles").upsert(
        {
          user_id: user.id,
          user_email: user.email,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          profile_photo: profilePhotoUrl || null,
          excellent_skills: formData.excellent_skills,
          career_summary: careerItems.join("\n"),
          preferred_time: formData.preferred_time,
          latte_art_photos: [...existingLatteArtUrls, ...newLatteArtUrls],
          updated_at: new Date(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baristaProfile"] });
      navigate(-1);
    },
    onError: (error) => {
      setUploadError(error?.message || "저장에 실패했습니다.");
    },
  });

  const toggleSkill = (skill) => {
    const skills = formData.excellent_skills;
    if (skills.includes(skill)) {
      setFormData({
        ...formData,
        excellent_skills: skills.filter((s) => s !== skill),
      });
    } else if (skills.length < 3) {
      setFormData({
        ...formData,
        excellent_skills: [...skills, skill],
      });
    }
  };

  const toggleTimeSlot = (slot) => {
    const slots = formData.preferred_time;
    if (slots.includes(slot)) {
      setFormData({
        ...formData,
        preferred_time: slots.filter((s) => s !== slot),
      });
    } else {
      setFormData({
        ...formData,
        preferred_time: [...slots, slot],
      });
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    try {
      const resizedFile = await resizeImageFile(file);
      const previewUrl = URL.createObjectURL(resizedFile);
      setFormData({
        ...formData,
        profile_photo: { file: resizedFile, previewUrl },
      });
    } catch (err) {
      setUploadError("이미지 처리에 실패했습니다.");
    }
  };

  const addCareerItem = () => {
    const trimmed = careerInput.trim();
    if (!trimmed) return;
    setCareerItems((prev) => [...prev, trimmed]);
    setCareerInput("");
  };

  const removeCareerItem = (index) => {
    setCareerItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1FBECC] animate-spin" />
      </div>
    );
  }

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
              <h1 className="font-semibold text-gray-900">프로필 수정</h1>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6 max-w-3xl mx-auto"
          >
            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt=""
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#1FBECC] rounded-full flex items-center justify-center text-white text-xl font-bold">
                  +
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  className="hidden"
                />
              </label>
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
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                placeholder="이름을 입력해주세요"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>전화번호</Label>
              <Input
                value={formData.phone}
                onChange={(event) => {
                  let value = event.target.value.replace(/[^0-9]/g, "");
                  if (value.length > 11) value = value.slice(0, 11);

                  let formatted = value;
                  if (value.length > 3 && value.length <= 7) {
                    formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                  } else if (value.length > 7) {
                    formatted = `${value.slice(0, 3)}-${value.slice(
                      3,
                      7
                    )}-${value.slice(7)}`;
                  }

                  setFormData({ ...formData, phone: formatted });
                  if (value.length > 0 && value.length < 10) {
                    setPhoneError("전화번호를 확인해주세요.");
                  } else {
                    setPhoneError("");
                  }
                }}
                placeholder="010-0000-0000"
                className="mt-1.5"
              />
              {phoneError && (
                <p className="text-sm text-red-500 mt-1">{phoneError}</p>
              )}
            </div>

            <div>
              <Label>주소</Label>
              <Input
                value={formData.address}
                onChange={(event) =>
                  setFormData({ ...formData, address: event.target.value })
                }
                placeholder="주소를 입력해주세요"
                className="mt-1.5"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => setShowAddressModal(true)}
              >
                주소 검색
              </Button>
            </div>

            <div>
              <Label>우수 스킬 (최대 3개)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SKILLS.map((skill) => (
                  <SkillBadge
                    key={skill}
                    skill={skill}
                    selected={formData.excellent_skills.includes(skill)}
                    onClick={() => toggleSkill(skill)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>선호 시간대</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TIME_SLOTS.map((slot) => (
                  <SkillBadge
                    key={slot}
                    skill={slot}
                    selected={formData.preferred_time.includes(slot)}
                    onClick={() => toggleTimeSlot(slot)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>경력</Label>
              <Input
                value={careerInput}
                onChange={(event) => setCareerInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCareerItem();
                  }
                }}
                placeholder="경력을 한 줄로 입력해주세요"
                className="mt-1.5"
              />
              <button
                type="button"
                onClick={addCareerItem}
                className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <Plus className="w-4 h-4" />
                추가하기
              </button>
              <div className="mt-3 space-y-2">
                {careerItems.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    등록된 경력이 없습니다.
                  </p>
                ) : (
                  careerItems.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => removeCareerItem(index)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="경력 삭제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <PhotoUploader
              photos={formData.latte_art_photos}
              onPhotosChange={(photos) =>
                setFormData({ ...formData, latte_art_photos: photos })
              }
              maxPhotos={3}
              label="라떼아트 사진 (최대 3장)"
            />

          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}
        </motion.div>
        <AddressSearchModal
          open={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSelect={(location) => {
            setFormData({
              ...formData,
              address: location.address,
              lat: location.lat,
              lng: location.lng,
            });
          }}
        />

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={
                updateMutation.isPending ||
                !formData.name ||
                !formData.phone ||
                Boolean(phoneError)
              }
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  저장하기
                </>
              )}
            </Button>
          </div>
        </div>
      }
    />
  );
}
