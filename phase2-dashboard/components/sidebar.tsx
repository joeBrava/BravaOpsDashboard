import { BrandMark } from "./brand-mark";

interface NavItem {
  label: string;
  active?: boolean;
  badge?: string;
}

const workspace: NavItem[] = [
  { label: "Pipeline", active: true },
  { label: "All deals" },
  { label: "Invoices", badge: "2" },
];
const team: NavItem[] = [{ label: "Team view" }, { label: "Settings" }];

function Item({ item }: { item: NavItem }) {
  return (
    <div
      className={`mb-[3px] flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-sm font-medium ${
        item.active ? "bg-white/15 font-semibold text-white" : "text-white/80"
      }`}
    >
      <span
        className={`h-[17px] w-[17px] flex-none rounded-[5px] ${
          item.active ? "bg-lime" : "bg-white/30"
        }`}
      />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-danger px-[7px] py-px text-[0.66rem] font-bold text-white">
          {item.badge}
        </span>
      )}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="mx-2 mb-2 mt-[6px] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-white/45">
      {label}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-[212px] flex-none flex-col bg-gradient-to-b from-purple-deep to-[#52218c] px-4 py-[22px] text-white">
      <div className="mb-[30px] flex items-center gap-[10px] pl-1 font-display text-[1.05rem] font-extrabold">
        <BrandMark />
        Biz Bricks
      </div>

      <Section label="Workspace" />
      {workspace.map((i) => (
        <Item key={i.label} item={i} />
      ))}

      <Section label="Team" />
      {team.map((i) => (
        <Item key={i.label} item={i} />
      ))}

      <div className="mt-auto flex items-center gap-[10px] border-t border-white/15 px-2 py-[10px]">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white font-display text-[0.76rem] font-bold text-purple-deep">
          JZ
        </span>
        <span className="text-sm leading-tight">
          Joe Zink
          <br />
          <small className="text-[0.7rem] text-white/55">Sales</small>
        </span>
      </div>
    </aside>
  );
}
