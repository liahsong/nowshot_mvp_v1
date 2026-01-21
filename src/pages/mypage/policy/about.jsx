import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GNB from "../../../components/GNB";
import SplitLayout from "../../../components/SplitLayout";

export default function AboutNowshot() {
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
                <h1 className="font-semibold text-gray-900">나우샷 소개</h1>
              </div>
            </div>
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">나우샷 소개</h2>
                <p className="text-sm text-gray-500 mt-2">
                  나우샷은 카페와 바리스타를 빠르게 연결하는 매칭 서비스입니다.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">우리의 목표</h3>
                <p className="text-sm text-gray-700">
                  매장에는 필요한 인력을, 바리스타에게는 좋은 기회를 제공하는
                  것을 목표로 합니다.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-lg font-semibold">서비스 특징</h3>
                <p className="text-sm text-gray-700">
                  빠른 공고 등록, 간편 지원, 투명한 지원 현황 확인을 제공합니다.
                </p>
              </section>
            </div>
          </div>
        }
      />
    </div>
  );
}
