import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SplitLayout from "../components/SplitLayout";
import { getSupabase } from "../lib/supabase";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  FileCheck,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import ko from "date-fns/locale/ko";

const BENEFIT_LABELS = {
  meal: "식사 제공",
  break: "휴게시간 제공",
  insurance: "4대 보험",
  uniform: "근무복 지급",
};

export default function JobPostDetail() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [cafe, setCafe] = useState(null);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: postRow } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .single();

      setPost(postRow || null);

      if (postRow?.cafe_id) {
        const { data: cafeRow, error: cafeError } = await supabase
          .from("cafes")
          .select("*")
          .eq("id", postRow.cafe_id)
          .maybeSingle();
        if (!cafeError) {
          setCafe(cafeRow);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: applied } = await supabase
        .from("applications")
        .select("id")
        .eq("job_post_id", id)
        .eq("barista_email", user.email)
        .maybeSingle();

      setIsApplied(Boolean(applied));
    };

    fetchData();
  }, [id]);

  const workPeriodLabel = useMemo(() => {
    if (!post) return "";
    if (post.work_period_type === "long-term") return "중장기";
    if (post.work_period_type === "short-term") return "단기";
    return post.work_period_type || "기간 미정";
  }, [post]);

  const cafeName = cafe?.name || post?.cafe_name || "카페";
  const cafeAddress = cafe?.address || post?.cafe_address;
  const cafeImage = useMemo(() => {
    const photos = cafe?.photos;
    if (photos) {
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
    }

    const fallbackPhotos = post?.cafe_photos;
    if (Array.isArray(fallbackPhotos)) return fallbackPhotos[0] || null;
    if (typeof fallbackPhotos === "string") return fallbackPhotos;
    return null;
  }, [cafe, post]);

  const benefitLabel = (value) => BENEFIT_LABELS[value] || value;

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        로딩 중…
      </div>
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
                <h1 className="font-semibold text-gray-900">공고 상세</h1>
                <p className="text-xs text-gray-500">{cafeName}</p>
              </div>
            </div>
          </div>

          {cafeImage && (
            <div className="h-56 overflow-hidden">
              <img
                src={cafeImage}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {cafeName}
                </h2>
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
                  {post.work_period_type === "long-term"
                    ? `${post.monthly_salary?.toLocaleString()}원`
                    : `${post.hourly_wage?.toLocaleString()}원`}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-500 mb-1">근무 형태</div>
                <div className="text-lg font-semibold text-gray-900">
                  {post.work_type === "full-time" ? "풀타임" : "파트타임"}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {post.work_start_date && post.work_end_date
                    ? `${format(new Date(post.work_start_date), "M/d (E)", {
                        locale: ko,
                      })} ~ ${format(new Date(post.work_end_date), "M/d (E)", {
                        locale: ko,
                      })}`
                    : "일정 미정"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>
                  {post.start_time} - {post.end_time}
                </span>
              </div>
            </div>

            {post.job_description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">업무 소개</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {post.job_description}
                </p>
              </div>
            )}

            {post.required_skills?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">요구 스킬</h3>
                <div className="flex flex-wrap gap-2">
                  {post.required_skills.map((skill) => (
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

            {post.benefits?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  복지/제공 사항
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.benefits.map((benefit) => (
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

            {post.preferred_qualifications && (
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">우대사항</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {post.preferred_qualifications}
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

            <div className="pt-2">
              {isApplied ? (
                <div className="w-full h-12 rounded-xl bg-gray-200 text-gray-500 flex items-center justify-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  지원 완료
                </div>
              ) : (
                <Link
                  to={`/barista/apply/${post.id}`}
                  className="w-full h-12 rounded-xl bg-[#1FBECC] text-white flex items-center justify-center gap-2 hover:bg-[#1AABB8] transition"
                >
                  <FileCheck className="w-5 h-5" />
                  지원하기
                </Link>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
