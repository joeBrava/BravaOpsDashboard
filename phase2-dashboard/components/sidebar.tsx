"use client";

import { useEffect, useState } from "react";
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
const team: NavItem[] = [{ label: "Team view" }, { label: "Settings", href: "/settings" }];

/** Drop a trailing slash so `/invoices` and `/invoices/` compare equal (trailingSlash export). */
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

function Item({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
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
    <Link href={item.href} className={className} onClick={onNavigate}>
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

/**
 * The shared nav body (brand lockup + sections + profile slot). Rendered both in
 * the static desktop rail and inside the mobile off-canvas drawer so the two can
 * never drift. `onNavigate` lets the mobile drawer close itself when a link is
 * tapped.
 */
function NavBody({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user?: SessionUser | null;
  onNavigate?: () => void;
}) {
  return (
    <>
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
          onNavigate={onNavigate}
        />
      ))}

      <Section label="Team" />
      {team.map((i) => (
        <Item
          key={i.label}
          item={i}
          active={i.href != null && normalizePath(i.href) === pathname}
          onNavigate={onNavigate}
        />
      ))}

      <ProfileSlot user={user} />
    </>
  );
}

/**
 * App navigation.
 *
 * Desktop (>= lg) renders the unchanged static purple rail: a `flex-none`
 * 212px-wide column that participates in the page's flex row exactly as before.
 *
 * Below lg the static rail is hidden and replaced by a fixed top bar with a
 * hamburger toggle that opens an off-canvas drawer (same nav body). The drawer
 * closes when a nav link is tapped, on Escape, and on backdrop tap. All
 * breakpoints share one `NavBody` so the menu can never drift between layouts.
 * This stays a `'use client'` component because the drawer is interactive state.
 */
export function Sidebar({ user }: { user?: SessionUser | null }) {
  const pathname = normalizePath(usePathname());
  // An explicit `user` prop wins (handy for tests/storybook); otherwise fall
  // back to the user the root layout resolved on the server and shared via
  // context.
  const contextUser = useCurrentUser();
  const effectiveUser = user !== undefined ? user : contextUser;

  const [open, setOpen] = useState(false);

  // The drawer closes when a nav link inside it is tapped (each Item calls
  // `onNavigate`), so it never lingers after an in-app navigation. While open,
  // the page behind is covered by the backdrop, so drawer links are the only
  // reachable in-app navigation.

  // Close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop rail — unchanged from the original layout, just gated to lg+. */}
      <aside className="hidden w-[212px] flex-none flex-col bg-gradient-to-b from-purple-deep to-[#52218c] px-4 py-[22px] text-white lg:flex">
        <NavBody pathname={pathname} user={effectiveUser} />
      </aside>

      {/* Mobile top bar — fixed, full width, hidden at lg+. */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-[56px] items-center justify-between bg-gradient-to-r from-purple-deep to-[#52218c] px-4 text-white lg:hidden">
        <div className="flex items-center gap-[10px] font-display text-[1.02rem] font-extrabold">
          <BrandMark />
          Biz Bricks
        </div>
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-[4px] rounded-[9px] bg-white/15"
        >
          <span aria-hidden className="h-[2px] w-[18px] rounded bg-white" />
          <span aria-hidden className="h-[2px] w-[18px] rounded bg-white" />
          <span aria-hidden className="h-[2px] w-[18px] rounded bg-white" />
        </button>
      </header>

      {/* Mobile off-canvas drawer + backdrop. Rendered only when open so closed
          state never traps focus or intercepts taps. */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink/45"
          />
          <aside
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute left-0 top-0 flex h-full w-[256px] max-w-[80%] flex-col bg-gradient-to-b from-purple-deep to-[#52218c] px-4 py-[18px] text-white shadow-2xl"
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/15 text-lg leading-none text-white"
              >
                ✕
              </button>
            </div>
            <NavBody
              pathname={pathname}
              user={effectiveUser}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
