console.log('🔥 SUPABASE URL', import.meta.env.VITE_SUPABASE_URL);
console.log('🔥 SUPABASE KEY', import.meta.env.VITE_SUPABASE_ANON_KEY);

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User as UserIcon } from "lucide-react";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { loadKakaoSdk, geocodeAddress } from "../../lib/kakao";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import PhotoUploader from "../../components/ui/PhotoUploader";
import SkillBadge from "../../components/ui/SkillBadge";

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

const CAFE_TYPES = ["개인카페", "로스터리", "베이커리", "프랜차이즈"];
const TIME_SLOTS = ["오픈", "미들", "오후", "마감"];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const IMAGE_MAX_WIDTH = 980;
const IMAGE_QUALITY = 0.8;
const BUCKETS = {
  profile: "barista_profile",
  latteArt: "barista_latteart",
  career: "barista_carrer",
};

export default function BaristaOnboarding() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { refetchProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    birth_date: "",
    phone: "",
    address: "",
    profile_photo: null,
    excellent_skills: [],
    cafe_experience: [],
    franchise_detail: "",
    latte_art_photos: [],
    career_summary: "",
    career_documents: [],
    preferred_time: [],
    privacy_agreed: false,
    marketing_agreed: false,
  });

  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        await loadKakaoSdk();
        if (active) setKakaoReady(true);
      } catch (err) {
        console.warn("Kakao SDK load failed:", err);
      }
    };
    boot();
    return () => {
      active = false;
    };
  }, []);

  const toggleSkill = (skill) => {
    const skills = profileData.excellent_skills;
    if (skills.includes(skill)) {
      setProfileData({
        ...profileData,
        excellent_skills: skills.filter((s) => s !== skill),
      });
    } else if (skills.length < 3) {
      setProfileData({
        ...profileData,
        excellent_skills: [...skills, skill],
      });
    }
  };

  const toggleCafeType = (type) => {
    const types = profileData.cafe_experience;
    if (types.includes(type)) {
      setProfileData({
        ...profileData,
        cafe_experience: types.filter((t) => t !== type),
      });
    } else {
      setProfileData({
        ...profileData,
        cafe_experience: [...types, type],
      });
    }
  };

  const toggleTimeSlot = (slot) => {
    const slots = profileData.preferred_time;
    if (slots.includes(slot)) {
      setProfileData({
        ...profileData,
        preferred_time: slots.filter((s) => s !== slot),
      });
    } else {
      setProfileData({
        ...profileData,
        preferred_time: [...slots, slot],
      });
    }
  };

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, IMAGE_MAX_WIDTH / img.width);
        if (scale >= 1) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("이미지 압축에 실패했습니다."));
              return;
            }
            URL.revokeObjectURL(objectUrl);
            resolve(
              new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          IMAGE_QUALITY
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지 로딩에 실패했습니다."));
      };
      img.src = objectUrl;
    });

  const uploadFile = async (bucket, userId, file, folder) => {
    let uploadFileRef = file;
    const isImage = file.type.startsWith("image/");
    const shouldCompress =
      isImage &&
      (bucket === BUCKETS.profile || bucket === BUCKETS.latteArt);

    if (shouldCompress) {
      uploadFileRef = await compressImage(file);
    }

    if (uploadFileRef.size > MAX_FILE_SIZE) {
      throw new Error("파일은 50MB 이하만 업로드할 수 있습니다.");
    }

    const safeName = uploadFileRef.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${folder}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, uploadFileRef, {
        upsert: true,
        contentType: uploadFileRef.type,
      });

    if (uploadError) throw uploadError;

    return path;
  };

  const uploadFileList = async (bucket, userId, items, folder) => {
    const results = [];
    for (const item of items) {
      results.push(await uploadFile(bucket, userId, item.file, folder));
    }
    return results;
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("로그인이 필요합니다.");
      }

      const profilePhotoUrl = profileData.profile_photo
        ? await uploadFile(
            BUCKETS.profile,
            user.id,
            profileData.profile_photo.file,
            "profile"
          )
        : null;
      const latteArtUrls = await uploadFileList(
        BUCKETS.latteArt,
        user.id,
        profileData.latte_art_photos,
        "latte-art"
      );
      const careerDocUrls = await uploadFileList(
        BUCKETS.career,
        user.id,
        profileData.career_documents,
        "career"
      );

      let geo = null;
      if (profileData.address && kakaoReady) {
        try {
          geo = await geocodeAddress(profileData.address);
        } catch (err) {
          console.warn("Geocode failed:", err);
        }
      }

      const { error: upsertError } = await supabase
        .from("barista_profiles")
        .upsert(
          {
            user_id: user.id,
            user_email: user.email,
            name: profileData.name,
            birth_date: profileData.birth_date || null,
            phone: profileData.phone,
            address: profileData.address || null,
            lat: geo?.lat ?? null,
            lng: geo?.lng ?? null,
            profile_photo: profilePhotoUrl,
            excellent_skills: profileData.excellent_skills,
            cafe_experience: profileData.cafe_experience,
            franchise_detail: profileData.franchise_detail || null,
            latte_art_photos: latteArtUrls,
            career_summary: profileData.career_summary || null,
            career_documents: careerDocUrls,
            preferred_time: profileData.preferred_time,
            privacy_agreed: profileData.privacy_agreed,
            marketing_agreed: profileData.marketing_agreed,
            profile_completed: true,
            updated_at: new Date(),
          },
          { onConflict: "user_id" }
        );

      if (upsertError) throw upsertError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "barista",
          onboarding_completed: true,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      try {
        await refetchProfile();
      } catch (err) {
        console.warn("Profile refresh failed:", err);
      }

      navigate("/barista", { replace: true });
    } catch (err) {
      setError(err.message || "온보딩 완료 처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("프로필 사진은 이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("파일은 50MB 이하만 업로드할 수 있습니다.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProfileData({
      ...profileData,
      profile_photo: { file, previewUrl },
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    s <= step ? "bg-[#1FBECC]" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-6"
      >
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                기본 정보
              </h2>
              <p className="text-gray-500">프로필 정보를 입력해주세요</p>
            </div>

            <div className="flex justify-center">
              <label className="relative cursor-pointer">
                {profileData.profile_photo ? (
                  <img
                    src={profileData.profile_photo.previewUrl}
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

            <div className="space-y-4">
              <div>
                <Label>이름</Label>
                <Input
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  placeholder="이름을 입력해주세요"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>생년월일</Label>
                <Input
                  type="date"
                  value={profileData.birth_date}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      birth_date: e.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>휴대폰 번호</Label>
                <Input
                  value={profileData.phone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, "");
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

                    setProfileData({ ...profileData, phone: formatted });

                    if (
                      e.target.value !== formatted &&
                      e.target.value.replace(/[^0-9-]/g, "") !== formatted
                    ) {
                      setPhoneError("정확한 전화번호를 입력해주세요.");
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
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      address: e.target.value,
                    })
                  }
                  placeholder="도로명 주소를 입력해주세요"
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={
                !profileData.name ||
                !profileData.phone ||
                !profileData.birth_date
              }
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              다음
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                경력 & 스킬
              </h2>
              <p className="text-gray-500">바리스타 경력을 입력해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>우수 스킬 (최대 3개)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SKILLS.map((skill) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      selected={profileData.excellent_skills.includes(skill)}
                      onClick={() => toggleSkill(skill)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>카페 타입 경험</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CAFE_TYPES.map((type) => (
                    <SkillBadge
                      key={type}
                      skill={type}
                      selected={profileData.cafe_experience.includes(type)}
                      onClick={() => toggleCafeType(type)}
                      size="sm"
                    />
                  ))}
                </div>
                {profileData.cafe_experience.includes("프랜차이즈") && (
                  <Input
                    value={profileData.franchise_detail}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        franchise_detail: e.target.value,
                      })
                    }
                    placeholder="프랜차이즈 브랜드명을 입력해주세요"
                    className="mt-2"
                  />
                )}
              </div>

              <div>
                <Label>경력</Label>
                <Textarea
                  value={profileData.career_summary}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      career_summary: e.target.value,
                    })
                  }
                  placeholder="자기소개 및 경력을 자유롭게 작성해주세요"
                  className="mt-1.5 min-h-[100px]"
                />
              </div>


              <div>
                <Label>선호 시간대</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TIME_SLOTS.map((slot) => (
                    <SkillBadge
                      key={slot}
                      skill={slot}
                      selected={profileData.preferred_time.includes(slot)}
                      onClick={() => toggleTimeSlot(slot)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={profileData.excellent_skills.length === 0}
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              다음
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                포트폴리오
              </h2>
              <p className="text-gray-500">
                라떼아트와 경력 증빙 서류를 업로드해주세요
              </p>
            </div>

            <PhotoUploader
              photos={profileData.latte_art_photos}
              onPhotosChange={(photos) =>
                setProfileData({ ...profileData, latte_art_photos: photos })
              }
              maxPhotos={3}
              label="라떼아트 사진 (1~3장)"
              accept="image/*"
            />

            <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700">
              6개월 이상 경력이 증명가능한 급여명세서 혹은 월급내역을
              업로드 해주세요.
            </div>

            <PhotoUploader
              photos={profileData.career_documents}
              onPhotosChange={(photos) =>
                setProfileData({ ...profileData, career_documents: photos })
              }
              maxPhotos={6}
              label="경력 증빙 서류 (최대 6장)"
              accept="image/*,.pdf,application/pdf"
            />

            <Button
              onClick={() => setStep(4)}
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              다음
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                약관 동의
              </h2>
              <p className="text-gray-500">
                서비스 이용을 위한 약관에 동의해주세요
              </p>
            </div>

            <div className="space-y-4 bg-gray-50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={profileData.privacy_agreed}
                  onCheckedChange={(v) =>
                    setProfileData({
                      ...profileData,
                      privacy_agreed: Boolean(v),
                    })
                  }
                />
                <label htmlFor="privacy" className="text-sm cursor-pointer">
                  <span className="text-red-500">[필수]</span>{" "}
                  개인정보처리방침에 동의합니다
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={profileData.marketing_agreed}
                  onCheckedChange={(v) =>
                    setProfileData({
                      ...profileData,
                      marketing_agreed: Boolean(v),
                    })
                  }
                />
                <label htmlFor="marketing" className="text-sm cursor-pointer">
                  <span className="text-gray-400">[선택]</span> 마케팅 수신에
                  동의합니다
                </label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!profileData.privacy_agreed || loading}
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "시작하기"
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
