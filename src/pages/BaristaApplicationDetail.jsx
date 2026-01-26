import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { getSignedUrl } from "../lib/storage";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, MapPin } from "lucide-react";
import SplitLayout from "../components/SplitLayout";

export default function BaristaApplicationDetail() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const { data: appRow, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", id)
        .single();
      if (appError) {
        setError(appError.message || "지원서를 불러오지 못했습니다.");
        setApplication(null);
      } else {
        setApplication(appRow || null);
      }

      if (appRow?.barista_photo) {
        const rawPath = String(appRow.barista_photo);
        const signedUrl = await getSignedUrl({
          bucket: "barista_profile",
          path: rawPath,
          expiresIn: 3600,
        });
        setProfilePhotoUrl(signedUrl || rawPath);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  if (!application) {
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
          <div className="min-h-screen bg-white flex items-center justify-center">
            {error || "지원서를 찾을 수 없습니다."}
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
            alt="Barista Visual"
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
                <h1 className="font-semibold text-gray-900">지원서 보기</h1>
                <p className="text-xs text-gray-500">
                  {application.barista_name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-semibold">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
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
              </div>
            </div>

            {application.barista_career && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  경력 요약
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {application.barista_career}
                </p>
              </div>
            )}

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
                지원 메시지
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
