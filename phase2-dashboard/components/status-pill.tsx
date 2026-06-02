interface StatusPillProps {
  label: string;
  /** bg + text classes from getStatusMeta */
  pillClass: string;
  /** dot color class from getStatusMeta */
  dotClass: string;
}

export function StatusPill({ label, pillClass, dotClass }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-full px-[11px] py-1 font-display text-[0.72rem] font-semibold ${pillClass}`}
    >
      <span className={`h-[7px] w-[7px] rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
