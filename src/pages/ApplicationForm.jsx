import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Loader2, FileCheck } from "lucide-react";

export default function ApplicationForm() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [post, setPost] = useState(null);
  const [profile, setProfile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data: postRow } = await supabase
        .from("job_posts")
        .select("*")
        .eq("id", id)
        .single();
      setPost(postRow || null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileRow } = await supabase
        .from("barista_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileRow || null);
    };

    fetchData();
  }, [id]);

  const hasDocuments = useMemo(
    () => (profile?.career_documents || []).length > 0,
    [profile]
  );

  const handleSubmit = async () => {
    if (!post || !profile) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error("로그인이 필요합니다.");
      }

      const extractStoragePath = (value) => {
        if (!value || typeof value !== "string") return null;
        const match = value.match(
          /\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+?)(?:\?|$)/
        );
        if (match?.[1]) return match[1];
        return value;
      };

      const { error: insertError } = await supabase.from("applications").insert([
        {
          job_post_id: post.id,
          barista_email: user.email,
          barista_name: profile.name,
          barista_photo: extractStoragePath(profile.profile_photo),
          barista_birth_date: profile.birth_date,
          barista_phone: profile.phone,
          barista_address: profile.address,
          barista_skills: profile.excellent_skills,
          barista_career: profile.career_summary,
          has_documents: hasDocuments,
          cover_letter: coverLetter,
        },
      ]);

      if (insertError) throw insertError;

      toast({
        title: "지원 완료",
        description: "지원이 정상적으로 접수되었습니다.",
      });
      navigate(`/barista/baristadetail/${post.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "지원에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!post || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">지원 작성</h1>
            <p className="text-xs text-gray-500">{post.cafe_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500 mb-1">이름</div>
            <Input value={profile.name} disabled />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">연락처</div>
            <Input value={profile.phone} disabled />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">주소</div>
            <Input value={profile.address || ""} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-500">지원 메시지</div>
          <Textarea
            value={coverLetter}
            onChange={(event) => setCoverLetter(event.target.value)}
            placeholder="간단한 자기소개 또는 지원 메시지를 남겨주세요"
            className="min-h-[120px]"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 bg-[#1FBECC] hover:bg-[#1AABB8] text-white rounded-xl"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              지원 완료
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
