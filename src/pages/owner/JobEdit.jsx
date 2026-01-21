import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import SplitLayout from "../../components/SplitLayout";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { ArrowLeft } from "lucide-react";
import SkillBadge from "../../components/ui/SkillBadge";
import { motion } from "framer-motion";

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

export default function JobEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    work_period_type: "short-term",
    work_start_date: "",
    work_end_date: "",
    start_time: "",
    end_time: "",
    hourly_wage: "",
    monthly_salary: "",
    work_type: "",
    job_description: "",
    preferred_qualifications: "",
    benefits: [],
    required_skills: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
        return;
      }
      setJob(data);
      setFormData({
        work_period_type: data.work_period_type ?? "short-term",
        work_start_date: data.work_start_date ?? "",
        work_end_date: data.work_end_date ?? "",
        start_time: data.start_time ?? "",
        end_time: data.end_time ?? "",
        hourly_wage: data.hourly_wage ?? "",
        monthly_salary: data.monthly_salary ?? "",
        work_type: data.work_type ?? "",
        job_description: data.job_description ?? "",
        preferred_qualifications: data.preferred_qualifications ?? "",
        benefits: data.benefits ?? [],
        required_skills: data.required_skills ?? [],
      });
    };
    fetchData();
  }, [id]);

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

  const handleSave = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const payload = {
        work_period_type: formData.work_period_type,
        work_start_date: formData.work_start_date,
        work_end_date: formData.work_end_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        job_description: formData.job_description,
        benefits: formData.benefits,
        required_skills: formData.required_skills,
      };

      if (formData.work_period_type === "short-term") {
        payload.hourly_wage = Number(formData.hourly_wage);
        payload.monthly_salary = null;
        payload.work_type = null;
        payload.preferred_qualifications = null;
      } else {
        payload.work_type = formData.work_type || null;
        payload.monthly_salary = Number(
          String(formData.monthly_salary || "").replace(/,/g, "")
        );
        payload.preferred_qualifications =
          formData.preferred_qualifications || null;
        payload.hourly_wage = null;
      }

      const { error } = await supabase
        .from("job_posts")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      navigate(`/owner/jobs/${id}`, { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!job) {
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
          <div className="min-h-screen bg-white flex items-center justify-center">
            로딩 중…
          </div>
        }
      />
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
              <div>
                <h1 className="font-semibold text-gray-900">공고 수정</h1>
                <p className="text-xs text-gray-500">{job.cafe_name}</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6"
          >
            <div>
              <Label>근무 기간</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      work_period_type: "short-term",
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
                  value={formData.work_start_date}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      work_start_date: event.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>근무 종료일</Label>
                <Input
                  type="date"
                  value={formData.work_end_date}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      work_end_date: event.target.value,
                    })
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
                    setFormData({
                      ...formData,
                      start_time: event.target.value,
                    })
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
                    setFormData({
                      ...formData,
                      end_time: event.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>

            {formData.work_period_type === "long-term" && (
              <div>
                <Label>근무 종류</Label>
                <select
                  value={formData.work_type}
                  onChange={(event) =>
                    setFormData({ ...formData, work_type: event.target.value })
                  }
                  className="mt-1.5 flex h-10 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e5e5e5]"
                >
                  <option value="">근무 종류 선택</option>
                  <option value="full-time">풀타임</option>
                  <option value="part-time">파트타임</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>
                  {formData.work_period_type === "short-term" ? "시급" : "월급"}
                </Label>
                <Input
                  type="text"
                  value={
                    formData.work_period_type === "short-term"
                      ? formData.hourly_wage
                      : formData.monthly_salary
                  }
                  onChange={(event) => {
                    if (formData.work_period_type === "short-term") {
                      setFormData({
                        ...formData,
                        hourly_wage: event.target.value,
                      });
                    } else {
                      const value = event.target.value.replace(/,/g, "");
                      if (!isNaN(value)) {
                        const formatted = value
                          ? Number(value).toLocaleString()
                          : "";
                        setFormData({
                          ...formData,
                          monthly_salary: formatted,
                        });
                      }
                    }
                  }}
                  placeholder={
                    formData.work_period_type === "short-term"
                      ? "10000"
                      : "2,096,270"
                  }
                  className="mt-1.5"
                />
              </div>
              {formData.work_period_type === "long-term" && (
                <div>
                  <Label>우대사항</Label>
                  <Input
                    value={formData.preferred_qualifications}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        preferred_qualifications: event.target.value,
                      })
                    }
                    placeholder="우대사항을 입력해주세요"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>업무 소개</Label>
              <Textarea
                value={formData.job_description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    job_description: event.target.value,
                  })
                }
                className="mt-1.5 min-h-[120px]"
              />
            </div>

            <div>
              <Label>복지</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BENEFITS.map((benefit) => (
                  <SkillBadge
                    key={benefit.id}
                    skill={benefit.label}
                    selected={formData.benefits.includes(benefit.id)}
                    onClick={() => toggleBenefit(benefit.id)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

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

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
            >
              {loading ? "저장 중..." : "변경 사항 저장"}
            </Button>
          </motion.div>
        </div>
      }
    />
  );
}
