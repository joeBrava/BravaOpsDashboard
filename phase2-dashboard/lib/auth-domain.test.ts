import { describe, it, expect } from "vitest";
import { ALLOWED_DOMAIN, isAllowedEmail, isAllowedGoogleSignIn } from "./auth-domain";

describe("isAllowedEmail", () => {
  it("accepts an address on the locked domain", () => {
    expect(isAllowedEmail("joe@buildbrava.com")).toBe(true);
  });

  it("accepts case-insensitively and trims surrounding whitespace", () => {
    expect(isAllowedEmail("  Joe@BuildBrava.COM  ")).toBe(true);
  });

  it("rejects a different domain", () => {
    expect(isAllowedEmail("joe@businessbricks.com")).toBe(false);
  });

  it("rejects a look-alike subdomain / suffix-impersonation attempt", () => {
    expect(isAllowedEmail("joe@evilbuildbrava.com")).toBe(false);
    expect(isAllowedEmail("joe@buildbrava.com.evil.com")).toBe(false);
    expect(isAllowedEmail("joe@sub.buildbrava.com")).toBe(false);
  });

  it("rejects an address that merely contains the domain as a local part", () => {
    expect(isAllowedEmail("buildbrava.com@evil.com")).toBe(false);
  });

  it("rejects empty, missing, or malformed values", () => {
    expect(isAllowedEmail("")).toBe(false);
    expect(isAllowedEmail(undefined)).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
    expect(isAllowedEmail("not-an-email")).toBe(false);
    expect(isAllowedEmail("@buildbrava.com")).toBe(false);
    expect(isAllowedEmail("two@@buildbrava.com")).toBe(false);
  });

  it("exposes the locked domain as a constant", () => {
    expect(ALLOWED_DOMAIN).toBe("buildbrava.com");
  });
});

describe("isAllowedGoogleSignIn", () => {
  it("accepts a verified Google account on the domain with a matching hd claim", () => {
    expect(
      isAllowedGoogleSignIn("joe@buildbrava.com", {
        hd: "buildbrava.com",
        email_verified: true,
      }),
    ).toBe(true);
  });

  it("accepts when profile is absent (email-domain check still passes)", () => {
    // The hd claim is a defense-in-depth signal, not the sole gate; if Google
    // omits it the verified email domain still governs.
    expect(isAllowedGoogleSignIn("joe@buildbrava.com", undefined)).toBe(true);
    expect(isAllowedGoogleSignIn("joe@buildbrava.com", {})).toBe(true);
  });

  it("rejects when the hd claim points at a different workspace", () => {
    expect(
      isAllowedGoogleSignIn("joe@buildbrava.com", { hd: "businessbricks.com" }),
    ).toBe(false);
  });

  it("rejects an unverified Google email even on the right domain", () => {
    expect(
      isAllowedGoogleSignIn("joe@buildbrava.com", {
        hd: "buildbrava.com",
        email_verified: false,
      }),
    ).toBe(false);
  });

  it("rejects an off-domain email regardless of profile", () => {
    expect(
      isAllowedGoogleSignIn("joe@evil.com", { hd: "buildbrava.com" }),
    ).toBe(false);
    expect(isAllowedGoogleSignIn("joe@evil.com", undefined)).toBe(false);
  });

  it("rejects empty / missing email", () => {
    expect(isAllowedGoogleSignIn(undefined, { hd: "buildbrava.com" })).toBe(false);
    expect(isAllowedGoogleSignIn(null, undefined)).toBe(false);
  });
});
