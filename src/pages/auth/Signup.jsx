// src/pages/auth/Signup.jsx
import { useState } from "react";
import { getSupabase } from "../../lib/supabase";

export default function SignupPage() {
  const supabase = getSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const getPasswordError = (value) => {
    if (value.length < 6) {
      return "비밀번호는 최소 6자 이상이어야 합니다.";
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    if (!hasUpper || !hasLower || !hasNumber) {
      return "영문 대문자, 소문자, 숫자를 모두 포함해 주세요.";
    }
    return "";
  };

  const handleSignup = async () => {
    setError("");
    const passwordError = getPasswordError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("비밀번호가 보안 기준을 충족하지 않습니다.");
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
            {error && (
              <p className="mb-3 text-sm text-red-500">{error}</p>
            )}
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
            <p className="text-xs text-gray-400 mb-4">
              영문 대·소문자와 숫자를 포함해 6자 이상 입력해 주세요.
            </p>

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
