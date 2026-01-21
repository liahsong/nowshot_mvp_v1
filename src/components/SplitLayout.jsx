export default function SplitLayout({ leftContent, rightContent }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex">
          {/* 좌측: 고정(Sticky) 비주얼 영역 */}
          <div className="hidden lg:block w-1/2 sticky top-0 h-screen overflow-hidden">
            <div className="h-full flex items-center justify-center bg-gray-50">
              {leftContent || (
                <div className="text-center text-gray-400">
                  비주얼 영역
                </div>
              )}
            </div>
          </div>

          {/* 우측: 스크롤 가능한 앱형 콘텐츠 영역 */}
          <div className="w-full lg:w-1/2">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
}




