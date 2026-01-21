// src/pages/Entry.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Entry() {
  const { loading, user, role, onboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 역할 미선택
  if (!role || role === "pending" || role === "member") {
    return <Navigate to="/role" replace />;
  }

  // 온보딩 미완료
  if (!onboardingCompleted) {
    return <Navigate to={`/onboarding/${role}`} replace />;
  }

  // 정상
  return <Navigate to={`/${role}`} replace />;
}
