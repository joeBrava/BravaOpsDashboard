import type { ProjectDetail } from "@/lib/types";

/** Format an ISO date (YYYY-MM-DD) as e.g. "Jun 12, 2026"; passthrough on parse failure. */
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cream-deep py-[10px] last:border-b-0">
      <span className="text-[0.74rem] uppercase tracking-[0.04em] text-gray-mid">
        {label}
      </span>
      <span className="min-w-0 text-right text-[0.85rem] font-medium text-ink">
        {children}
      </span>
    </div>
  );
}

/**
 * HubSpot/Teamwork metadata + deep-links for the deal-detail page. External
 * links open in a new tab; absent links/fields are simply omitted (the live
 * mapper may not populate every field).
 */
export function DetailMeta({ detail }: { detail: ProjectDetail }) {
  return (
    <div className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[14px]">
      <h3 className="mb-1 font-display text-base font-bold text-ink">Details</h3>
      <Row label="Owner">
        {detail.owner} ({detail.ownerInitials})
      </Row>
      {detail.companyName && <Row label="Company">{detail.companyName}</Row>}
      {detail.dueDate && <Row label="Due">{formatDate(detail.dueDate)}</Row>}
      <Row label="Links">
        <span className="flex flex-wrap justify-end gap-2">
          {detail.hubspotUrl && (
            <a
              href={detail.hubspotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[8px] border-[1.5px] border-[#ebe6dd] bg-white px-[10px] py-[5px] font-display text-[0.74rem] font-semibold text-purple"
            >
              HubSpot ↗
            </a>
          )}
          {detail.teamworkUrl && (
            <a
              href={detail.teamworkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[8px] border-[1.5px] border-[#ebe6dd] bg-white px-[10px] py-[5px] font-display text-[0.74rem] font-semibold text-purple"
            >
              Teamwork ↗
            </a>
          )}
          {!detail.hubspotUrl && !detail.teamworkUrl && (
            <span className="text-[0.78rem] font-medium text-gray-mid">
              No external links
            </span>
          )}
        </span>
      </Row>
    </div>
  );
}

/**
 * Notes / activity history for the deal-detail page. Renders the project's
 * context lines (note / nextStep / blocker) plus the dated `history` log. Shows
 * a friendly empty state when there's nothing to show.
 */
export function DetailHistory({ detail }: { detail: ProjectDetail }) {
  const hasContext = Boolean(detail.note || detail.nextStep || detail.blocker);
  const history = detail.history ?? [];
  const hasHistory = history.length > 0;

  return (
    <div className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[14px]">
      <h3 className="mb-2 font-display text-base font-bold text-ink">
        Notes & history
      </h3>

      {hasContext && (
        <div className="mb-3 flex flex-col gap-[6px]">
          {detail.blocker && (
            <p className="text-[0.85rem] font-medium text-danger">
              {detail.blocker}
            </p>
          )}
          {detail.note && (
            <p className="text-[0.85rem] font-medium text-gray-dark">
              {detail.note}
            </p>
          )}
          {detail.nextStep && (
            <p className="text-[0.85rem] font-medium text-purple">
              {detail.nextStep}
            </p>
          )}
        </div>
      )}

      {hasHistory ? (
        <ol className="flex flex-col gap-[10px]">
          {history.map((h, i) => (
            <li key={`${h.at}-${i}`} className="flex items-baseline gap-[10px]">
              <span className="flex-none font-display text-[0.72rem] font-semibold text-gray-mid">
                {formatDate(h.at)}
              </span>
              <span className="text-[0.85rem] font-medium text-ink">
                {h.label}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        !hasContext && (
          <p className="text-[0.82rem] font-medium text-gray-mid">
            No notes or history yet.
          </p>
        )
      )}
    </div>
  );
}
