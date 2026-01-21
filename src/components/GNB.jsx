import {
  FileText,
  HelpCircle,
  Info,
  LogIn,
  Menu,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function GNB() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!role || role === "pending") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <img
                  src="/images/main_logo.png"
                  alt="NOWSHOT"
                  className="h-8 object-contain"
                />
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:text-primary transition"
                  aria-label="메뉴 열기"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="p-2 text-gray-600 hover:text-primary transition"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="메뉴 닫기"
            />
            <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="메뉴 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate("/about");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Info className="w-5 h-5 text-gray-400" />
                  나우샷 소개
                </button>
                <button
                  onClick={() => {
                    navigate("/faq");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  자주묻는 질문
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/terms");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  서비스 이용약관
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/privacy");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="w-5 h-5 text-gray-400" />
                  개인정보처리방침
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/marketing");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  마케팅 수신 동의
                </button>
              </nav>
            </aside>
          </div>
        )}
      </>
    );
  }

  // Owner GNB
  if (role === "owner") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* 좌측: 로고 */}
              <button
                onClick={() => navigate("/owner")}
                className="flex items-center gap-2"
              >
                <img
                  src="/images/main_logo.png"
                  alt="NOWSHOT"
                  className="h-8 object-contain"
                />
              </button>

              {/* 중앙: 메뉴 (Desktop/Tablet) */}
              <nav className="hidden md:flex items-center gap-8">
                <button
                  onClick={() => navigate("/owner/jobs")}
                  className="text-gray-700 hover:text-primary font-medium transition"
                >
                  공고 관리
                </button>
                <button
                  onClick={() => navigate("/owner/applicants")}
                  className="text-gray-700 hover:text-primary font-medium transition"
                >
                  지원자 목록
                </button>
                <button
                  onClick={() => navigate("/owner/baristas")}
                  className="text-gray-700 hover:text-primary font-medium transition"
                >
                  바리스타 관리
                </button>
              </nav>

              {/* 우측: 오너 사이드바 */}
              <div className="flex items-center gap-4">
                {user ? (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:text-primary transition"
                    aria-label="사이드바 열기"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="p-2 text-gray-600 hover:text-primary transition"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="사이드바 닫기"
            />
            <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="사이드바 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate("/owner/mypage");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  마이페이지
                </button>
                <button
                  onClick={() => {
                    navigate("/owner/jobs");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  공고 관리
                </button>
                <button
                  onClick={() => {
                    navigate("/owner/applicants");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  지원자 목록
                </button>
                <button
                  onClick={() => {
                    navigate("/owner/baristas");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  바리스타 관리
                </button>
                <button
                  onClick={() => {
                    navigate("/about");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Info className="w-5 h-5 text-gray-400" />
                  나우샷 소개
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/terms");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  서비스 이용약관
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/privacy");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="w-5 h-5 text-gray-400" />
                  개인정보처리방침
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/marketing");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  마케팅 수신 동의
                </button>
              </nav>
            </aside>
          </div>
        )}
      </>
    );
  }

  // Barista GNB
  if (role === "barista") {
    return (
      <>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* 좌측: 로고 */}
              <button
                onClick={() => navigate("/barista")}
                className="flex items-center gap-2"
              >
                <img
                  src="/images/main_logo.png"
                  alt="NOWSHOT"
                  className="h-8 object-contain"
                />
              </button>

              {/* 중앙: 메뉴 (Desktop/Tablet) */}
              <nav className="hidden md:flex items-center gap-8">
                <button
                  onClick={() => navigate("/barista/short-term")}
                  className="text-gray-700 hover:text-primary font-medium transition"
                >
                  단기
                </button>
                <button
                  onClick={() => navigate("/barista/full-time")}
                  className="text-gray-700 hover:text-primary font-medium transition"
                >
                  풀타임
                </button>
              </nav>

              {/* 우측: 바리스타 사이드바 */}
              <div className="flex items-center gap-4">
                {user ? (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-gray-600 hover:text-primary transition"
                    aria-label="사이드바 열기"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/login")}
                    className="p-2 text-gray-600 hover:text-primary transition"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="사이드바 닫기"
            />
            <aside className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="사이드바 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate("/barista/baristamypage");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  마이페이지
                </button>
                <button
                  onClick={() => {
                    navigate("/about");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Info className="w-5 h-5 text-gray-400" />
                  나우샷 소개
                </button>
                <button
                  onClick={() => {
                    navigate("/faq");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                  자주묻는 질문
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/terms");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  서비스 이용약관
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/privacy");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="w-5 h-5 text-gray-400" />
                  개인정보처리방침
                </button>
                <button
                  onClick={() => {
                    navigate("/policy/marketing");
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5 text-gray-400" />
                  마케팅 수신 동의
                </button>
              </nav>
            </aside>
          </div>
        )}
      </>
    );
  }

  return null;
}
