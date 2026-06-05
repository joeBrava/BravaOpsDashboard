import { describe, it, expect } from "vitest";
import { isPublicPath, decideRouteAccess } from "./route-access";

describe("isPublicPath", () => {
  it("treats the sign-in page as public", () => {
    expect(isPublicPath("/signin")).toBe(true);
  });

  it("treats Auth.js endpoints as public", () => {
    expect(isPublicPath("/api/auth/signin")).toBe(true);
    expect(isPublicPath("/api/auth/callback/google")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
  });

  it("treats framework/static assets as public", () => {
    expect(isPublicPath("/_next/static/chunk.js")).toBe(true);
    expect(isPublicPath("/_next/image")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
  });

  it("treats app routes as protected", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/invoices")).toBe(false);
    expect(isPublicPath("/deals/abc")).toBe(false);
    expect(isPublicPath("/settings")).toBe(false);
  });
});

describe("decideRouteAccess", () => {
  it("passes everything through when auth is disabled (dev bypass)", () => {
    expect(
      decideRouteAccess({ pathname: "/", authDisabled: true, hasSession: false }),
    ).toEqual({ action: "allow" });
    expect(
      decideRouteAccess({
        pathname: "/invoices",
        authDisabled: true,
        hasSession: false,
      }),
    ).toEqual({ action: "allow" });
  });

  it("allows public paths even without a session", () => {
    expect(
      decideRouteAccess({
        pathname: "/signin",
        authDisabled: false,
        hasSession: false,
      }),
    ).toEqual({ action: "allow" });
    expect(
      decideRouteAccess({
        pathname: "/api/auth/callback/google",
        authDisabled: false,
        hasSession: false,
      }),
    ).toEqual({ action: "allow" });
  });

  it("allows a protected path when a session is present", () => {
    expect(
      decideRouteAccess({ pathname: "/", authDisabled: false, hasSession: true }),
    ).toEqual({ action: "allow" });
  });

  it("redirects an unauthenticated request for a protected path to /signin", () => {
    expect(
      decideRouteAccess({ pathname: "/", authDisabled: false, hasSession: false }),
    ).toEqual({ action: "redirect", to: "/signin" });
    expect(
      decideRouteAccess({
        pathname: "/invoices",
        authDisabled: false,
        hasSession: false,
      }),
    ).toEqual({ action: "redirect", to: "/signin" });
  });
});
