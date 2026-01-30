import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, FileText, MapPin, Star, User as UserIcon } from "lucide-react";
import SplitLayout from "../../components/SplitLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../components/ui/use-toast";
import { resolveProfileImageUrl } from "@/lib/profileImage";

const REVIEW_TAGS = [
  "친절해요",
  "책임감있어요",
  "시간약속을 잘 지켜요",
  "일처리가 빨라요",
  "꼼꼼해요",
  "적극적이에요",
  "센스있어요",
  "밝아요",
  "재고용의사",
];

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

export default function BaristaDetail() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [jobPost, setJobPost] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    comment: "",
    tags: [],
    rating: 5,
  });

  const reviewMode = searchParams.get("review") === "1";

  useEffect(() => {
    const fetchData = async () => {
      if (!applicationId) return;

      const { data: appRow, error: appError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", applicationId)
        .single();
      if (appError) {
        console.error(appError);
        return;
      }
      setApplication(appRow || null);

      if (appRow?.job_post_id) {
        const { data: postRow } = await supabase
          .from("job_posts")
          .select("*")
          .eq("id", appRow.job_post_id)
          .maybeSingle();
        setJobPost(postRow || null);
      }

      if (appRow?.barista_email) {
        const { data: reviewRows } = await supabase
          .from("reviews")
          .select("*")
          .eq("barista_email", appRow.barista_email);
        setReviews(reviewRows || []);

        const { data: profileRow } = await supabase
          .from("barista_profiles")
          .select("user_id, profile_photo")
          .eq("user_email", appRow.barista_email)
          .maybeSingle();
        if (profileRow?.profile_photo) {
          const imageUrl = resolveProfileImageUrl(
            supabase,
            profileRow.profile_photo
          );
          if (imageUrl) setProfilePhotoUrl(imageUrl);
        } else if (appRow?.barista_photo) {
          const imageUrl = resolveProfileImageUrl(
            supabase,
            appRow.barista_photo
          );
          if (imageUrl) setProfilePhotoUrl(imageUrl);
        }
      }
    };

    fetchData();
  }, [applicationId]);

  useEffect(() => {
    if (reviewMode && !hasReviewForThisJob) {
      setReviewDialog(true);
    } else if (reviewMode && hasReviewForThisJob) {
      setReviewDialog(false);
      toast({ title: "이미 리뷰를 작성했습니다." });
    }
  }, [reviewMode, hasReviewForThisJob]);

  const hasReviewForThisJob = useMemo(() => {
    if (!application?.job_post_id) return false;
    return reviews.some((review) => review.job_post_id === application.job_post_id);
  }, [reviews, application]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const toggleTag = (tag) => {
    const tags = reviewData.tags;
    if (tags.includes(tag)) {
      setReviewData({ ...reviewData, tags: tags.filter((t) => t !== tag) });
    } else if (tags.length < 3) {
      setReviewData({ ...reviewData, tags: [...tags, tag] });
    }
  };

  const handleCreateReview = async () => {
    if (!application || !jobPost || !user?.email) return;
    if (hasReviewForThisJob) {
      toast({ title: "이미 리뷰를 작성했습니다" });
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      job_post_id: application.job_post_id,
      owner_email: user.email,
      barista_email: application.barista_email,
      cafe_name: jobPost.cafe_name,
      comment: reviewData.comment,
      tags: reviewData.tags,
      rating: reviewData.rating,
    });
    if (error) {
      toast({ title: "리뷰 저장 실패", description: error.message });
      return;
    }

    await supabase
      .from("job_posts")
      .update({ review_written: true })
      .eq("id", application.job_post_id);

    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("*")
      .eq("barista_email", application.barista_email);
    setReviews(reviewRows || []);
    setReviewDialog(false);
    setReviewData({ comment: "", tags: [], rating: 5 });
    toast({ title: "리뷰가 작성되었습니다" });
  };

  if (!application) {
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500">로딩 중...</div>
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
            alt="Owner Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
        <>
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="font-semibold text-gray-900">바리스타 상세</h1>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm"
              >
                <div className="flex flex-col items-center text-center mb-6">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {application.barista_name}
                  </h2>
                  <p className="text-gray-500 text-lg">
                    {calculateAge(application.barista_birth_date)}세
                  </p>

                  {reviews.length > 0 && (
                    <div className="flex items-center gap-3 mt-4 text-gray-700">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold">{avgRating}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-600">리뷰 {reviews.length}개</span>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      주소
                    </p>
                    <p className="text-gray-900 text-base font-semibold">
                      {application.barista_address}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">스킬</p>
                    <div className="flex flex-wrap gap-2">
                      {application.barista_skills?.map((skill) => (
                        <Badge
                          key={skill}
                          className="rounded-full bg-[#1FBECC] text-white border-0 px-3 py-1 text-sm"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {application.barista_career && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">경력</p>
                      <p className="text-gray-900 text-base font-semibold">
                        {application.barista_career}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {jobPost && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-3xl p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">근무 정보</h3>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-sm text-gray-500">카페</p>
                      <p className="font-semibold text-gray-900">
                        {jobPost.cafe_name}
                      </p>
                    </div>
                    {jobPost.work_start_date && jobPost.work_end_date && (
                      <div>
                        <p className="text-sm text-gray-500">근무 기간</p>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(jobPost.work_start_date).toLocaleDateString(
                              "ko-KR"
                            )}{" "}
                            -{" "}
                            {new Date(jobPost.work_end_date).toLocaleDateString(
                              "ko-KR"
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {application.cover_letter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-3xl p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    지원 내용
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {application.cover_letter}
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">리뷰</h3>
                  {!hasReviewForThisJob && (
                    <Button
                      onClick={() => setReviewDialog(true)}
                      size="sm"
                      className="bg-[#1FBECC] hover:bg-[#1AABB8] h-8"
                    >
                      리뷰 작성
                    </Button>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    아직 작성된 리뷰가 없습니다
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.created_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString(
                                "ko-KR"
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {review.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs bg-white"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {review.comment}
                        </p>
                        {review.cafe_name && (
                          <p className="text-xs text-gray-500 mt-2">
                            {review.cafe_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
            <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
              <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle>리뷰 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <p className="text-sm font-medium mb-2">평점</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() =>
                            setReviewData({ ...reviewData, rating: star })
                          }
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= reviewData.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">
                      태그 선택 (최대 3개)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REVIEW_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            reviewData.tags.includes(tag)
                              ? "bg-[#1FBECC] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">한 줄 평가</p>
                    <Textarea
                      value={reviewData.comment}
                      onChange={(e) =>
                        setReviewData({
                          ...reviewData,
                          comment: e.target.value,
                        })
                      }
                      placeholder="함께 일한 경험을 공유해주세요 (최대 200자)"
                      maxLength={200}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button
                    onClick={handleCreateReview}
                    disabled={
                      !reviewData.comment || reviewData.tags.length === 0
                    }
                    className="w-full bg-[#1FBECC] hover:bg-[#1AABB8]"
                  >
                    작성 완료
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </>
      }
    />
  );
}
