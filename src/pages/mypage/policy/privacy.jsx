import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GNB from "../../../components/GNB";
import SplitLayout from "../../../components/SplitLayout";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <GNB />
      <SplitLayout
        leftContent={
          <div className="p-12">
            <img
              src="/images/main_illust.png"
              alt="Barista Visual"
              className="w-full max-w-md mx-auto"
            />
          </div>
        }
        rightContent={
          <div className="min-h-screen bg-white">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="font-semibold text-gray-900">개인정보 처리방침</h1>
              </div>
            </div>
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">개인정보 처리방침</h2>
                <p className="text-sm text-gray-500 mt-2">
                  나우샷의 개인정보 수집 및 이용에 관한 안내입니다.
                </p>
              </div>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold">1. 수집 항목</h3>
                <p className="text-sm text-gray-700">
                  이메일, 이름, 프로필 정보
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold">2. 이용 목적</h3>
                <p className="text-sm text-gray-700">
                  인력 매칭 서비스 제공 및 운영
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="text-lg font-semibold">3. 보관 및 파기</h3>
                <p className="text-sm text-gray-700">
                  서비스 목적 달성 시 안전하게 파기합니다.
                </p>
              </section>
            </div>
          </div>
        }
      />
    </div>
  );
}
