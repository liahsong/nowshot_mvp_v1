import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { format, addDays, isToday, isSameDay } from "date-fns";
import ko from "date-fns/locale/ko";

export default function DateFilter({
  selectedDate,
  onDateSelect,
  jobPosts = [],
}) {
  const scrollRef = useRef(null);
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const getJobCountForDate = (date) => {
    return jobPosts.filter((post) => {
      const postDate = post.work_start_date || post.work_date;
      return postDate && isSameDay(new Date(postDate), date);
    }).length;
  };

  useEffect(() => {
    if (!scrollRef.current || !selectedDate) return;
    const targetKey = format(selectedDate, "yyyy-MM-dd");
    const selectedEl = scrollRef.current.querySelector(
      `[data-date="${targetKey}"]`
    );
    if (!selectedEl) return;
    selectedEl.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selectedDate]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto -mx-4 px-4"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingTop: 8,
        paddingBottom: 8,
      }}
      onWheel={(event) => {
        if (!scrollRef.current) return;
        if (event.deltaY === 0) return;
        scrollRef.current.scrollLeft += event.deltaY;
      }}
    >
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="flex gap-2.5">
        {dates.map((date, index) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const jobCount = getJobCountForDate(date);

          return (
            <motion.button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              whileTap={{ scale: 0.92 }}
              data-date={format(date, "yyyy-MM-dd")}
              className={`flex-shrink-0 relative transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-br from-[#1FBECC] to-[#1AABB8] text-white shadow-lg shadow-[#1FBECC]/40 scale-105"
                  : isTodayDate
                  ? "bg-white text-[#1FBECC] ring-2 ring-[#1FBECC] shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:shadow-md hover:scale-105 hover:border-[#1FBECC]/50"
              } rounded-xl px-3.5 py-2 min-w-[56px]`}
            >
              <div className="flex flex-col items-center gap-0.5">
                {jobCount > 0 && (
                  <span
                    className={`text-[9px] font-bold mb-0.5 ${
                      isSelected ? "text-white/90" : "text-[#1FBECC]"
                    }`}
                  >
                    {jobCount}건
                  </span>
                )}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isSelected
                      ? "text-white/80"
                      : isTodayDate
                      ? "text-[#1FBECC]"
                      : "text-gray-500"
                  }`}
                >
                  {format(date, "EEE", { locale: ko })}
                </span>
                <span
                  className={`text-2xl font-bold leading-none ${
                    isSelected
                      ? "text-white"
                      : isTodayDate
                      ? "text-[#1FBECC]"
                      : "text-gray-900"
                  }`}
                >
                  {format(date, "d")}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
