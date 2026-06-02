interface TopbarProps {
  title: string;
  sub: string;
}

export function Topbar({ title, sub }: TopbarProps) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <div className="mt-[3px] text-[0.84rem] text-gray-mid">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-[220px] rounded-[11px] border border-[#ebe6dd] bg-white px-[15px] py-[9px] text-[0.82rem] text-gray-mid">
          Search deals…
        </span>
        <span className="rounded-full bg-purple px-[14px] py-[9px] font-display text-[0.74rem] font-semibold text-white">
          ＋ New
        </span>
      </div>
    </div>
  );
}
