/**
 * Read-only HubSpot CRM v3 client.
 *
 * Ported from `~/BBProjects/bb-bridge/src/clients/hubspot.ts`, stripped to the
 * GET surface the dashboard needs. Deliberately NO write methods (`patchDeal`,
 * etc.) and NO webhook-signature verification — this is a read-only build.
 *
 * Auth: Bearer token on `api.hubapi.com`.
 * Rate limits: HubSpot returns 429 with a `Retry-After` (seconds); we honor it.
 */

const BASE = "https://api.hubapi.com";

/** Max number of 429 retries before giving up. */
const MAX_RETRIES = 3;
/** Fallback wait (ms) if a 429 arrives without a usable Retry-After header. */
const DEFAULT_RETRY_MS = 1000;

export interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
}

export interface HubSpotCompany {
  id: string;
  properties: Record<string, string | null>;
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, string | null>;
}

export interface ListDealsOptions {
  /** Deal properties to hydrate on each result. */
  properties?: string[];
  /** Page size (HubSpot max 100). */
  limit?: number;
}

export interface HubSpotClient {
  getDeal(dealId: string, properties?: string[]): Promise<HubSpotDeal>;
  /** Fetch every deal, transparently following the `paging.next.after` cursor. */
  listDeals(options?: ListDealsOptions): Promise<HubSpotDeal[]>;
  getAssociatedCompanyId(dealId: string): Promise<string | undefined>;
  getAssociatedContactId(dealId: string): Promise<string | undefined>;
  getCompany(companyId: string): Promise<HubSpotCompany>;
  getContact(contactId: string): Promise<HubSpotContact>;
}

/** Resolve a 429 wait (ms) from the Retry-After header, with a sane fallback. */
function retryAfterMs(res: Response): number {
  const header = res.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  return DEFAULT_RETRY_MS;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function createHubSpotClient(token: string): HubSpotClient {
  function authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async function call<T>(path: string): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`${BASE}${path}`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (res.status === 429 && attempt < MAX_RETRIES) {
        await sleep(retryAfterMs(res));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HubSpot GET ${path} → ${res.status}: ${text}`);
      }
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    }
  }

  interface AssociationsResponse {
    results: { id: string; type: string }[];
  }

  interface DealsPage {
    results: HubSpotDeal[];
    paging?: { next?: { after?: string } };
  }

  return {
    async getDeal(dealId, properties = []) {
      const params = new URLSearchParams();
      if (properties.length > 0) params.set("properties", properties.join(","));
      const qs = params.toString();
      return call<HubSpotDeal>(
        `/crm/v3/objects/deals/${dealId}${qs ? `?${qs}` : ""}`,
      );
    },

    async listDeals(options = {}) {
      const all: HubSpotDeal[] = [];
      let after: string | undefined;
      do {
        const params = new URLSearchParams();
        if (options.properties && options.properties.length > 0) {
          params.set("properties", options.properties.join(","));
        }
        if (options.limit !== undefined) {
          params.set("limit", String(options.limit));
        }
        if (after) params.set("after", after);
        const qs = params.toString();
        const page = await call<DealsPage>(
          `/crm/v3/objects/deals${qs ? `?${qs}` : ""}`,
        );
        all.push(...page.results);
        after = page.paging?.next?.after;
      } while (after);
      return all;
    },

    async getAssociatedCompanyId(dealId) {
      const data = await call<AssociationsResponse>(
        `/crm/v3/objects/deals/${dealId}/associations/companies`,
      );
      return data.results[0]?.id;
    },

    async getAssociatedContactId(dealId) {
      const data = await call<AssociationsResponse>(
        `/crm/v3/objects/deals/${dealId}/associations/contacts`,
      );
      return data.results[0]?.id;
    },

    async getCompany(companyId) {
      return call<HubSpotCompany>(
        `/crm/v3/objects/companies/${companyId}?properties=name,domain`,
      );
    },

    async getContact(contactId) {
      return call<HubSpotContact>(
        `/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email`,
      );
    },
  };
}
