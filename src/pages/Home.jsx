import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../lib/supabase";

export default function Home() {
  const supabase = getSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    const route = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .single();

      // 1️⃣ role 없으면
      if (!profile?.role) {
        navigate("/role", { replace: true });
        return;
      }

      // 2️⃣ role는 있는데 온보딩 미완료
      if (!profile.onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }

      // 3️⃣ 완료된 사용자 → 역할별 홈
      if (profile.role === "owner") {
        navigate("/owner", { replace: true });
      } else if (profile.role === "barista") {
        navigate("/barista", { replace: true });
      }
    };

    route();
  }, [navigate]);

  return <div>이동 중...</div>;
}
