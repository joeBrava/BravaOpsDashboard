import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/sidebar";
import type { SessionUser } from "@/lib/session-user";

// usePathname drives active-state + drawer-close-on-route-change. Outside an App
// Router provider it would throw, so stub next/navigation to a stable path.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const user: SessionUser = {
  name: "Joe Brava",
  email: "joe@buildbrava.com",
  initials: "JB",
  role: "Founder",
};

describe("Sidebar (responsive)", () => {
  it("renders the desktop rail hidden by default and shown at lg+", () => {
    const { container } = render(<Sidebar user={user} />);
    // The static rail is the <aside> that is NOT the drawer dialog.
    const rails = container.querySelectorAll("aside");
    const desktopRail = Array.from(rails).find(
      (el) => el.getAttribute("role") !== "dialog",
    );
    expect(desktopRail).toBeDefined();
    // Responsive utility classes present in the rendered markup: hidden below
    // lg, flex at lg and up, fixed 212px width (desktop unchanged).
    expect(desktopRail!.className).toContain("hidden");
    expect(desktopRail!.className).toContain("lg:flex");
    expect(desktopRail!.className).toContain("w-[212px]");
  });

  it("renders a mobile top bar that is hidden at lg+", () => {
    const { container } = render(<Sidebar user={user} />);
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header!.className).toContain("fixed");
    expect(header!.className).toContain("lg:hidden");
  });

  it("exposes an accessible hamburger toggle that is collapsed by default", () => {
    render(<Sidebar user={user} />);
    const toggle = screen.getByRole("button", {
      name: /open navigation menu/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // The drawer is not in the DOM until opened.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the off-canvas drawer when the toggle is clicked", () => {
    render(<Sidebar user={user} />);
    fireEvent.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );

    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    // Same nav body inside the drawer (Pipeline link reachable).
    expect(
      within(drawer).getByRole("link", { name: /pipeline/i }),
    ).toBeInTheDocument();
    // The drawer is gated to mobile only.
    const overlay = drawer.parentElement;
    expect(overlay?.className).toContain("lg:hidden");
  });

  it("closes the drawer when a nav link inside it is tapped", () => {
    render(<Sidebar user={user} />);
    fireEvent.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );
    const drawer = screen.getByRole("dialog");
    fireEvent.click(within(drawer).getByRole("link", { name: /pipeline/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes the drawer on the backdrop tap and on Escape", () => {
    render(<Sidebar user={user} />);
    // Backdrop close.
    fireEvent.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /close navigation overlay/i }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    // Escape close.
    fireEvent.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
