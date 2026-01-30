import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SplitLayout from "../components/SplitLayout";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  FileCheck,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { getSupabase } from "../lib/supabase";

export default function ApplicationList() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("postId");
  const [post, setPost] = useState(null);
  const [applications, setApplications] = useState([]);
  const [profilePhotos, setProfilePhotos] = useState({});
  const [applicationPhotos, setApplicationPhotos] = useState({});
  const [profileBasics, setProfileBasics] = useState({});

  useEffect(() => {
    const fetchData = async () => {
        if (postId) {
          const { data: postRow } = await supabase
            .from("job_posts")
            .select("id, cafe_name")
            .eq("id", postId)
            .single();
          setPost(postRow || null);

          const { data: apps } = await supabase
            .from("applications")
            .select("*")
            .eq("job_post_id", postId);
          const nextApps = apps || [];
          setApplications(nextApps);

          const emails = Array.from(
            new Set(nextApps.map((app) => app.barista_email).filter(Boolean))
          );
          if (emails.length > 0) {
            const { data: profiles } = await supabase
              .from("barista_profiles")
              .select("user_id, user_email, profile_photo, birth_date, phone")
              .in("user_email", emails);

            const basicsMap = {};
            const photoMap = {};
            if (profiles) {
              await Promise.all(
                profiles.map(async (profile) => {
                  basicsMap[profile.user_email] = {
                    user_id: profile.user_id,
                    birth_date: profile.birth_date,
                    phone: profile.phone,
                  };
                  photoMap[profile.user_email] =
                    profile.profile_photo?.startsWith("http")
                      ? profile.profile_photo
                      : "";
                })
              );
            }
            setProfileBasics(basicsMap);
            setProfilePhotos(photoMap);

            const appPhotoMap = {};
            await Promise.all(
              nextApps.map(async (app) => {
                if (!app.barista_photo || !app.id) return;
                appPhotoMap[app.id] = app.barista_photo?.startsWith("http")
                  ? app.barista_photo
                  : "";
              })
            );
            setApplicationPhotos(appPhotoMap);
          } else {
            setProfileBasics({});
            setProfilePhotos({});
            setApplicationPhotos({});
          }
          return;
        }

        const { data: apps } = await supabase.from("applications").select("*");
        const nextApps = apps || [];
        setApplications(nextApps);

      const emails = Array.from(
        new Set(nextApps.map((app) => app.barista_email).filter(Boolean))
      );
      if (emails.length > 0) {
        const { data: profiles } = await supabase
          .from("barista_profiles")
          .select("user_id, user_email, profile_photo, birth_date, phone")
          .in("user_email", emails);

        const basicsMap = {};
        const photoMap = {};
        if (profiles) {
          await Promise.all(
            profiles.map(async (profile) => {
              basicsMap[profile.user_email] = {
                user_id: profile.user_id,
                birth_date: profile.birth_date,
                phone: profile.phone,
              };
              const normalized = normalizeProfilePath(
                profile.profile_photo,
                profile.user_id
              );
              photoMap[profile.user_email] = await resolvePhotoUrl(
                normalized,
                "barista_profile"
              );
            })
          );
        }
        setProfileBasics(basicsMap);
        setProfilePhotos(photoMap);

        const appPhotoMap = {};
        await Promise.all(
          nextApps.map(async (app) => {
            if (!app.barista_photo || !app.id) return;
            const normalized = normalizeProfilePath(
              app.barista_photo,
              basicsMap[app.barista_email]?.user_id
            );
            appPhotoMap[app.id] = await resolvePhotoUrl(
              normalized,
              "barista_profile"
            );
          })
        );
        setApplicationPhotos(appPhotoMap);
      } else {
        setProfileBasics({});
        setProfilePhotos({});
        setApplicationPhotos({});
      }
    };

    fetchData();
  }, [postId]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "!bg-yellow-100 !text-yellow-700",
      hired: "!bg-green-100 !text-green-700",
      rejected: "!bg-gray-100 !text-gray-600",
    };
    const labels = {
      pending: "검토중",
      hired: "채용확정",
      rejected: "불합격",
    };
    if (!status || !labels[status]) return null;
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const orderedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      const left = new Date(a.created_at || 0).getTime();
      const right = new Date(b.created_at || 0).getTime();
      return right - left;
    });
  }, [applications]);

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
              <div>
                <h1 className="font-semibold text-gray-900">지원자 리스트</h1>
                <p className="text-xs text-gray-500">
                  {post?.cafe_name || "전체 공고"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {orderedApplications.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">아직 지원자가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderedApplications.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/owner/applicants/${app.id}`}>
                      <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              {profilePhotos[app.barista_email] ||
                              applicationPhotos[app.id] ||
                              app.barista_photo ? (
                                <img
                                  src={
                                    profilePhotos[app.barista_email] ||
                                    applicationPhotos[app.id] ||
                                    app.barista_photo
                                  }
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-medium">
                                {app.barista_name?.[0] || "?"}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {app.barista_name || "이름 미상"}
                              </h3>
                              {calculateAge(
                                app.barista_birth_date ||
                                  profileBasics[app.barista_email]?.birth_date
                              ) && (
                                <span className="text-sm text-gray-500">
                                  {calculateAge(
                                    app.barista_birth_date ||
                                      profileBasics[app.barista_email]
                                        ?.birth_date
                                  )}
                                  세
                                </span>
                              )}
                              {getStatusBadge(app.status)}
                            </div>

                            {app.barista_address && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">
                                  {app.barista_address}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {(app.barista_skills || []).slice(0, 3).map(
                                (skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs !bg-[#1FBECC]/10 !text-[#1FBECC]"
                                  >
                                    {skill}
                                  </Badge>
                                )
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {app.barista_career && (
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                  {app.barista_career}
                                </p>
                              )}
                              {app.has_documents && (
                                <Badge className="!bg-blue-100 !text-blue-700 text-xs">
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  서류완료
                                </Badge>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
