const DEFAULT_FILTERS = ["All", "Ready", "Blocked"] as const;

export function FilterChips({
  filters = DEFAULT_FILTERS,
}: {
  filters?: readonly string[];
}) {
  return (
    <div className="flex gap-[7px]">
      {filters.map((f, i) => (
        <span
          key={f}
          className={`rounded-full px-3 py-[5px] font-display text-[0.74rem] font-semibold ${
            i === 0
              ? "border border-purple bg-purple text-white"
              : "border border-[#ebe6dd] bg-white text-gray-dark"
          }`}
        >
          {f}
        </span>
      ))}
    </div>
  );
}
