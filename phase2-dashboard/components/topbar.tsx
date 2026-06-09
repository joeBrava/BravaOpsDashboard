interface TopbarProps {
  title: string;
  sub: string;
}

export function Topbar({ title, sub }: TopbarProps) {
  return (
    <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <div className="mt-[3px] text-[0.84rem] text-gray-mid">{sub}</div>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <span className="flex-1 rounded-[11px] border border-[#ebe6dd] bg-white px-[15px] py-[9px] text-[0.82rem] text-gray-mid sm:w-[220px] sm:flex-none">
          Search deals…
        </span>
        <span className="flex-none whitespace-nowrap rounded-full bg-purple px-[14px] py-[9px] font-display text-[0.74rem] font-semibold text-white">
          ＋ New
        </span>
      </div>
    </div>
  );
}
