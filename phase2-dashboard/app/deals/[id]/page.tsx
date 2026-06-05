import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { StatusPill } from "@/components/status-pill";
import { StageTimeline } from "@/components/stage-timeline";
import { DetailMeta, DetailHistory } from "@/components/detail-meta";
import { InvoiceCard } from "@/components/invoice-card";
import { getSource } from "@/lib/data/source";
import { getProjectStatusMeta } from "@/lib/project-status";
import { formatUsd } from "@/lib/invoices";

// Dynamic-route params are async in Next 16 — `params` is a Promise that must
// be awaited (see node_modules/next/dist/docs/.../dynamic-routes.md). The page
// is an async Server Component reading through the same `getSource()` adapter
// as the Pipeline/Invoices views, so fixture↔live is a single env change.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const detail = await getSource().getProject(id);
  return {
    title: detail
      ? `${detail.name} — Biz Bricks Ops`
      : "Deal not found — Biz Bricks Ops",
  };
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSource().getProject(id);

  // notFound() throws NEXT_HTTP_ERROR_FALLBACK;404 and terminates rendering of
  // this segment, rendering the nearest not-found UI.
  if (!detail) {
    notFound();
  }

  const meta = getProjectStatusMeta(detail.status);
  const outstanding = detail.invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        {/* Breadcrumb back to the pipeline */}
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-[6px] text-[0.8rem] font-semibold text-purple"
        >
          ← Back to pipeline
        </Link>

        {/* Header + status pill */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[11px]">
              <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
                {detail.name}
              </h2>
              <StatusPill
                label={meta.label}
                pillClass={meta.pillClass}
                dotClass={meta.dotClass}
              />
            </div>
            <div className="mt-[3px] text-[0.84rem] text-gray-mid">
              {detail.companyName ?? detail.name} · Owner {detail.owner}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
          {/* Left column: timeline + invoices */}
          <div className="flex flex-col gap-[18px]">
            <section className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[16px]">
              <h3 className="mb-3 font-display text-base font-bold text-ink">
                Production timeline
              </h3>
              <StageTimeline stages={detail.stages} />
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-ink">
                  Invoices
                </h3>
                {detail.invoices.length > 0 && (
                  <span className="text-[0.78rem] font-medium text-gray-mid">
                    {formatUsd(outstanding)} outstanding
                  </span>
                )}
              </div>
              {detail.invoices.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {detail.invoices.map((inv) => (
                    <InvoiceCard key={inv.id} invoice={inv} />
                  ))}
                </div>
              ) : (
                <div className="rounded-[15px] border border-dashed border-[#ebe6dd] bg-white px-[18px] py-8 text-center text-[0.85rem] font-medium text-gray-mid">
                  No invoices associated with this deal yet.
                </div>
              )}
            </section>
          </div>

          {/* Right column: metadata + notes/history */}
          <div className="flex flex-col gap-[18px]">
            <DetailMeta detail={detail} />
            <DetailHistory detail={detail} />
          </div>
        </div>
      </main>
    </div>
  );
}
