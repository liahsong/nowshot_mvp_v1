import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import GNB from "./components/GNB";

export default function Layout() {
  const { user, role, onboardingCompleted, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        로딩 중…
      </div>
    );
  }

  // 1️⃣ 로그인 안 됨
  if (!user) return <Navigate to="/login" replace />;

  // 2️⃣ 역할 미선택 (pending / null)
  if (!role || role === "pending") {
    return <Navigate to="/role" replace />;
  }

  // 3️⃣ 역할은 있으나 온보딩 미완료
  if (!onboardingCompleted) {
    return <Navigate to={`/onboarding/${role}`} replace />;
  }

  // 4️⃣ 정상 유저
  return (
    <div className="min-h-screen flex flex-col">
      <GNB />
      <Outlet />
    </div>
  );
}
