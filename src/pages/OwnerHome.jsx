import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Store,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { motion } from "framer-motion";
import SplitLayout from "../components/SplitLayout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

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

const formatWorkDate = (post) => {
  if (post.work_start_date && post.work_end_date) {
    return `${format(new Date(post.work_start_date), "M/d (E)", {
      locale: ko,
    })} ~ ${format(new Date(post.work_end_date), "M/d (E)", { locale: ko })}`;
  }
  return "일정 미정";
};

export default function OwnerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
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

  const { data: cafes = [] } = useQuery({
    queryKey: ["cafes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: jobPosts = [] } = useQuery({
    queryKey: ["jobPosts", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("*")
        .eq("owner_email", user.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["applications", jobPosts.map((post) => post.id)],
    queryFn: async () => {
      const postIds = jobPosts.map((post) => post.id).filter(Boolean);
      if (postIds.length === 0) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .in("job_post_id", postIds)
        .eq("status", "pending");
      if (error) throw error;
      return data ?? [];
    },
    enabled: jobPosts.length > 0,
  });

  const pendingCount = applications.length;
  const openPostsCount = useMemo(
    () => jobPosts.filter((post) => post.status === "open").length,
    [jobPosts]
  );

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
          <div className="hidden md:block bg-white px-4 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">안녕하세요 👋</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {profile?.owner_name || user?.email || "사장"}님
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#1FBECC]/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-[#1FBECC]" />
              </div>
            </div>
          </div>

          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold text-gray-900">내 공고 관리</h2>
          </div>

          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1FBECC]/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#1FBECC]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {openPostsCount}
                    </p>
                    <p className="text-xs text-gray-500">진행중 공고</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
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
              </motion.div>
            </div>

            <Button
              onClick={() => navigate("/owner/jobs/new")}
              className="w-full h-14 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-2xl text-base font-medium shadow-lg shadow-[#1FBECC]/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 공고 등록하기
            </Button>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">내 공고</h2>
                <Link to="/owner/jobs" className="text-sm text-[#1FBECC]">
                  전체보기
                </Link>
              </div>

              {jobPosts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">등록된 공고가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">
                    첫 공고를 등록해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobPosts.slice(0, 3).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link to={`/owner/jobs/${post.id}`}>
                        <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {post.cafe_name}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[180px]">
                                  {post.cafe_address}
                                </span>
                              </div>
                            </div>
                            <Badge className={statusStyle[post.status]}>
                              {statusLabel[post.status] || post.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatWorkDate(post)}
                              </span>
                              <span>
                                {post.start_time} - {post.end_time}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">내 카페</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {cafes.map((cafe) => (
                  <div
                    key={cafe.id}
                    className="flex-shrink-0 w-32 bg-white rounded-xl p-3 shadow-sm"
                  >
                    {(() => {
                      const photos = cafe.photos;
                      let imageUrl = null;
                      if (Array.isArray(photos)) {
                        const first = photos[0];
                        if (typeof first === "string") {
                          imageUrl = first;
                        } else {
                          imageUrl = first?.url || first?.publicUrl || null;
                        }
                      } else if (typeof photos === "string") {
                        imageUrl = photos;
                      } else if (photos && typeof photos === "object") {
                        if (Array.isArray(photos.urls)) {
                          imageUrl = photos.urls[0] || null;
                        } else {
                          imageUrl = photos.url || photos.publicUrl || null;
                        }
                      }

                      if (imageUrl) {
                        return (
                          <img
                            src={imageUrl}
                            alt=""
                            className="w-full h-20 rounded-lg object-cover mb-2"
                          />
                        );
                      }

                      return (
                        <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                          <Store className="w-6 h-6 text-gray-400" />
                        </div>
                      );
                    })()}
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {cafe.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {cafe.address}
                    </p>
                  </div>
                ))}
                {cafes.length < 5 && (
                  <div className="flex-shrink-0 w-32 h-[120px] bg-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <Plus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">
                      카페 추가
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
