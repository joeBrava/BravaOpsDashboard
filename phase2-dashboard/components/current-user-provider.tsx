"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/session-user";

/**
 * Makes the signed-in user (resolved on the server in the root layout via
 * `getCurrentUser()`) available to client components like the sidebar.
 *
 * Auth's session lives server-side; the layout reads it once and hands the
 * already-sanitized `SessionUser` (name/email/initials/role only — no tokens)
 * down through context so the client sidebar can render the profile slot
 * without its own data fetch. `null` means signed-out / no session.
 */
const CurrentUserContext = createContext<SessionUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/** Read the current user inside a client component. */
export function useCurrentUser(): SessionUser | null {
  return useContext(CurrentUserContext);
}
