import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import SkillBadge from "../../components/ui/SkillBadge";
import { ArrowLeft, Loader2, Store, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import SplitLayout from "../../components/SplitLayout";
import { getSupabase } from "../../lib/supabase";
import { loadKakaoSdk, geocodeAddress } from "../../lib/kakao";
import { toast } from "../../components/ui/use-toast";

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

const BENEFITS = [
  { id: "meal", label: "식사 제공" },
  { id: "break", label: "휴게시간 제공" },
  { id: "insurance", label: "4대 보험" },
  { id: "uniform", label: "근무복 지급" },
];

export default function JobCreate() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cafes, setCafes] = useState([]);
  const [selectedCafeId, setSelectedCafeId] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);

  const [formData, setFormData] = useState({
    work_period_type: "short-term",
    work_type: "",
    work_start_date: "",
    work_end_date: "",
    start_time: "",
    end_time: "",
    hourly_wage: "10,320",
    monthly_salary: "",
    job_description: "",
    preferred_qualifications: "",
    benefits: [],
    required_skills: [],
  });

  useEffect(() => {
    const boot = async () => {
      try {
        await loadKakaoSdk();
        setKakaoReady(true);
      } catch (err) {
        console.warn("Kakao SDK load failed:", err);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const fetchCafes = async () => {
      const { data } = await supabase
        .from("cafes")
        .select("*")
        .eq("owner_id", user.id);
      setCafes(data || []);
    };
    fetchCafes();
  }, [user]);

  const selectedCafe = cafes.find((cafe) => cafe.id === selectedCafeId);
  const parseMoney = (value) => {
    const numeric = String(value || "").replace(/[^0-9]/g, "");
    return numeric ? Number(numeric) : NaN;
  };

  const toggleSkill = (skill) => {
    const skills = formData.required_skills;
    if (skills.includes(skill)) {
      setFormData({
        ...formData,
        required_skills: skills.filter((s) => s !== skill),
      });
    } else if (skills.length < 3) {
      setFormData({
        ...formData,
        required_skills: [...skills, skill],
      });
    }
  };

  const toggleBenefit = (benefit) => {
    const benefits = formData.benefits;
    if (benefits.includes(benefit)) {
      setFormData({
        ...formData,
        benefits: benefits.filter((b) => b !== benefit),
      });
    } else {
      setFormData({
        ...formData,
        benefits: [...benefits, benefit],
      });
    }
  };

  const getCafePhotos = (cafe) => {
    if (!cafe?.photos) return [];
    if (Array.isArray(cafe.photos)) return cafe.photos.filter(Boolean);
    if (typeof cafe.photos === "string") return [cafe.photos];
    if (typeof cafe.photos === "object") {
      if (Array.isArray(cafe.photos.urls)) {
        return cafe.photos.urls.filter(Boolean);
      }
      if (cafe.photos.url) return [cafe.photos.url];
    }
    return [];
  };

  const handleSubmit = async () => {
    const isShortTerm = formData.work_period_type === "short-term";
    const missingFields = [];

    if (!selectedCafeId) missingFields.push("카페선택");
    if (!formData.work_start_date) missingFields.push("근무 시작일");
    if (!formData.work_end_date) missingFields.push("근무 종료일");
    if (!formData.start_time) missingFields.push("출근 시간");
    if (!formData.end_time) missingFields.push("퇴근시간");
    if (isShortTerm && !formData.hourly_wage) missingFields.push("시급");
    if (!isShortTerm && !formData.monthly_salary) missingFields.push("월급");
    if (!formData.job_description) missingFields.push("업무소개");
    if (formData.required_skills.length === 0)
      missingFields.push("요구스킬");
    if (!isShortTerm && !formData.work_type) missingFields.push("근무종류");
    if (!isShortTerm && !formData.preferred_qualifications)
      missingFields.push("우대사항");

    if (missingFields.length > 0) {
      toast({
        title: "입력 필요",
        description: `다음 항목을 입력해주세요: ${missingFields.join(", ")}`,
      });
      return;
    }

    if (!selectedCafe || !user?.email) {
      toast({
        title: "공고 등록 실패",
        description: "카페 선택 또는 로그인 상태를 확인해주세요.",
      });
      return;
    }

    setLoading(true);
    try {
      const hourlyWageValue = parseMoney(formData.hourly_wage);
      const monthlySalaryValue = parseMoney(formData.monthly_salary);
      if (isShortTerm && !Number.isFinite(hourlyWageValue)) {
        toast({
          title: "입력 필요",
          description: "시급을 숫자로 입력해주세요.",
        });
        setLoading(false);
        return;
      }
      if (!isShortTerm && !Number.isFinite(monthlySalaryValue)) {
        toast({
          title: "입력 필요",
          description: "월급을 숫자로 입력해주세요.",
        });
        setLoading(false);
        return;
      }
      let geo = null;
      if (selectedCafe.address && kakaoReady) {
        try {
          geo = await geocodeAddress(selectedCafe.address);
        } catch (err) {
          console.warn("Geocode failed:", err);
        }
      }

      const postData = {
        owner_email: user.email,
        cafe_id: selectedCafeId,
        cafe_name: selectedCafe.name,
        cafe_address: selectedCafe.address,
        cafe_type: selectedCafe.cafe_type || null,
        atmosphere_description: selectedCafe.description,
        cafe_photos: getCafePhotos(selectedCafe),
        work_period_type: formData.work_period_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        job_description: formData.job_description,
        benefits: formData.benefits,
        required_skills: formData.required_skills,
        status: "open",
        work_start_date: formData.work_start_date,
        work_end_date: formData.work_end_date,
        cafe_lat: geo?.lat ?? null,
        cafe_lng: geo?.lng ?? null,
      };

      if (formData.work_period_type === "short-term") {
        postData.hourly_wage = hourlyWageValue;
      } else {
        postData.work_type = formData.work_type;
        postData.monthly_salary = monthlySalaryValue;
        postData.preferred_qualifications = formData.preferred_qualifications;
      }

      const { data, error } = await supabase
        .from("job_posts")
        .insert([postData])
        .select("id")
        .single();
      if (error) throw error;

      toast({
        title: "공고 등록 완료",
        description: "공고가 정상적으로 등록되었습니다.",
      });
      navigate(`/owner/jobs/${data.id}`);
    } catch (error) {
      console.error(error);
      toast({
        title: "공고 등록 실패",
        description: error.message || "공고 등록에 실패했습니다.",
      });
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
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="font-semibold text-gray-900">공고 등록</h1>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6"
          >
            <div>
              <Label>카페 선택</Label>
              <select
                value={selectedCafeId}
                onChange={(event) => setSelectedCafeId(event.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e5e5e5]"
              >
                <option value="" disabled>
                  공고를 올릴 카페를 선택해주세요
                </option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </div>

        {selectedCafe && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex gap-3">
              <div>
                <h3 className="font-medium text-gray-900">
                  {selectedCafe.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedCafe.address}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedCafe.description}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label>근무 기간</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  work_period_type: "short-term",
                  work_start_date: "",
                  work_end_date: "",
                })
              }
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.work_period_type === "short-term"
                  ? "border-[#1FBECC] bg-[#1FBECC]/5"
                  : "border-gray-200"
              }`}
            >
              <p className="font-medium text-gray-900">단기</p>
              <p className="text-xs text-gray-500 mt-1">날짜 지정</p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  work_period_type: "long-term",
                  work_start_date: "",
                  work_end_date: "",
                })
              }
              className={`p-4 rounded-xl border-2 transition-colors ${
                formData.work_period_type === "long-term"
                  ? "border-[#1FBECC] bg-[#1FBECC]/5"
                  : "border-gray-200"
              }`}
            >
              <p className="font-medium text-gray-900">중장기</p>
              <p className="text-xs text-gray-500 mt-1">1개월~1년</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>근무 시작일</Label>
            <Input
              type="date"
              lang="ko"
              value={formData.work_start_date}
              onChange={(event) =>
                setFormData({ ...formData, work_start_date: event.target.value })
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>근무 종료일</Label>
            <Input
              type="date"
              lang="ko"
              value={formData.work_end_date}
              onChange={(event) =>
                setFormData({ ...formData, work_end_date: event.target.value })
              }
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>출근 시간</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(event) =>
                setFormData({ ...formData, start_time: event.target.value })
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>퇴근 시간</Label>
            <Input
              type="time"
              value={formData.end_time}
              onChange={(event) =>
                setFormData({ ...formData, end_time: event.target.value })
              }
              className="mt-1.5"
            />
          </div>
        </div>

        {formData.work_period_type === "long-term" && (
          <div>
            <Label>근무 종류</Label>
            <Select
              value={formData.work_type}
              onValueChange={(value) =>
                setFormData({ ...formData, work_type: value })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="근무 종류를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">풀타임</SelectItem>
                <SelectItem value="part-time">파트타임</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {formData.work_period_type === "short-term" ? "시급" : "월급"}
          </Label>
          <div className="relative mt-1.5">
            <Input
              type="text"
              value={
                formData.work_period_type === "short-term"
                  ? formData.hourly_wage
                  : formData.monthly_salary
              }
              onChange={(event) => {
                if (formData.work_period_type === "short-term") {
                  const value = event.target.value.replace(/[^0-9]/g, "");
                  if (!isNaN(value)) {
                    const formatted = value
                      ? Number(value).toLocaleString()
                      : "";
                  setFormData({
                    ...formData,
                    hourly_wage: formatted,
                  });
                  }
                } else {
                  const value = event.target.value.replace(/[^0-9]/g, "");
                  if (!isNaN(value)) {
                    const formatted = value
                      ? Number(value).toLocaleString()
                      : "";
                    setFormData({ ...formData, monthly_salary: formatted });
                  }
                }
              }}
              placeholder={
                formData.work_period_type === "short-term"
                  ? "10,320"
                  : "2,096,270"
              }
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              원
            </span>
          </div>
        </div>

        <div>
          <Label>업무 소개</Label>
          <Textarea
            value={formData.job_description}
            onChange={(event) =>
              setFormData({ ...formData, job_description: event.target.value })
            }
            placeholder="업무 내용을 간단히 소개해주세요"
            className="mt-1.5 min-h-[100px]"
          />
        </div>

        {formData.work_period_type === "long-term" && (
          <div>
            <Label>우대사항</Label>
            <Textarea
              value={formData.preferred_qualifications}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  preferred_qualifications: event.target.value,
                })
              }
              placeholder="우대사항을 작성해주세요"
              className="mt-1.5 min-h-[100px]"
            />
          </div>
        )}

        <div>
          <Label>요구 스킬 (최대 3개)</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SKILLS.map((skill) => (
              <SkillBadge
                key={skill}
                skill={skill}
                selected={formData.required_skills.includes(skill)}
                onClick={() => toggleSkill(skill)}
                size="sm"
              />
            ))}
          </div>
        </div>

        <div>
          <Label>제공 사항 (선택)</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.id}
                onClick={() => toggleBenefit(benefit.label)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  formData.benefits.includes(benefit.label)
                    ? "border-[#1FBECC] bg-[#1FBECC]/5"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.benefits.includes(benefit.label)}
                  />
                  <span className="text-sm">{benefit.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-700">
            <p className="font-medium mb-1">보건증 필참</p>
            <p className="text-amber-600">지원 후 개별 연락드립니다.</p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "공고 등록하기"
          )}
        </Button>
          </motion.div>
        </div>
      }
    />
  );
}
