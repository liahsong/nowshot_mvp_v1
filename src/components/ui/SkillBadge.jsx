export default function SkillBadge({ skill, selected, onClick, size = "md" }) {
  const sizeClasses =
    size === "sm" ? "text-xs px-3 py-1" : "text-sm px-4 py-2";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border transition ${
        selected
          ? "bg-[#1FBECC] border-[#1FBECC] text-white"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
      } ${sizeClasses}`}
    >
      {skill}
    </button>
  );
}
