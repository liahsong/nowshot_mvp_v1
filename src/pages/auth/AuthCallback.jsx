import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../../lib/supabase";

export default function AuthCallback() {
  const supabase = getSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate("/login", { replace: true });
        return;
      }
      // 여기서는 분기하지 말고 홈으로만 보냄
      navigate("/", { replace: true });
    };
    run();
  }, [navigate]);

  return <div className="p-10">로그인 처리 중…</div>;
}
