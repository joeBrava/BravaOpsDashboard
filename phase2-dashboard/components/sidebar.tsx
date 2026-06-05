"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./brand-mark";
import { useCurrentUser } from "./current-user-provider";
import type { SessionUser } from "@/lib/session-user";

interface NavItem {
  label: string;
  /** present => navigable */
  href?: string;
  badge?: string;
}

const workspace: NavItem[] = [
  { label: "Pipeline", href: "/" },
  { label: "All deals" },
  { label: "Invoices", href: "/invoices", badge: "2" },
];
const team: NavItem[] = [{ label: "Team view" }, { label: "Settings" }];

/** Drop a trailing slash so `/invoices` and `/invoices/` compare equal (trailingSlash export). */
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

function Item({ item, active }: { item: NavItem; active: boolean }) {
  const className = `mb-[3px] flex items-center gap-[11px] rounded-[10px] px-3 py-[10px] text-sm font-medium ${
    active ? "bg-white/15 font-semibold text-white" : "text-white/80"
  }`;
  const inner = (
    <>
      <span
        className={`h-[17px] w-[17px] flex-none rounded-[5px] ${
          active ? "bg-lime" : "bg-white/30"
        }`}
      />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-danger px-[7px] py-px text-[0.66rem] font-bold text-white">
          {item.badge}
        </span>
      )}
    </>
  );

  return item.href ? (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="mx-2 mb-2 mt-[6px] text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-white/45">
      {label}
    </div>
  );
}

/**
 * The signed-in user shown in the profile slot. When omitted (no session /
 * signed-out) the slot renders a neutral "Not signed in" placeholder rather
 * than hardcoded identity.
 */
function ProfileSlot({ user }: { user?: SessionUser | null }) {
  return (
    <div className="mt-auto flex items-center gap-[10px] border-t border-white/15 px-2 py-[10px]">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white font-display text-[0.76rem] font-bold text-purple-deep">
        {user?.initials ?? "—"}
      </span>
      <span className="min-w-0 text-sm leading-tight">
        {user ? (
          <>
            <span className="block truncate">{user.name}</span>
            <small className="text-[0.7rem] text-white/55">{user.role}</small>
          </>
        ) : (
          <>
            Not signed in
            <br />
            <small className="text-[0.7rem] text-white/55">—</small>
          </>
        )}
      </span>
    </div>
  );
}

export function Sidebar({ user }: { user?: SessionUser | null }) {
  const pathname = normalizePath(usePathname());
  // An explicit `user` prop wins (handy for tests/storybook); otherwise fall
  // back to the user the root layout resolved on the server and shared via
  // context.
  const contextUser = useCurrentUser();
  const effectiveUser = user !== undefined ? user : contextUser;

  return (
    <aside className="flex w-[212px] flex-none flex-col bg-gradient-to-b from-purple-deep to-[#52218c] px-4 py-[22px] text-white">
      <div className="mb-[30px] flex items-center gap-[10px] pl-1 font-display text-[1.05rem] font-extrabold">
        <BrandMark />
        Biz Bricks
      </div>

      <Section label="Workspace" />
      {workspace.map((i) => (
        <Item
          key={i.label}
          item={i}
          active={i.href != null && normalizePath(i.href) === pathname}
        />
      ))}

      <Section label="Team" />
      {team.map((i) => (
        <Item key={i.label} item={i} active={false} />
      ))}

      <ProfileSlot user={effectiveUser} />
    </aside>
  );
}
