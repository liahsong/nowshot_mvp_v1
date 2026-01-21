import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GNB from "../../../components/GNB";
import SplitLayout from "../../../components/SplitLayout";

export default function FaqPage() {
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
                <h1 className="font-semibold text-gray-900">자주묻는 질문</h1>
              </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">자주묻는 질문</h2>
                <p className="text-sm text-gray-500 mt-2">
                  나우샷 이용 중 자주 문의하시는 내용을 모았습니다.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="font-semibold text-gray-900">
                    Q. 지원 내역은 어디서 보나요?
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    마이페이지에서 내 지원 현황을 확인할 수 있습니다.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-semibold text-gray-900">
                    Q. 프로필은 어떻게 수정하나요?
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    마이페이지에서 프로필 수정 메뉴를 눌러 변경할 수 있습니다.
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-semibold text-gray-900">
                    Q. 개인정보는 어떻게 보호되나요?
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    개인정보처리방침에 따라 안전하게 관리됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
