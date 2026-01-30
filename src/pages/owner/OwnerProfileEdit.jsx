import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import AddressSearchModal from "../../components/AddressSearchModal";
import { loadKakaoSdk, geocodeAddress } from "../../lib/kakao";

export default function OwnerProfileEdit() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    owner_name: "",
    phone: "",
    address: "",
    lat: null,
    lng: null,
  });
  const [phoneError, setPhoneError] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["ownerProfile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      owner_name: profile.owner_name || "",
      phone: profile.phone || "",
      address: profile.address || "",
      lat: profile.lat ?? null,
      lng: profile.lng ?? null,
    });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      let latValue = formData.lat;
      let lngValue = formData.lng;
      if (formData.address && (latValue == null || lngValue == null)) {
        try {
          await loadKakaoSdk();
          const geo = await geocodeAddress(formData.address);
          latValue = geo?.lat ?? latValue;
          lngValue = geo?.lng ?? lngValue;
        } catch (error) {
          console.warn("Owner geocode failed:", error);
        }
      }
      if (profile?.id) {
        const { error } = await supabase
          .from("owner_profiles")
          .update({
            owner_name: formData.owner_name,
            phone: formData.phone,
            address: formData.address,
            lat: latValue,
            lng: lngValue,
          })
          .eq("id", profile.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("owner_profiles").insert({
        user_id: user.id,
        user_email: user.email,
        owner_name: formData.owner_name,
        phone: formData.phone,
        address: formData.address,
        lat: latValue,
        lng: lngValue,
        profile_completed: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerProfile"] });
      navigate(-1);
    },
  });

  const handlePhoneChange = (value) => {
    let digits = value.replace(/[^0-9]/g, "");
    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(
        7
      )}`;
    }

    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (
      value !== formatted &&
      value.replace(/[^0-9-]/g, "") !== formatted
    ) {
      setPhoneError("정확한 전화번호를 입력해주세요.");
    } else {
      setPhoneError("");
    }
  };

  if (isLoading) {
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
            alt="Owner Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
        <div className="min-h-screen bg-white">
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
            className="p-6 space-y-6"
          >
            <div>
              <Label>이메일</Label>
              <Input value={user?.email || ""} disabled className="mt-1.5 bg-gray-50" />
            </div>

            <div>
              <Label>이름</Label>
              <Input
                value={formData.owner_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, owner_name: e.target.value }))
                }
                placeholder="이름을 입력해주세요"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>전화번호</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
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
                id="owner-address"
                name="address"
                autoComplete="street-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
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

            <Button
              onClick={() => updateMutation.mutate()}
              disabled={
                updateMutation.isPending ||
                !formData.owner_name ||
                !formData.phone
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
            <AddressSearchModal
              open={showAddressModal}
              onClose={() => setShowAddressModal(false)}
              onSelect={({ lat, lng, address }) => {
                console.log("주소 선택됨:", lat, lng, address);
                setFormData((prev) => ({
                  ...prev,
                  address,
                  lat,
                  lng,
                }));
              }}
            />
          </motion.div>
        </div>
      }
    />
  );
}
