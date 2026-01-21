import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import SplitLayout from "../../components/SplitLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { format } from "date-fns";
import ko from "date-fns/locale/ko";

const statusLabel = {
  open: "모집중",
  closed: "마감",
  completed: "완료",
};

const statusStyle = {
  open: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  completed: "bg-blue-100 text-blue-700",
};

const workPeriodLabel = (value) => {
  if (value === "long-term") return "중장기";
  if (value === "short-term") return "단기";
  return value || "기간 미정";
};

const getCafeImage = (photos) => {
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
};

const formatWorkDate = (post) => {
  if (post.work_start_date && post.work_end_date) {
    return `${format(new Date(post.work_start_date), "M/d (E)", {
      locale: ko,
    })} ~ ${format(new Date(post.work_end_date), "M/d (E)", { locale: ko })}`;
  }
  return "일정 미정";
};

export default function JobList() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authUser, setAuthUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [cafeFilter, setCafeFilter] = useState("all");

  useEffect(() => {
    const fetchAuthUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setAuthUser(currentUser ?? null);
    };
    fetchAuthUser();
  }, []);

  const ownerId = authUser?.id || user?.id;
  const ownerEmail = (authUser?.email || user?.email || "").trim();

  const { data: cafes = [] } = useQuery({
    queryKey: ["cafes", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ownerId,
  });

  const { data: jobPosts = [] } = useQuery({
    queryKey: ["jobPosts", ownerEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("owner_email", ownerEmail)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ownerEmail,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", jobPosts.map((post) => post.id)],
    queryFn: async () => {
      const postIds = jobPosts.map((post) => post.id).filter(Boolean);
      if (postIds.length === 0) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("id, job_post_id, status")
        .in("job_post_id", postIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: jobPosts.length > 0,
  });

  const cafesById = useMemo(() => {
    const map = new Map();
    cafes.forEach((cafe) => {
      map.set(cafe.id, cafe);
    });
    return map;
  }, [cafes]);

  const applicationCounts = useMemo(() => {
    const map = new Map();
    applications.forEach((app) => {
      if (!app.job_post_id) return;
      const current = map.get(app.job_post_id) || {
        total: 0,
        pending: 0,
      };
      current.total += 1;
      if (app.status === "pending") current.pending += 1;
      map.set(app.job_post_id, current);
    });
    return map;
  }, [applications]);

  const filteredJobs = useMemo(() => {
    let list = [...jobPosts];
    if (statusFilter !== "all") {
      list = list.filter((post) => post.status === statusFilter);
    }
    if (periodFilter !== "all") {
      list = list.filter((post) => post.work_period_type === periodFilter);
    }
    if (cafeFilter !== "all") {
      list = list.filter((post) => post.cafe_id === cafeFilter);
    }
    return list;
  }, [jobPosts, statusFilter, periodFilter, cafeFilter]);

  const totalCount = jobPosts.length;
  const openCount = jobPosts.filter((post) => post.status === "open").length;
  const pendingCount = applications.filter(
    (app) => app.status === "pending"
  ).length;

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
              <div>
                <h1 className="font-semibold text-gray-900">공고 관리</h1>
                <p className="text-xs text-gray-500">
                  내 공고를 한눈에 관리하세요
                </p>
              </div>
              <Button
                onClick={() => navigate("/owner/jobs/new")}
                className="h-10 px-4 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                공고 등록
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">전체 공고</div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalCount}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">모집중</div>
                <div className="text-2xl font-bold text-gray-900">
                  {openCount}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">대기중 지원</div>
                <div className="text-2xl font-bold text-gray-900">
                  {pendingCount}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "전체" },
                  { id: "open", label: "모집중" },
                  { id: "closed", label: "마감" },
                  { id: "completed", label: "완료" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      statusFilter === item.id
                        ? "border-[#1FBECC] bg-[#1FBECC]/10 text-[#1FBECC]"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">기간</span>
                  <div className="flex gap-2">
                    {[
                      { id: "all", label: "전체" },
                      { id: "short-term", label: "단기" },
                      { id: "long-term", label: "중장기" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPeriodFilter(item.id)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          periodFilter === item.id
                            ? "border-[#1FBECC] bg-[#1FBECC]/10 text-[#1FBECC]"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">카페</span>
                  <select
                    value={cafeFilter}
                    onChange={(event) => setCafeFilter(event.target.value)}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="all">전체</option>
                    {cafes.map((cafe) => (
                      <option key={cafe.id} value={cafe.id}>
                        {cafe.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div className="text-sm text-gray-500">
                  조건에 맞는 공고가 없습니다.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((post) => {
                  const cafe = cafesById.get(post.cafe_id);
                  const imageUrl = getCafeImage(cafe?.photos);
                  const counts = applicationCounts.get(post.id) || {
                    total: 0,
                    pending: 0,
                  };
                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-32 md:w-40 md:h-28 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 md:w-40 md:h-28 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                            이미지 없음
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {post.cafe_name}
                            </h3>
                            <Badge className="!bg-[#1FBECC]/10 !text-[#1FBECC] text-xs">
                              {workPeriodLabel(post.work_period_type)}
                            </Badge>
                            <Badge className={statusStyle[post.status]}>
                              {statusLabel[post.status] || post.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{post.cafe_address}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatWorkDate(post)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {post.start_time} - {post.end_time}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>지원자 {counts.total}</span>
                            <span>대기 {counts.pending}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 md:flex-col md:items-end">
                          <Link
                            to={`/owner/jobs/${post.id}`}
                            className="text-sm text-[#1FBECC] font-medium"
                          >
                            관리하기
                          </Link>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
