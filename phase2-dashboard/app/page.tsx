import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { FilterChips } from "@/components/filter-chips";
import { DealCard } from "@/components/deal-card";
import { PaymentToast } from "@/components/payment-toast";
import { deals, dealStatusKey, summary, recentPayment } from "@/lib/mock-data";

export default function PipelinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <Topbar title="Your Pipeline" sub="Tuesday, June 2 · 3 active deals" />

        <div className="mb-[22px] grid grid-cols-4 gap-[14px]">
          <StatCard value={String(summary.active)} label="Active" icon="▦" iconClass="bg-[#efe7fb] text-purple" />
          <StatCard value={String(summary.readyToMove)} label="Ready to move" icon="↑" iconClass="bg-[#f1f5ce] text-[#7c8a00]" />
          <StatCard value={String(summary.blocked)} label="Blocked" icon="!" iconClass="bg-[#ffe1e5] text-[#c20f2b]" />
          <StatCard value={summary.paidYesterday} label="Paid yesterday" icon="$" iconClass="bg-[#d7f4f2] text-[#00726e]" />
        </div>

        <div className="mb-3 mt-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">Active deals</h3>
          <FilterChips />
        </div>

        <div className="flex flex-col gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} statusKey={dealStatusKey(deal)} />
          ))}
        </div>

        <PaymentToast message={recentPayment} />
      </main>
    </div>
  );
}
