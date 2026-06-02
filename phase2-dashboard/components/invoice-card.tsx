import { formatUsd, invoiceStatusMeta } from "@/lib/invoices";
import type { Invoice } from "@/lib/invoices";
import { StatusPill } from "./status-pill";

interface InvoiceCardProps {
  invoice: Invoice;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const meta = invoiceStatusMeta(invoice.status);
  const needsAction = invoice.overdue ?? false;

  return (
    <div
      className={`flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] ${meta.edgeClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[9px] flex items-center gap-[11px]">
          <span className="font-display text-[1.02rem] font-bold text-ink">
            #{invoice.id} · {invoice.dealName}
          </span>
          <StatusPill
            label={meta.label}
            pillClass={meta.pillClass}
            dotClass={meta.dotClass}
          />
        </div>
        <div className="flex flex-wrap items-center gap-[8px] text-[0.78rem] font-medium text-gray-mid">
          <span>{invoice.lineItem}</span>
          <span className="font-display font-bold text-ink">
            {formatUsd(invoice.amount)}
          </span>
          <span>· {invoice.dueNote}</span>
        </div>
      </div>
      <button
        type="button"
        className={`flex-none whitespace-nowrap rounded-[10px] px-4 py-[9px] font-display text-[0.8rem] font-semibold ${
          needsAction
            ? "bg-purple text-white"
            : "border-[1.5px] border-[#ebe6dd] bg-white text-purple"
        }`}
      >
        {needsAction ? "Send reminder" : "View"}
      </button>
    </div>
  );
}
