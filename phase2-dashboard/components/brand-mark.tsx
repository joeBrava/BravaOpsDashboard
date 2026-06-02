/** The white rounded "brick" logo mark (stud dots over a square). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-block h-7 w-7 flex-none rounded-lg bg-white ${className}`}
    >
      <span className="absolute left-[7px] top-[7px] h-[9px] w-[9px] rounded-[2px] bg-purple-deep" />
      <span className="absolute left-[16px] top-[16px] h-[9px] w-[9px] rounded-[2px] bg-purple-deep/55" />
    </span>
  );
}
