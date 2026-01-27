import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getSupabase } from "../../lib/supabase";
import { loadKakaoSdk, geocodeAddress } from "../../lib/kakao";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import PhotoUploader from "../../components/ui/PhotoUploader";
import SkillBadge from "../../components/ui/SkillBadge";
import SplitLayout from "../../components/SplitLayout";
import AddressSearchModal from "../../components/AddressSearchModal";

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

const CAFE_TYPES = ["개인카페", "프랜차이즈", "로스터리", "베이커리"];
const BUCKETS = { cafe: "cafe_photos" };

const uploadFile = async (supabase, bucket, cafeId, file, folder) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${cafeId}/${folder}/${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export default function OwnerOnboarding() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [ownerData, setOwnerData] = useState({
    owner_name: "",
    phone: "",
    privacy_agreed: false,
    marketing_agreed: false,
  });

  const [phoneError, setPhoneError] = useState("");

  const [cafeData, setCafeData] = useState({
    cafe_name: "",
    address: "",
    lat: null,
    lng: null,
    cafe_type: "",
    photos: [],
    atmosphere_description: "",
    preferred_skills: [],
  });

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
    const skills = cafeData.preferred_skills;
    if (skills.includes(skill)) {
      setCafeData({
        ...cafeData,
        preferred_skills: skills.filter((s) => s !== skill),
      });
    } else if (skills.length < 3) {
      setCafeData({
        ...cafeData,
        preferred_skills: [...skills, skill],
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("로그인 정보가 없습니다.");
      }

      const { error: ownerError } = await supabase
        .from("owner_profiles")
        .upsert(
          {
            user_id: user.id,
            user_email: user.email,
            owner_name: ownerData.owner_name,
            phone: ownerData.phone,
            privacy_agreed: ownerData.privacy_agreed,
            marketing_agreed: ownerData.marketing_agreed,
            updated_at: new Date(),
          },
          { onConflict: "user_id" }
        );

      if (ownerError) throw ownerError;

      let geo = null;
      if (cafeData.lat != null && cafeData.lng != null) {
        geo = { lat: cafeData.lat, lng: cafeData.lng };
      } else if (cafeData.address && kakaoReady) {
        try {
          geo = await geocodeAddress(cafeData.address);
        } catch (err) {
          console.warn("Geocode failed:", err);
        }
      }

      const cafePayload = {
        owner_id: user.id,
        name: cafeData.cafe_name,
        address: cafeData.address,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        cafe_type: cafeData.cafe_type || null,
        description: cafeData.atmosphere_description || null,
      };

      const { data: cafeRow, error: insertError } = await supabase
        .from("cafes")
        .insert(cafePayload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      const photoUrls = [];
      if (cafeRow?.id && cafeData.photos.length > 0) {
        for (const item of cafeData.photos) {
          if (!item.file) continue;
          try {
            photoUrls.push(
              await uploadFile(
                supabase,
                BUCKETS.cafe,
                cafeRow.id,
                item.file,
                "cafe"
              )
            );
          } catch (err) {
            console.warn("Cafe photo upload failed:", err);
          }
        }
      }

      if (cafeRow?.id) {
        const { error: updateError } = await supabase
          .from("cafes")
          .update({ photos: photoUrls })
          .eq("id", cafeRow.id);
        if (updateError) throw updateError;
      }

      const { error: ownerFlagError } = await supabase
        .from("owner_profiles")
        .update({
          onboarding_completed: true,
          profile_completed: true,
          updated_at: new Date(),
        })
        .eq("user_id", user.id);

      if (ownerFlagError) throw ownerFlagError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "owner", onboarding_completed: true })
        .eq("id", user.id);

      if (profileError) throw profileError;

      navigate("/owner", { replace: true });
    } catch (err) {
      console.error("Owner onboarding failed:", err);
      setError(err.message || "온보딩 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitLayout
      leftContent={
        <div className="p-12">
          <img
            src="/images/main_illust.png"
            alt="Owner Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
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
                  {[1, 2, 3].map((s) => (
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
            className="p-6 space-y-6"
          >
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                사장님 정보
              </h2>
              <p className="text-gray-500">기본 정보를 입력해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>사장님 이름</Label>
                <Input
                  value={ownerData.owner_name}
                  onChange={(event) =>
                    setOwnerData({
                      ...ownerData,
                      owner_name: event.target.value,
                    })
                  }
                  placeholder="이름을 입력해주세요"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>전화번호</Label>
                <Input
                  value={ownerData.phone}
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

                    setOwnerData({ ...ownerData, phone: formatted });

                    if (value.length > 0 && value.length < 10) {
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
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!ownerData.owner_name || !ownerData.phone || phoneError}
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
                대표 카페 등록
              </h2>
              <p className="text-gray-500">첫 번째 카페 정보를 입력해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>카페명</Label>
                <Input
                  value={cafeData.cafe_name}
                  onChange={(event) =>
                    setCafeData({ ...cafeData, cafe_name: event.target.value })
                  }
                  placeholder="카페 이름을 입력해주세요"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>카페 주소</Label>
                <Input
                  value={cafeData.address}
                  onChange={(event) =>
                    setCafeData({ ...cafeData, address: event.target.value })
                  }
                  placeholder="도로명 주소를 입력해주세요"
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
                <Label>카페 타입</Label>
                <Select
                  value={cafeData.cafe_type}
                  onValueChange={(value) =>
                    setCafeData({ ...cafeData, cafe_type: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="카페 타입을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAFE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <PhotoUploader
                photos={cafeData.photos}
                onPhotosChange={(photos) =>
                  setCafeData({ ...cafeData, photos })
                }
                maxPhotos={4}
                label="매장 사진 (최대 4장)"
              />

              <div>
                <Label>매장 분위기 소개</Label>
                <Textarea
                  value={cafeData.atmosphere_description}
                  onChange={(event) =>
                    setCafeData({
                      ...cafeData,
                      atmosphere_description: event.target.value,
                    })
                  }
                  placeholder="크루와 근무 환경을 소개해주세요"
                  className="mt-1.5 min-h-[100px]"
                />
              </div>

              <div>
                <Label>선호 스킬 (최대 3개)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SKILLS.map((skill) => (
                    <SkillBadge
                      key={skill}
                      skill={skill}
                      selected={cafeData.preferred_skills.includes(skill)}
                      onClick={() => toggleSkill(skill)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              disabled={
                !cafeData.cafe_name || !cafeData.address || !cafeData.cafe_type
              }
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
                  checked={ownerData.privacy_agreed}
                  onCheckedChange={(value) =>
                    setOwnerData({
                      ...ownerData,
                      privacy_agreed: Boolean(value),
                    })
                  }
                />
                <label htmlFor="privacy" className="text-sm cursor-pointer">
                  <span className="text-red-500">[필수]</span> 개인정보처리방침에
                  동의합니다
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={ownerData.marketing_agreed}
                  onCheckedChange={(value) =>
                    setOwnerData({
                      ...ownerData,
                      marketing_agreed: Boolean(value),
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
              disabled={!ownerData.privacy_agreed || loading}
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "시작하기"}
            </Button>
          </div>
        )}
        <AddressSearchModal
          open={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSelect={(location) => {
            setCafeData({
              ...cafeData,
              address: location.address,
              lat: location.lat,
              lng: location.lng,
            });
          }}
        />
          </motion.div>
        </div>
      }
    />
  );
}
