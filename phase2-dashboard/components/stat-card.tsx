interface StatCardProps {
  value: string;
  label: string;
  /** Tailwind classes for the icon tile, e.g. "bg-[#efe7fb] text-purple" */
  iconClass: string;
  icon: string;
}

export function StatCard({ value, label, iconClass, icon }: StatCardProps) {
  return (
    <div className="flex items-center gap-[13px] rounded-[15px] border border-[#eee8df] bg-white px-4 py-[15px]">
      <div
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-[11px] text-[1.1rem] ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <div className="font-display text-[1.4rem] font-extrabold leading-none text-ink">
          {value}
        </div>
        <div className="mt-1 text-[0.7rem] uppercase tracking-[0.04em] text-gray-mid">
          {label}
        </div>
      </div>
    </div>
  );
}
