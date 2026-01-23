import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SplitLayout from "../../components/SplitLayout";
import { getSupabase } from "../../lib/supabase";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileCheck,
  MapPin,
  PencilLine,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

const statusLabel = {
  open: "모집중",
  closed: "마감",
  completed: "완료",
  pending: "대기",
  hired: "채용확정",
};

const statusStyle = {
  pending: "!bg-yellow-100 !text-yellow-700",
  hired: "!bg-green-100 !text-green-700",
  rejected: "!bg-gray-100 !text-gray-600",
};

const BENEFIT_LABELS = {
  meal: "식사 제공",
  break: "휴게시간 제공",
  insurance: "4대 보험",
  uniform: "근무복 지급",
};

export default function JobManage() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("open");
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: postRow, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setJob(postRow);
      setStatus(postRow.status ?? "open");

      if (postRow?.cafe_id) {
        const { data: cafeRow, error: cafeError } = await supabase
          .from("cafes")
          .select("*")
          .eq("id", postRow.cafe_id)
          .single();
        if (!cafeError) {
          setCafe(cafeRow);
        }
      }

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("job_post_id", id)
        .order("created_at", { ascending: false });
      setApplications(apps || []);
    };

    fetchData();
  }, [id]);

  const pendingCount = useMemo(
    () => applications.filter((app) => app.status === "pending").length,
    [applications]
  );
  const hasHired = useMemo(
    () => applications.some((app) => app.status === "hired"),
    [applications]
  );
  const [confirmingId, setConfirmingId] = useState(null);

  const handleSave = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const payload = { status };

      const { error } = await supabase
        .from("job_posts")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHire = async (applicationId) => {
    if (!applicationId || !job) return;
    setConfirmingId(applicationId);
    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "hired" })
        .eq("id", applicationId);
      if (updateError) throw updateError;

      const { error: postError } = await supabase
        .from("job_posts")
        .update({
          status: "closed",
          hired_barista_email: null,
          review_written: false,
        })
        .eq("id", job.id);
      if (postError) throw postError;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: "hired" } : app
        )
      );
      setSelectedApplicantId(applicationId);
      setStatus("closed");
      setJob((prev) => (prev ? { ...prev, status: "closed" } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReview = (applicationId) => {
    if (!applicationId) return;
    navigate(`/owner/baristas/${applicationId}?review=1`);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("정말 공고를 삭제할까요?")) return;
    const { error } = await supabase.from("job_posts").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    navigate("/owner");
  };

  const workPeriodLabel = useMemo(() => {
    if (!job) return "";
    if (job.work_period_type === "long-term") return "중장기";
    if (job.work_period_type === "short-term") return "단기";
    return job.work_period_type || "기간 미정";
  }, [job]);

  const cafeName = cafe?.name || job?.cafe_name || "카페";
  const cafeAddress = cafe?.address || job?.cafe_address;
  const cafeImage = useMemo(() => {
    const photos = cafe?.photos;
    if (!photos) return null;
    if (Array.isArray(photos)) {
      const first = photos[0];
      if (typeof first === "string") return first;
      return first?.url || first?.publicUrl || null;
    }
    if (typeof photos === "string") return photos;
    if (typeof photos === "object") {
      if (Array.isArray(photos.urls)) return photos.urls[0] || null;
      return photos.url || photos.publicUrl || null;
    }
    return null;
  }, [cafe]);

  const benefitLabel = (value) => BENEFIT_LABELS[value] || value;

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
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="font-semibold text-gray-900">공고 관리</h1>
                  <p className="text-xs text-gray-500">{cafeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/owner/jobs/${job.id}/edit`)}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <PencilLine className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </div>
          </div>

          {cafeImage && (
            <div className="h-56 overflow-hidden">
              <img
                src={cafeImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1FBECC]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1FBECC]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {applications.length}
                    </p>
                    <p className="text-xs text-gray-500">전체 지원자</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {pendingCount}
                    </p>
                    <p className="text-xs text-gray-500">대기중 지원자</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  공고 정보
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="text-sm border border-gray-200 rounded-md px-2 py-1"
                  >
                    <option value="open">모집중</option>
                    <option value="closed">마감</option>
                    <option value="completed">완료</option>
                  </select>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="h-9 px-3 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-lg text-sm"
                  >
                    {loading ? "저장 중..." : "상태 저장"}
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {cafeName}
                  </h3>
                  <Badge className="!bg-[#1FBECC]/10 !text-[#1FBECC] text-xs">
                    {workPeriodLabel}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{cafeAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">급여</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {job.work_period_type === "long-term"
                      ? `${job.monthly_salary?.toLocaleString()}원`
                      : `${job.hourly_wage?.toLocaleString()}원`}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 mb-1">근무 형태</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {job.work_type === "full-time" ? "풀타임" : "파트타임"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {job.work_start_date && job.work_end_date
                      ? `${new Date(job.work_start_date).toLocaleDateString(
                          "ko-KR"
                        )} ~ ${new Date(job.work_end_date).toLocaleDateString(
                          "ko-KR"
                        )}`
                      : "일정 미정"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {job.start_time} - {job.end_time}
                  </span>
                </div>
              </div>

              {job.job_description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">업무 소개</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {job.job_description}
                  </p>
                </div>
              )}

              {job.required_skills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    요구 스킬
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs !bg-gray-100"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.benefits?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    복지/제공 사항
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.benefits.map((benefit) => (
                      <Badge
                        key={benefit}
                        className="text-xs !bg-[#1FBECC]/10 !text-[#1FBECC]"
                      >
                        {benefitLabel(benefit)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.preferred_qualifications && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">우대사항</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {job.preferred_qualifications}
                  </p>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
                <FileCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">보건증 필참</p>
                  <p className="text-amber-600">지원 전 준비해주세요.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  지원자 리스트
                </h2>
                <Link
                  to={`/owner/applicants?postId=${job.id}`}
                  className="text-sm text-[#1FBECC]"
                >
                  전체보기
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <FileCheck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    아직 지원자가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app, index) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/owner/applicants/${app.id}`}>
                        <div className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:border-gray-200">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                if (hasHired) return;
                                setSelectedApplicantId(app.id);
                              }}
                              disabled={hasHired}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                selectedApplicantId === app.id
                                  ? "border-[#1FBECC] bg-[#1FBECC]/10"
                                  : "border-gray-300 bg-white"
                              } ${hasHired ? "opacity-40" : ""}`}
                              aria-label="지원자 선택"
                            >
                              {selectedApplicantId === app.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1FBECC]" />
                              )}
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-semibold">
                              {app.barista_name?.[0] || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {app.barista_name || "이름 미상"}
                              </p>
                              {app.barista_address && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {app.barista_address}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={statusStyle[app.status]}>
                            {statusLabel[app.status] || app.status}
                          </Badge>
                        </div>
                      </Link>
                      <div className="flex justify-end mt-3">
                        {app.status === "hired" ? (
                          <Button
                            variant="outline"
                            className="h-9 px-4 rounded-full text-sm"
                            onClick={() => handleReview(app.id)}
                          >
                            리뷰 남기기
                          </Button>
                        ) : (
                          <Button
                            className="h-9 px-4 rounded-full text-sm bg-[#1FBECC] hover:bg-[#1AABB8] text-white"
                            disabled={
                              confirmingId === app.id ||
                              hasHired ||
                              selectedApplicantId !== app.id
                            }
                            onClick={() => handleConfirmHire(app.id)}
                          >
                            {confirmingId === app.id ? "처리 중..." : "채용 확정"}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
