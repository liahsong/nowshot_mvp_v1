import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { getSignedUrl } from "../lib/storage";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import SplitLayout from "../components/SplitLayout";

export default function ApplicationDetail() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [post, setPost] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [applicationPhotoUrl, setApplicationPhotoUrl] = useState("");
  const [profileBasics, setProfileBasics] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const normalizeProfilePath = (value, userId) => {
        if (!value || typeof value !== "string") return "";
        if (value.includes("/")) return value;
        if (!userId) return value;
        return `${userId}/profile/${value}`;
      };

      const resolvePhotoUrl = async (
        rawUrl,
        defaultBucket = "barista_profile"
      ) => {
        if (!rawUrl || typeof rawUrl !== "string") return "";
        const match = rawUrl.match(
          /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/
        );
        let bucket = defaultBucket;
        let path = rawUrl;
        if (match) {
          bucket = match[1];
          path = match[2];
        } else if (rawUrl.startsWith("http")) {
          return rawUrl;
        }

        const normalized = path.replace(/^\/+/, "");
        const candidates = [
          normalized,
          normalized.replace(/^barista_profile\//, ""),
          `profile/${normalized.replace(/^profile\//, "")}`,
        ];

        for (const candidate of candidates) {
          const signedUrl = await getSignedUrl({
            bucket,
            path: candidate,
            expiresIn: 3600,
          });
          if (signedUrl) return signedUrl;
        }

        return rawUrl;
      };

      const { data: appRow } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();

      setApplication(appRow || null);

      if (appRow?.barista_email) {
        const { data: profileRow } = await supabase
          .from("barista_profiles")
          .select("user_id, user_email, profile_photo, birth_date, phone")
          .eq("user_email", appRow.barista_email)
          .maybeSingle();
        if (profileRow) {
          setProfileBasics({
            birth_date: profileRow.birth_date,
            phone: profileRow.phone,
          });
          const normalizedProfile = normalizeProfilePath(
            profileRow.profile_photo,
            profileRow.user_id
          );
          setProfilePhotoUrl(
            await resolvePhotoUrl(normalizedProfile, "barista_profile")
          );
          if (appRow?.barista_photo) {
            const normalizedApp = normalizeProfilePath(
              appRow.barista_photo,
              profileRow.user_id
            );
            setApplicationPhotoUrl(
              await resolvePhotoUrl(normalizedApp, "barista_profile")
            );
          }
        }
      }

      if (appRow?.job_post_id) {
        const { data: postRow } = await supabase
          .from("job_posts")
          .select("id, cafe_name")
          .eq("id", appRow.job_post_id)
          .single();
        setPost(postRow || null);
      }
    };

    fetchData();
  }, [id]);

  if (!application) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

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
                <h1 className="font-semibold text-gray-900">지원 상세</h1>
                <p className="text-xs text-gray-500">
                  {post?.cafe_name || "공고"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-semibold">
                {profilePhotoUrl ||
                applicationPhotoUrl ||
                application.barista_photo ? (
                  <img
                    src={
                      profilePhotoUrl ||
                      applicationPhotoUrl ||
                      application.barista_photo
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  application.barista_name?.[0] || "?"
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {application.barista_name || "이름 미상"}
                </h2>
                {application.barista_address && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{application.barista_address}</span>
                  </div>
                )}
                {application.barista_phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{application.barista_phone}</span>
                  </div>
                )}
                {!application.barista_phone && profileBasics.phone && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{profileBasics.phone}</span>
                  </div>
                )}
                {(application.barista_birth_date ||
                  profileBasics.birth_date) && (
                  <div className="text-sm text-gray-500 mt-1">
                    {calculateAge(
                      application.barista_birth_date ||
                        profileBasics.birth_date
                    )}세
                  </div>
                )}
              </div>
            </div>

            {application.barista_skills?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  보유 스킬
                </h3>
                <div className="flex flex-wrap gap-2">
                  {application.barista_skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="!bg-[#1FBECC]/10 !text-[#1FBECC]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                자기소개
              </h3>
              <Textarea
                value={application.cover_letter || ""}
                readOnly
                className="min-h-[160px]"
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
