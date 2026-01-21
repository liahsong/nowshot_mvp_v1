// src/pages/auth/ResetPassword.jsx
import { useState } from "react";
import { getSupabase } from "../../lib/supabase";

export default function ResetPassword() {
  const supabase = getSupabase();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
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
        <h1 className="text-xl font-bold text-center mb-6">
          비밀번호 재설정
        </h1>

        {sent ? (
          <p className="text-center text-sm text-green-600">
            📩 재설정 링크를 이메일로 보냈어요!
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="이메일"
              className="w-full border rounded-xl px-4 py-3 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={sendResetLink}
              className="w-full bg-[#39C6CC] text-white py-3 rounded-xl"
            >
              링크 보내기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
