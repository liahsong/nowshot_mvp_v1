// src/pages/auth/Signup.jsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFA] px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-6">회원가입</h1>

        {sent ? (
          <p className="text-center text-sm text-green-600">
            📩 이메일 인증 링크를 보냈어요!
          </p>
        ) : (
          <>
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
              onClick={handleSignup}
              className="w-full bg-[#39C6CC] text-white py-3 rounded-xl"
            >
              회원가입
            </button>
          </>
        )}
      </div>
    </div>
  );
}
