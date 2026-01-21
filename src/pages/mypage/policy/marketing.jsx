import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GNB from "../../../components/GNB";
import SplitLayout from "../../../components/SplitLayout";

export default function MarketingPolicy() {
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
                <h1 className="font-semibold text-gray-900">
                  마케팅 수신 동의
                </h1>
              </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">마케팅 수신 동의</h2>
                <p className="text-sm text-gray-500 mt-2">
                  서비스 안내 및 혜택 제공을 위한 마케팅 정보 수신 동의 안내입니다.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">1. 수신 항목</h3>
                <p className="text-sm text-gray-700">
                  이메일, 문자, 앱 내 알림을 통해 이벤트/공지 정보를 제공합니다.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">2. 보관 및 철회</h3>
                <p className="text-sm text-gray-700">
                  동의는 언제든 철회할 수 있으며, 철회 시 즉시 중단됩니다.
                </p>
              </section>
            </div>
          </div>
        }
      />
    </div>
  );
}
