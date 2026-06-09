import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Each test re-imports the module fresh (vi.resetModules) so the module-level
// "warned once" flag in getDataSourceMode is isolated per case.
const ORIG = { ...process.env };

describe("getDataSourceMode", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIG };
    delete process.env.DATA_SOURCE;
    delete process.env.HUBSPOT_API_TOKEN;
    delete process.env.TEAMWORK_API_TOKEN;
  });
  afterEach(() => {
    process.env = { ...ORIG };
  });

  it("defaults to fixture with no env set", async () => {
    const { getDataSourceMode } = await import("./env");
    expect(getDataSourceMode()).toBe("fixture");
  });

  it("is live when DATA_SOURCE=live and both tokens are present", async () => {
    process.env.DATA_SOURCE = "live";
    process.env.HUBSPOT_API_TOKEN = "hs-token";
    process.env.TEAMWORK_API_TOKEN = "tw-token";
    const { getDataSourceMode } = await import("./env");
    expect(getDataSourceMode()).toBe("live");
  });

  it("falls back to fixture and warns once when live requested but tokens missing", async () => {
    process.env.DATA_SOURCE = "live";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getDataSourceMode } = await import("./env");
    expect(getDataSourceMode()).toBe("fixture");
    getDataSourceMode(); // second call must NOT warn again
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("treats empty-string tokens as absent", async () => {
    process.env.DATA_SOURCE = "live";
    process.env.HUBSPOT_API_TOKEN = "  ";
    process.env.TEAMWORK_API_TOKEN = "";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getDataSourceMode } = await import("./env");
    expect(getDataSourceMode()).toBe("fixture");
    warn.mockRestore();
  });
});

describe("isAuthDisabled", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIG };
    delete process.env.AUTH_DISABLED;
  });
  afterEach(() => {
    process.env = { ...ORIG };
  });

  it("is true only when AUTH_DISABLED=true", async () => {
    process.env.AUTH_DISABLED = "true";
    const { isAuthDisabled } = await import("./env");
    expect(isAuthDisabled()).toBe(true);
  });

  it("is false (fail-closed) when unset", async () => {
    const { isAuthDisabled } = await import("./env");
    expect(isAuthDisabled()).toBe(false);
  });
});
