import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SplitLayout from "../components/SplitLayout";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { getSupabase } from "../lib/supabase";
import { MapPin, Clock, Search, Briefcase } from "lucide-react";
import { format } from "date-fns";
import ko from "date-fns/locale/ko";
import { motion } from "framer-motion";

const normalizePeriod = (value) => {
  if (!value) return "";
  const text = String(value).toLowerCase();
  if (text.includes("short") || text.includes("단기")) return "short";
  if (text.includes("long") || text.includes("풀") || text.includes("full")) {
    return "long";
  }
  return text;
};

export default function FullTimeJobs() {
  const supabase = getSupabase();
  const [user, setUser] = useState(null);
  const [jobPosts, setJobPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: posts } = await supabase
        .from("job_posts")
        .select("*")
        .eq("status", "open")
        .in("work_period_type", ["long-term", "long", "풀타임", "full-time"])
        .order("created_at", { ascending: false });
      setJobPosts(posts || []);

      if (!authUser?.email) return;

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("barista_email", authUser.email);
      setApplications(apps || []);
    };

    fetchData();
  }, []);

  const appliedPostIds = useMemo(
    () =>
      applications
        .map((application) => application.job_post_id)
        .filter(Boolean),
    [applications]
  );

  const filteredPosts = useMemo(() => {
    const periodFiltered = jobPosts.filter(
      (post) => normalizePeriod(post.work_period_type) === "long"
    );
    if (!searchQuery) return periodFiltered;
    const query = searchQuery.toLowerCase();
    return periodFiltered.filter((post) => {
      return (
        post.cafe_name?.toLowerCase().includes(query) ||
        post.cafe_address?.toLowerCase().includes(query) ||
        post.required_skills?.some((skill) =>
          skill.toLowerCase().includes(query)
        )
      );
    });
  }, [jobPosts, searchQuery]);

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
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-semibold text-gray-900">풀타임 공고</h1>
              <span className="text-xs text-gray-500">
                {filteredPosts.length}건
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="카페명, 지역, 스킬로 검색"
                className="pl-9 h-9 bg-gray-50 border-0"
              />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">등록된 공고가 없습니다</p>
              </div>
            ) : (
              filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/barista/baristadetail/${post.id}`}>
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {post.cafe_photos?.length > 0 && (
                        <div className="h-28 overflow-hidden">
                          <img
                            src={post.cafe_photos[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {post.cafe_name}
                              </h3>
                              {appliedPostIds.includes(post.id) && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">
                                  지원완료
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[200px]">
                                {post.cafe_address}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#1FBECC]">
                              {post.monthly_salary?.toLocaleString()}원
                            </p>
                            <p className="text-xs text-gray-500">월급</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.work_start_date && post.work_end_date
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
                            {post.start_time} - {post.end_time}
                          </span>
                        </div>

                        {post.required_skills?.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {post.required_skills.map((skill) => (
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
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>
      }
    />
  );
}
