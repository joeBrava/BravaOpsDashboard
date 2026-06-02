import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { FilterChips } from "@/components/filter-chips";
import { InvoiceCard } from "@/components/invoice-card";
import { invoices, invoiceSummary, formatUsd } from "@/lib/invoices";

const INVOICE_FILTERS = ["All", "Overdue", "Pending", "Paid"] as const;

export default function InvoicesPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <Topbar
          title="Invoices"
          sub={`Tuesday, June 2 · ${invoiceSummary.overdue} overdue`}
        />

        <div className="mb-[22px] grid grid-cols-3 gap-[14px]">
          <StatCard
            value={formatUsd(invoiceSummary.outstanding)}
            label="Outstanding"
            icon="$"
            iconClass="bg-[#efe7fb] text-purple"
          />
          <StatCard
            value={String(invoiceSummary.overdue)}
            label="Overdue"
            icon="!"
            iconClass="bg-[#ffe1e5] text-[#c20f2b]"
          />
          <StatCard
            value={formatUsd(invoiceSummary.paidThisMonth)}
            label="Paid this month"
            icon="✓"
            iconClass="bg-[#d7f4f2] text-[#00726e]"
          />
        </div>

        <div className="mb-3 mt-1 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">Invoices</h3>
          <FilterChips filters={INVOICE_FILTERS} />
        </div>

        <div className="flex flex-col gap-3">
          {invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} />
          ))}
        </div>
      </main>
    </div>
  );
}
