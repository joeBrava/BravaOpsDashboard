import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTeamworkClient } from "./teamwork";

/**
 * These tests MOCK global fetch — no real Teamwork calls are ever made.
 * They assert: request URL (configured domain, v3 path, include=customfieldProjects),
 * HTTP Basic auth header (base64(token:)), pagination cursor handling
 * (meta.page.hasMore + page param), and 429 Retry-After honoring.
 */

const DOMAIN = "bravabrands.teamwork.com";
const TOKEN = "tw-token";
// Basic auth: base64 of "<token>:" (username = token, empty password).
const EXPECTED_AUTH = `Basic ${Buffer.from(`${TOKEN}:`).toString("base64")}`;

function jsonResponse(body: unknown, init: Partial<{ status: number; headers: Record<string, string> }> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("TeamworkClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getProject hits the v3 endpoint with Basic auth and include=customfieldProjects", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ project: { id: 99, name: "Salt Lake Temple" } }),
    );
    const client = createTeamworkClient(DOMAIN, TOKEN);

    const project = await client.getProject("99");

    expect(project).toEqual({ id: 99, name: "Salt Lake Temple" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.origin).toBe("https://bravabrands.teamwork.com");
    expect(parsed.pathname).toBe("/projects/api/v3/projects/99.json");
    expect(parsed.searchParams.get("include")).toBe("customfieldProjects");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe(EXPECTED_AUTH);
    expect((init as RequestInit).method ?? "GET").toBe("GET");
  });

  it("listProjects paginates via meta.page.hasMore + incrementing page param", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          projects: [{ id: 1, name: "A" }],
          meta: { page: { hasMore: true } },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          projects: [{ id: 2, name: "B" }],
          meta: { page: { hasMore: false } },
        }),
      );
    const client = createTeamworkClient(DOMAIN, TOKEN);

    const projects = await client.listProjects({ pageSize: 1 });

    expect(projects.map((p) => p.id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const first = new URL(fetchMock.mock.calls[0][0] as string);
    expect(first.pathname).toBe("/projects/api/v3/projects.json");
    expect(first.searchParams.get("include")).toBe("customfieldProjects");
    expect(first.searchParams.get("page")).toBe("1");
    expect(first.searchParams.get("pageSize")).toBe("1");

    const second = new URL(fetchMock.mock.calls[1][0] as string);
    expect(second.searchParams.get("page")).toBe("2");
  });

  it("honors a 429 Retry-After header by waiting then retrying", async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { status: 429, headers: { "Retry-After": "1" } }),
        )
        .mockResolvedValueOnce(jsonResponse({ project: { id: 5 } }));
      const client = createTeamworkClient(DOMAIN, TOKEN);

      const promise = client.getProject("5");
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      const project = await promise;

      expect(project).toEqual({ id: 5 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws on a non-ok, non-429 response", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 403 }));
    const client = createTeamworkClient(DOMAIN, TOKEN);
    await expect(client.getProject("5")).rejects.toThrow(/403/);
  });

  it("projectUrl builds an app deep-link on the configured domain", () => {
    const client = createTeamworkClient(DOMAIN, TOKEN);
    expect(client.projectUrl("99")).toBe(
      "https://bravabrands.teamwork.com/app/projects/99",
    );
  });
});
