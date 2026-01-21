// src/pages/auth/Login.jsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate("/",{replace: true});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        alert("이메일 인증 후 로그인할 수 있어요. 메일함을 확인해주세요.");
      } else {
        alert(error.message);
      }
      return;
    }

    navigate("/auth/callback");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA] px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-6">NOWSHOT 로그인</h1>

        <input
          type="email"
          placeholder="이메일"
          className="w-full border rounded-xl px-4 py-3 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="비밀번호"
          className="w-full border rounded-xl px-4 py-3 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#39C6CC] text-white py-3 rounded-xl"
        >
          로그인
        </button>

        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <button onClick={() => navigate("/signup")}>회원가입</button>
          <button onClick={() => navigate("/auth/reset-password")}>
            비밀번호 찾기
          </button>
        </div>
      </div>
    </div>
  );
}
