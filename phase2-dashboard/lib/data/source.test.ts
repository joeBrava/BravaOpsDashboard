import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getSource } from "./source";
import { FixtureSource } from "./fixture-source";

/**
 * Selector tests for `getSource()`.
 *
 * The two load-bearing guarantees:
 *   1. Fixture mode returns `FixtureSource` and requires NO tokens — the default
 *      with a clean env.
 *   2. Live mode (DATA_SOURCE=live + both tokens) returns a source that
 *      delegates to `LiveSource`, loaded lazily.
 *
 * Lazy import is also asserted structurally below: `source.ts` must not import
 * `live-source` (and therefore the API clients) at module top level, so a
 * fixture-mode boot never pulls the client graph in.
 */

const TOKEN_ENV = [
  "DATA_SOURCE",
  "HUBSPOT_API_TOKEN",
  "TEAMWORK_API_TOKEN",
] as const;

describe("getSource", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of TOKEN_ENV) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of TOKEN_ENV) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.restoreAllMocks();
  });

  it("returns FixtureSource by default (no env, no tokens required)", () => {
    const source = getSource();
    expect(source).toBeInstanceOf(FixtureSource);
  });

  it("returns FixtureSource when DATA_SOURCE=live but tokens are absent", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.DATA_SOURCE = "live";
    const source = getSource();
    expect(source).toBeInstanceOf(FixtureSource);
  });

  it("never imports live-source (or the API clients) statically — lazy only", () => {
    // The fixture-mode-never-loads-clients guarantee is structural: source.ts
    // must reach LiveSource via a dynamic import(), not a top-level import.
    const path = fileURLToPath(new URL("./source.ts", import.meta.url));
    const src = readFileSync(path, "utf8");
    // No static `import ... from ".../live-source"`.
    expect(src).not.toMatch(/import\s+[^;]*from\s+["'][^"']*live-source["']/);
    // No static client imports either.
    expect(src).not.toMatch(/from\s+["'][^"']*clients\//);
    // But it DOES lazily import the live source.
    expect(src).toMatch(/import\(\s*["'][^"']*live-source["']\s*\)/);
  });

  it("returns a (non-Fixture) live source when DATA_SOURCE=live and tokens are present", () => {
    process.env.DATA_SOURCE = "live";
    process.env.HUBSPOT_API_TOKEN = "hs-token";
    process.env.TEAMWORK_API_TOKEN = "tw-token";
    const source = getSource();
    // The live branch must NOT be the fixture source...
    expect(source).not.toBeInstanceOf(FixtureSource);
    // ...and must satisfy the DashboardSource contract.
    expect(typeof source.getProjects).toBe("function");
    expect(typeof source.getInvoices).toBe("function");
    expect(typeof source.getProject).toBe("function");
  });
});
