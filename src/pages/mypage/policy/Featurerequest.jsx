import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplitLayout from "../../../components/SplitLayout";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { getSupabase } from "../../../lib/supabase";
import { Lightbulb, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";

const CATEGORIES = [
  { label: "공고 기능", emoji: "📋" },
  { label: "지원 / 매칭", emoji: "🤝" },
  { label: "알림 / 메시지", emoji: "🔔" },
  { label: "프로필", emoji: "👤" },
  { label: "결제 / 정산", emoji: "💳" },
  { label: "기타", emoji: "💬" },
];

export default function FeatureRequest() {
  const supabase = getSupabase();
  const [category, setCategory] = useState(null);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const isValid = category && content.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isValid) return;
    setStatus("loading");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("feature_requests").insert({
      category,
      content: content.trim(),
      contact: contact.trim() || null,
      user_id: user?.id || null,
      user_email: user?.email || null,
    });

    setStatus(error ? "error" : "done");
  };

  return (
    <SplitLayout
      leftContent={
        <div className="p-12 flex flex-col items-center justify-center h-full gap-6">
          <img
            src="/images/main_illust.png"
            alt="Feature Request"
            className="w-full max-w-sm mx-auto"
          />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-[#1FBECC]">NOWSHOT</p>
            <p className="text-xs text-gray-400">
              여러분의 의견이 제품을 만듭니다
            </p>
          </div>
        </div>
      }
      rightContent={
        <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b border-gray-100 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1FBECC]/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-[#1FBECC]" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">
                  원하는 기능이 있으신가요?
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  나우샷 팀에게 필요하신 기능을 알려주세요.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <AnimatePresence mode="wait">
              {status === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-10 text-center shadow-sm"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1FBECC]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-[#1FBECC]" />
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg mb-1">
                    소중한 의견 감사해요 🙌
                  </h2>
                  <p className="text-sm text-gray-500">
                    나우샷 팀이 검토 후 반영하겠습니다.
                  </p>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setCategory(null);
                      setContent("");
                      setContact("");
                    }}
                    className="mt-6 text-xs text-[#1FBECC] hover:underline"
                  >
                    다른 의견 보내기
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* 카테고리 */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      카테고리 선택
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => setCategory(cat.label)}
                          className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-xs font-medium transition-all border ${
                            category === cat.label
                              ? "border-[#1FBECC] bg-[#1FBECC]/5 text-[#1FBECC]"
                              : "border-gray-100 bg-gray-50 text-gray-600 hover:border-[#1FBECC]/40"
                          }`}
                        >
                          <span className="text-lg">{cat.emoji}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 내용 */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-800 mb-3">
                      원하시는 기능을 알려주세요
                    </p>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="예) 공고 즐겨찾기 기능이 있으면 좋겠어요."
                      rows={5}
                      className="w-full resize-none rounded-xl bg-gray-50 border-0 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1FBECC]/30"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {content.length}자
                    </p>
                  </div>

                  {/* 연락처 (선택) */}
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      연락처{" "}
                      <span className="font-normal text-gray-400">(선택)</span>
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                      답변을 원하시면 이메일 또는 연락처를 남겨주세요.
                    </p>
                    <Input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="이메일 또는 연락처"
                      className="h-10 bg-gray-50 border-0 text-sm"
                    />
                  </div>

                  {/* 에러 */}
                  {status === "error" && (
                    <p className="text-xs text-red-500 text-center">
                      전송 중 오류가 발생했습니다. 다시 시도해 주세요.
                    </p>
                  )}

                  {/* 제출 */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!isValid || status === "loading"}
                    className="w-full h-12 rounded-xl bg-[#1FBECC] hover:bg-[#1FBECC]/90 text-white font-semibold text-sm disabled:opacity-40"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        의견 보내기
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center pb-4">
                    언제나 여러분의 의견을 듣고 싶어요 💙
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      }
    />
  );
}
