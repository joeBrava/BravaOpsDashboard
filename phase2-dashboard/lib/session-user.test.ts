import { describe, it, expect } from "vitest";
import { currentUserFrom, initialsFor, stubUser } from "./session-user";

describe("initialsFor", () => {
  it("uses first+last initials of a multi-word name", () => {
    expect(initialsFor("Joe Zink", "joe@buildbrava.com")).toBe("JZ");
    expect(initialsFor("Mary Jane Watson", null)).toBe("MW");
  });

  it("uses the first two letters of a single-word name", () => {
    expect(initialsFor("Cher", null)).toBe("CH");
    expect(initialsFor("J", null)).toBe("J");
  });

  it("falls back to the email local-part when name is missing", () => {
    expect(initialsFor(null, "joe.zink@buildbrava.com")).toBe("JZ");
    expect(initialsFor("", "ada@buildbrava.com")).toBe("AD");
  });

  it("treats dots/underscores/hyphens as word separators", () => {
    expect(initialsFor(null, "first_last@buildbrava.com")).toBe("FL");
    expect(initialsFor("anne-marie", null)).toBe("AM");
  });

  it("always returns uppercase, at most two characters", () => {
    const out = initialsFor("alice bob carol", null);
    expect(out).toBe("AC");
    expect(out).toBe(out.toUpperCase());
    expect(out.length).toBeLessThanOrEqual(2);
  });

  it("returns '?' when nothing is usable", () => {
    expect(initialsFor(null, null)).toBe("?");
    expect(initialsFor("   ", "")).toBe("?");
  });
});

describe("currentUserFrom", () => {
  it("derives name/email/initials from a full session", () => {
    expect(
      currentUserFrom({
        user: { name: "Joe Zink", email: "joe@buildbrava.com", image: null },
      }),
    ).toEqual({
      name: "Joe Zink",
      email: "joe@buildbrava.com",
      initials: "JZ",
      role: "Sales",
    });
  });

  it("falls back to the email local-part when name is absent", () => {
    expect(
      currentUserFrom({ user: { email: "ada@buildbrava.com" } }),
    ).toEqual({
      name: "ada",
      email: "ada@buildbrava.com",
      initials: "AD",
      role: "Sales",
    });
  });

  it("returns null when there is no authenticated user", () => {
    expect(currentUserFrom(null)).toBeNull();
    expect(currentUserFrom(undefined)).toBeNull();
    expect(currentUserFrom({})).toBeNull();
    expect(currentUserFrom({ user: null })).toBeNull();
    expect(currentUserFrom({ user: { name: null, email: null } })).toBeNull();
  });
});

describe("stubUser", () => {
  it("is a buildbrava.com user clearly labeled as the auth-off mode", () => {
    const u = stubUser();
    expect(u.email).toMatch(/@buildbrava\.com$/);
    expect(u.initials).toBe("DU");
    expect(u.role.toLowerCase()).toContain("auth off");
  });
});
