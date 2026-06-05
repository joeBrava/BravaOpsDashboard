import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHubSpotClient } from "./hubspot";

/**
 * These tests MOCK global fetch — no real HubSpot calls are ever made.
 * They assert: request URL, Authorization/Content-Type headers, pagination
 * cursor handling (paging.next.after), and 429 Retry-After honoring.
 */

function jsonResponse(body: unknown, init: Partial<{ status: number; headers: Record<string, string> }> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("HubSpotClient", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("getDeal hits api.hubapi.com with Bearer auth and properties query", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: "42", properties: { dealname: "Acme" } }),
    );
    const client = createHubSpotClient("hs-token");

    const deal = await client.getDeal("42", ["dealname", "amount"]);

    expect(deal).toEqual({ id: "42", properties: { dealname: "Acme" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.hubapi.com/crm/v3/objects/deals/42?properties=dealname%2Camount",
    );
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer hs-token");
    expect(headers["Content-Type"]).toBe("application/json");
    expect((init as RequestInit).method ?? "GET").toBe("GET");
  });

  it("getDeal omits the properties query when none requested", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "7", properties: {} }));
    const client = createHubSpotClient("hs-token");

    await client.getDeal("7");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.hubapi.com/crm/v3/objects/deals/7",
    );
  });

  it("listDeals follows the paging.next.after cursor across pages", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ id: "1", properties: {} }],
          paging: { next: { after: "CURSOR_2" } },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          results: [{ id: "2", properties: {} }],
          // no paging.next => last page
        }),
      );
    const client = createHubSpotClient("hs-token");

    const deals = await client.listDeals({ properties: ["dealname"], limit: 1 });

    expect(deals.map((d) => d.id)).toEqual(["1", "2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(firstUrl.pathname).toBe("/crm/v3/objects/deals");
    expect(firstUrl.searchParams.get("limit")).toBe("1");
    expect(firstUrl.searchParams.get("properties")).toBe("dealname");
    expect(firstUrl.searchParams.has("after")).toBe(false);

    const secondUrl = new URL(fetchMock.mock.calls[1][0] as string);
    expect(secondUrl.searchParams.get("after")).toBe("CURSOR_2");
  });

  it("getAssociatedCompanyId / getAssociatedContactId return the first association id", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "C1", type: "deal_to_company" }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "P1", type: "deal_to_contact" }] }),
      );
    const client = createHubSpotClient("hs-token");

    expect(await client.getAssociatedCompanyId("42")).toBe("C1");
    expect(await client.getAssociatedContactId("42")).toBe("P1");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.hubapi.com/crm/v3/objects/deals/42/associations/companies",
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.hubapi.com/crm/v3/objects/deals/42/associations/contacts",
    );
  });

  it("getAssociatedCompanyId returns undefined when there are no associations", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));
    const client = createHubSpotClient("hs-token");
    expect(await client.getAssociatedCompanyId("42")).toBeUndefined();
  });

  it("honors a 429 Retry-After header by waiting then retrying", async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({}, { status: 429, headers: { "Retry-After": "2" } }),
        )
        .mockResolvedValueOnce(jsonResponse({ id: "42", properties: {} }));
      const client = createHubSpotClient("hs-token");

      const promise = client.getDeal("42");
      // Let the first fetch resolve and the retry timer be scheduled.
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance past the 2s Retry-After window; the retry should now fire.
      await vi.advanceTimersByTimeAsync(2000);
      const deal = await promise;

      expect(deal).toEqual({ id: "42", properties: {} });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws after exhausting 429 retries", async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockResolvedValue(
        jsonResponse({}, { status: 429, headers: { "Retry-After": "0" } }),
      );
      const client = createHubSpotClient("hs-token");

      const promise = client.getDeal("42");
      const assertion = expect(promise).rejects.toThrow(/429/);
      await vi.runAllTimersAsync();
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws on a non-ok, non-429 response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("nope", { status: 500 }),
    );
    const client = createHubSpotClient("hs-token");
    await expect(client.getDeal("42")).rejects.toThrow(/500/);
  });
});
