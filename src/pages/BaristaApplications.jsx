import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SplitLayout from "../components/SplitLayout";
import { Badge } from "../components/ui/badge";
import { getSupabase } from "../lib/supabase";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import ko from "date-fns/locale/ko";

const statusLabel = {
  pending: "검토중",
  hired: "채용확정",
  rejected: "불합격",
};

const statusStyle = {
  pending: "!bg-yellow-100 !text-yellow-700",
  hired: "!bg-green-100 !text-green-700",
  rejected: "!bg-gray-100 !text-gray-600",
};

export default function BaristaApplications() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) return;

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("barista_email", user.email)
        .order("created_at", { ascending: false });

      const appRows = apps || [];
      setApplications(appRows);

      const postIds = appRows
        .map((app) => app.job_post_id)
        .filter(Boolean);

      if (!postIds.length) {
        setPosts([]);
        return;
      }

      const { data: postRows } = await supabase
        .from("job_posts")
        .select("*")
        .in("id", postIds);

      setPosts(postRows || []);
    };

    fetchData();
  }, []);

  const postMap = useMemo(() => {
    return posts.reduce((acc, post) => {
      acc[post.id] = post;
      return acc;
    }, {});
  }, [posts]);

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
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="font-semibold text-gray-900">내 지원 현황</h1>
                <p className="text-xs text-gray-500">
                  총 {applications.length}건
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">지원한 공고가 없습니다</p>
              </div>
            ) : (
              applications.map((app) => {
                const post = postMap[app.job_post_id];
                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (post?.id) {
                        navigate(`/barista/baristadetail/${post.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {post?.cafe_name || "공고"}
                          </h3>
                          {app.status && (
                            <Badge className={statusStyle[app.status]}>
                              {statusLabel[app.status] || app.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px]">
                            {post?.cafe_address || "주소 미정"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1FBECC]">
                          {post?.work_period_type === "long-term"
                            ? `${post?.monthly_salary?.toLocaleString()}원`
                            : `${post?.hourly_wage?.toLocaleString()}원`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {post?.work_period_type === "long-term"
                            ? "월급"
                            : "시급"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post?.work_start_date && post?.work_end_date
                            ? `${format(
                                new Date(post.work_start_date),
                                "M/d (E)",
                                { locale: ko }
                              )} ~ ${format(
                                new Date(post.work_end_date),
                                "M/d (E)",
                                { locale: ko }
                              )}`
                            : "일정 미정"}
                        </span>
                        <span>
                          {post?.start_time} - {post?.end_time}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/barista/applications/${app.id}`);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#1FBECC]"
                      >
                        <FileText className="w-4 h-4" />
                        지원서 보기
                      </button>
                    </div>

                    {post?.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.required_skills.slice(0, 3).map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs bg-gray-100"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      }
    />
  );
}
