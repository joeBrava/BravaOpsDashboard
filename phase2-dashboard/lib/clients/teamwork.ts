/**
 * Read-only Teamwork Projects API v3 client.
 *
 * Ported from `~/BBProjects/bb-bridge/src/clients/teamwork.ts`, stripped to the
 * GET surface the dashboard needs. Deliberately NO write methods
 * (`createProjectFromTemplate`, `setProjectCustomField`, `postProjectMessage`,
 * `findOrCreateCompany`) — this is a read-only build.
 *
 * Auth: HTTP Basic with the API key as username and an empty password —
 * i.e. `Authorization: Basic base64("<token>:")`.
 * Domain: the fully-qualified host (e.g. `bravabrands.teamwork.com`), matching
 * `env.teamworkDomain()`. Base URL = `https://<domain>`.
 * Projects are fetched with `include=customfieldProjects` so project-level
 * custom fields ride along.
 * Rate limits: Teamwork returns 429 with a `Retry-After` (seconds); we honor it.
 */

/** Max number of 429 retries before giving up. */
const MAX_RETRIES = 3;
/** Fallback wait (ms) if a 429 arrives without a usable Retry-After header. */
const DEFAULT_RETRY_MS = 1000;
/** Default page size for paginated list calls. */
const DEFAULT_PAGE_SIZE = 100;

/** A Teamwork project as returned by v3 (shape varies; kept permissive). */
export type TeamworkProject = Record<string, unknown> & {
  id: number | string;
};

export interface ListProjectsOptions {
  /** Page size (Teamwork v3 `pageSize`). */
  pageSize?: number;
}

export interface TeamworkClient {
  /** Fetch a single project (with custom fields included). */
  getProject(projectId: string): Promise<TeamworkProject>;
  /**
   * Fetch every project (with custom fields included), transparently following
   * the v3 `meta.page.hasMore` cursor by incrementing the `page` param.
   */
  listProjects(options?: ListProjectsOptions): Promise<TeamworkProject[]>;
  /** App deep-link for a project on the configured domain. */
  projectUrl(projectId: string): string;
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

export function createTeamworkClient(
  domain: string,
  token: string,
): TeamworkClient {
  const BASE = `https://${domain}`;

  function authHeaders(): Record<string, string> {
    // Basic auth: username = API key, password = empty.
    const basic =
      typeof Buffer !== "undefined"
        ? Buffer.from(`${token}:`).toString("base64")
        : btoa(`${token}:`);
    return {
      Authorization: `Basic ${basic}`,
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
        throw new Error(`Teamwork GET ${path} → ${res.status}: ${text}`);
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) return undefined as T;
      return (await res.json()) as T;
    }
  }

  interface ProjectResponse {
    project: TeamworkProject;
  }

  interface ProjectsPage {
    projects: TeamworkProject[];
    meta?: { page?: { hasMore?: boolean } };
  }

  return {
    async getProject(projectId) {
      const params = new URLSearchParams({ include: "customfieldProjects" });
      const data = await call<ProjectResponse>(
        `/projects/api/v3/projects/${projectId}.json?${params.toString()}`,
      );
      return data.project;
    },

    async listProjects(options = {}) {
      const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
      const all: TeamworkProject[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const params = new URLSearchParams({
          include: "customfieldProjects",
          page: String(page),
          pageSize: String(pageSize),
        });
        const data = await call<ProjectsPage>(
          `/projects/api/v3/projects.json?${params.toString()}`,
        );
        all.push(...data.projects);
        hasMore = data.meta?.page?.hasMore === true;
        page += 1;
      }
      return all;
    },

    projectUrl(projectId) {
      return `${BASE}/app/projects/${projectId}`;
    },
  };
}
