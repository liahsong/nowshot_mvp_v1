import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GNB from "../../../components/GNB";
import SplitLayout from "../../../components/SplitLayout";

export default function TermsPolicy() {
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
                <h1 className="font-semibold text-gray-900">서비스 이용약관</h1>
              </div>
            </div>
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">서비스 이용약관</h2>
                <p className="text-sm text-gray-500 mt-2">
                  나우샷 서비스 이용과 관련된 기본 약관입니다.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">1. 서비스 제공</h3>
                <p className="text-sm text-gray-700">
                  나우샷은 채용 공고 등록 및 지원을 위한 플랫폼을 제공합니다.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">2. 이용자의 의무</h3>
                <p className="text-sm text-gray-700">
                  이용자는 정확한 정보를 제공하고 서비스 운영을 방해하지
                  않아야 합니다.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">3. 책임의 제한</h3>
                <p className="text-sm text-gray-700">
                  나우샷은 플랫폼을 제공하며, 개별 계약의 당사자가 아닙니다.
                </p>
              </section>
            </div>
          </div>
        }
      />
    </div>
  );
}
