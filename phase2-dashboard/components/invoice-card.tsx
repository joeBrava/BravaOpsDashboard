import Link from "next/link";
import { formatUsd, invoiceStatusMeta } from "@/lib/invoices";
import type { Invoice } from "@/lib/invoices";
import { StatusPill } from "./status-pill";

interface InvoiceCardProps {
  invoice: Invoice;
  /**
   * When provided, the whole card links to the associated deal-detail page
   * (`/deals/[id]`). Omitted when no project matches the invoice's dealName, or
   * on the deal-detail page itself where linking back to the same deal is
   * pointless — the card then renders as a static row with its action button.
   */
  href?: string;
}

export function InvoiceCard({ invoice, href }: InvoiceCardProps) {
  const meta = invoiceStatusMeta(invoice.status);
  const needsAction = invoice.overdue ?? false;

  const rowClass = `flex items-center gap-[18px] rounded-[15px] border-l-[5px] bg-white px-[18px] py-4 shadow-[0_4px_14px_rgba(50,35,80,0.05)] ${meta.edgeClass}`;
  const actionClass = `flex-none whitespace-nowrap rounded-[10px] px-4 py-[9px] font-display text-[0.8rem] font-semibold ${
    needsAction
      ? "bg-purple text-white"
      : "border-[1.5px] border-[#ebe6dd] bg-white text-purple"
  }`;
  const actionLabel = needsAction ? "Send reminder" : "View";

  const body = (
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
  );

  // Linked: whole card is an <a>, so the action is a styled <span> (no nested
  // interactive elements). Unlinked: the action stays an actual <button>.
  if (href) {
    return (
      <Link
        href={href}
        className={`${rowClass} transition-shadow hover:shadow-[0_6px_18px_rgba(50,35,80,0.1)]`}
      >
        {body}
        <span className={actionClass}>{actionLabel}</span>
      </Link>
    );
  }

  return (
    <div className={rowClass}>
      {body}
      <button type="button" className={actionClass}>
        {actionLabel}
      </button>
    </div>
  );
}
