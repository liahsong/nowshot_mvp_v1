import { ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

export default function RoleSelect() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const { user, role, onboardingCompleted, loading: authLoading, refetchProfile } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    if (role && role !== "pending" && role !== "member") {
      if (onboardingCompleted) {
        navigate(`/${role}`, { replace: true });
      } else {
        navigate(`/onboarding/${role}`, { replace: true });
      }
    }
  }, [authLoading, user, role, onboardingCompleted, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  if (user && role && role !== "pending" && role !== "member") {
    return (
      <Navigate
        to={onboardingCompleted ? `/${role}` : `/onboarding/${role}`}
        replace
      />
    );
  }

  const withTimeout = (promise, ms) =>
    new Promise((resolve, reject) => {
      const timeoutId = setTimeout(
        () => reject(new Error("요청 시간이 초과되었습니다.")),
        ms
      );
      promise
        .then((value) => resolve(value))
        .catch((err) => reject(err))
        .finally(() => clearTimeout(timeoutId));
    });

  const selectRole = async (role) => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await withTimeout(supabase.auth.getUser(), 8000);

      if (!user) {
        navigate("/login");
        return;
      }

      const { error: updateError } = await withTimeout(
        supabase.from("profiles").update({ role }).eq("id", user.id),
        8000
      );
      if (updateError) throw updateError;

      // AuthContext의 프로필 정보 갱신 (실패해도 진행)
      try {
        await refetchProfile();
      } catch (err) {
        console.warn("Profile refresh failed:", err);
      }

      navigate(role === "owner" ? "/onboarding/owner" : "/onboarding/barista");
    } catch (err) {
      setError(err.message || "역할 설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 🔑 base44 기준 중앙 컨테이너 */}
      <div className="mx-auto max-w-5xl px-6 min-h-screen flex flex-col">
        {/* ===== HERO ===== */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <img
            src="/images/main_illust.png"
            alt="hero"
            className="w-[360px] mb-10"
          />

          <img
            src="/images/main_logo.png"
            alt="NowShot"
            className="h-10 object-contain mx-auto mb-3"
          />

          <p className="mt-4 text-m text-gray-500">
            카페에서 일하는 사람들을 위한 구인구직 플랫폼
          </p>
        </div>

        {/* ===== ROLE CARD ===== */}
        <div className="pb-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OWNER */}
            <button
              onClick={() => selectRole("owner")}
              disabled={loading}
              className="base-card p-6 flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-[#f9e593] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/owner_icon.png"
                  alt="owner"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">사장님</div>
                <div className="text-sm text-gray-500 mt-1">
                  카페 운영자로 시작하기
                </div>
              </div>
              <ArrowRight className="text-gray-400 flex-shrink-0" />
            </button>

            {/* BARISTA */}
            <button
              onClick={() => selectRole("barista")}
              disabled={loading}
              className="base-card p-6 flex items-center gap-4 text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-[#e3613a] flex items-center justify-center flex-shrink-0">
                <img
                  src="/images/barista_icon.png"
                  alt="barista"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">바리스타</div>
                <div className="text-sm text-gray-500 mt-1">
                  바리스타로 시작하기
                </div>
              </div>
              <ArrowRight className="text-gray-400 flex-shrink-0" />
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            계속 진행하면 서비스 이용약관에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
