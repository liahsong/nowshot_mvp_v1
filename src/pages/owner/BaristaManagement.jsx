import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import SplitLayout from "../../components/SplitLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { MapPin, User as UserIcon, ChevronRight, Star, ArrowLeft } from "lucide-react";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

const normalizeProfilePath = (value, userId) => {
  if (!value || typeof value !== "string") return "";
  if (value.includes("/")) return value;
  if (!userId) return value;
  return `${userId}/profile/${value}`;
};

const calculateAge = (birthDate) => {
  if (!birthDate) return "-";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function BaristaManagement() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileMap, setProfileMap] = useState({});
  const [photoMap, setPhotoMap] = useState({});

  const { data: jobPosts = [] } = useQuery({
    queryKey: ["ownerJobPosts", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("id")
        .eq("owner_email", user.email);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  const { data: hiredApplications = [] } = useQuery({
    queryKey: ["hiredApplications", jobPosts.map((post) => post.id)],
    queryFn: async () => {
      const postIds = jobPosts.map((post) => post.id).filter(Boolean);
      if (postIds.length === 0) return [];
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .in("job_post_id", postIds)
        .eq("status", "hired");
      if (error) throw error;
      return data ?? [];
    },
    enabled: jobPosts.length > 0,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("owner_email", user.email);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const fetchProfiles = async () => {
      const emails = Array.from(
        new Set(hiredApplications.map((app) => app.barista_email).filter(Boolean))
      );
      if (emails.length === 0) {
        setProfileMap({});
        setPhotoMap({});
        return;
      }

      const { data: profiles } = await supabase
        .from("barista_profiles")
        .select("user_id, user_email, profile_photo, birth_date")
        .in("user_email", emails);

      const nextProfileMap = {};
      const nextPhotoMap = {};

      await Promise.all(
        (profiles ?? []).map(async (profile) => {
          nextProfileMap[profile.user_email] = profile;
          if (!profile?.profile_photo) {
            nextPhotoMap[profile.user_email] = "";
            return;
          }
          if (profile.profile_photo.startsWith("http")) {
            nextPhotoMap[profile.user_email] = profile.profile_photo;
            return;
          }
          const normalized = normalizeProfilePath(
            profile.profile_photo,
            profile.user_id
          );
          const { data } = supabase.storage
            .from("barista_profile")
            .getPublicUrl(normalized);
          nextPhotoMap[profile.user_email] = data?.publicUrl || "";
        })
      );

      setProfileMap(nextProfileMap);
      setPhotoMap(nextPhotoMap);
    };

    fetchProfiles();
  }, [hiredApplications]);

  const reviewStats = useMemo(() => {
    const map = {};
    (reviews || []).forEach((review) => {
      if (!review.barista_email) return;
      const existing = map[review.barista_email] || { count: 0, sum: 0 };
      existing.count += 1;
      existing.sum += Number(review.rating || 0);
      map[review.barista_email] = existing;
    });
    return map;
  }, [reviews]);

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
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="font-semibold text-gray-900">바리스타 관리</h1>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {hiredApplications.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">채용된 바리스타가 없습니다</p>
              </div>
            ) : (
              hiredApplications.map((application, index) => {
                const profile = profileMap[application.barista_email];
                const stats = reviewStats[application.barista_email] || {
                  count: 0,
                  sum: 0,
                };
                const avgRating =
                  stats.count > 0 ? (stats.sum / stats.count).toFixed(1) : 0;

                return (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/owner/baristas/${application.id}`}>
                      <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex gap-4 items-start">
                          {photoMap[application.barista_email] ? (
                            <img
                              src={photoMap[application.barista_email]}
                              alt=""
                              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {application.barista_name || "이름 미상"}
                              </h3>
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                채용완료
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                              <span>
                                {calculateAge(
                                  application.barista_birth_date ||
                                    profile?.birth_date
                                )}
                                세
                              </span>
                              {application.barista_address && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">
                                    {application.barista_address}
                                  </span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(application.barista_skills || [])
                                .slice(0, 3)
                                .map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="outline"
                                    className="text-xs bg-gray-50"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                            </div>
                            {stats.count > 0 && (
                              <div className="flex items-center gap-2 mt-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium text-gray-900">
                                    {avgRating}
                                  </span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  리뷰 {stats.count}개
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      }
    />
  );
}
