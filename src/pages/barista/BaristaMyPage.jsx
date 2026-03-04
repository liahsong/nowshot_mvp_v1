import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SplitLayout from "../../components/SplitLayout";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Coffee,
  FileText,
  LogOut,
  PencilLine,
  Star,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { resolveProfileImageUrl } from "@/lib/profileImage";

export default function BaristaMyPage() {
  const supabase = getSupabase();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["baristaProfile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barista_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) console.warn("[BaristaMyPage] ⚠️ profile null — userId:", user.id);
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["baristaApplications", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status")
        .eq("barista_email", user.email);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["baristaReviews", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("barista_email", user.email);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  const hiredCount = applications.filter((app) => app.status === "hired").length;
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  useEffect(() => {
    if (!profile?.profile_photo) {
      setProfilePhotoUrl("");
      return;
    }
    const imageUrl = resolveProfileImageUrl(supabase, profile.profile_photo);
    setProfilePhotoUrl(imageUrl || "");
  }, [profile?.profile_photo]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: Briefcase,
      label: "내 지원 현황",
      path: "/barista/applications",
      count: applications.length,
    },
    { icon: User, label: "프로필 보기", path: "/barista/profile" },
    { icon: PencilLine, label: "프로필 수정", path: "/barista/profile/edit" },
  ];

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
              <h1 className="font-semibold text-gray-900">마이페이지</h1>
            </div>
          </div>

          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
                  {profile?.profile_photo ? (
                    <img
                      src={profilePhotoUrl || profile.profile_photo}
                      alt=""
                      loading="eager"
                      fetchpriority="high"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {profile?.name || "바리스타"}
                  </h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-500">{profile?.phone}</p>
                </div>
              </div>

              {profile?.excellent_skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.excellent_skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-[#1FBECC]/90 text-[#ffffff] border-transparent"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {hiredCount}
                    </p>
                    <p className="text-xs text-gray-500">채용 확정</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">평균 평점</p>
                  </div>
                </div>
              </div>
            </div>

            {profile?.review_tags &&
              Object.keys(profile.review_tags).length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    사장님 평가 요약
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.review_tags).map(([tag, count]) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-amber-50 text-amber-700 border-transparent"
                      >
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {menuItems.map((item, index) => (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                      index !== menuItems.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && (
                        <span className="text-sm text-[#1FBECC] font-medium">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 text-red-500 border-red-200 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      }
    />
  );
}
