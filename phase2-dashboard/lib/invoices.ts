export type InvoiceStatus = "unpaid" | "pending" | "paid";

export interface Invoice {
  /** invoice number, e.g. "1042" */
  id: string;
  dealName: string;
  /** e.g. "Design deposit", "P1 milestone" */
  lineItem: string;
  /** whole dollars; formatted at render with formatUsd */
  amount: number;
  status: InvoiceStatus;
  /** short trailing note, e.g. "8 days overdue", "due in 5 days", "paid Jun 1" */
  dueNote: string;
  /** true for past-due unpaid invoices */
  overdue?: boolean;
}

export const invoices: Invoice[] = [
  {
    id: "1042",
    dealName: "Big Customer Logo",
    lineItem: "Design deposit",
    amount: 2500,
    status: "unpaid",
    dueNote: "8 days overdue",
    overdue: true,
  },
  {
    id: "1041",
    dealName: "Acme Corp Q3",
    lineItem: "P1 milestone",
    amount: 4250,
    status: "unpaid",
    dueNote: "3 days overdue",
    overdue: true,
  },
  {
    id: "1039",
    dealName: "Salt Lake Temple",
    lineItem: "P2 milestone",
    amount: 4250,
    status: "pending",
    dueNote: "due in 5 days",
  },
  {
    id: "1038",
    dealName: "Salt Lake Temple",
    lineItem: "P1 milestone",
    amount: 4250,
    status: "paid",
    dueNote: "paid Jun 1",
  },
  {
    id: "1036",
    dealName: "Acme Corp Q3",
    lineItem: "Design deposit",
    amount: 2000,
    status: "paid",
    dueNote: "paid May 28",
  },
  {
    id: "1031",
    dealName: "Salt Lake Temple",
    lineItem: "Design deposit",
    amount: 2000,
    status: "paid",
    dueNote: "paid May 12",
  },
];

/** Format whole dollars as "$11,000". */
export function formatUsd(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

/** Summary aggregates derived from the invoice list (kept honest, no hardcoding). */
export const invoiceSummary = {
  outstanding: invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0),
  overdue: invoices.filter((i) => i.overdue).length,
  paidThisMonth: invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0),
};

export interface InvoiceStatusMeta {
  label: string;
  /** Tailwind class for the card's left edge color */
  edgeClass: string;
  /** Tailwind classes for the status pill (bg + text) */
  pillClass: string;
  /** Tailwind class for the pill's leading dot */
  dotClass: string;
}

const STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  unpaid: {
    label: "Unpaid",
    edgeClass: "border-l-danger",
    pillClass: "bg-[#ffe1e5] text-[#c20f2b]",
    dotClass: "bg-danger",
  },
  pending: {
    label: "Pending",
    edgeClass: "border-l-gold",
    pillClass: "bg-[#fff1c9] text-[#876a00]",
    dotClass: "bg-gold",
  },
  paid: {
    label: "Paid",
    edgeClass: "border-l-teal",
    pillClass: "bg-[#d7f4f2] text-[#00726e]",
    dotClass: "bg-teal",
  },
};

export function invoiceStatusMeta(status: InvoiceStatus): InvoiceStatusMeta {
  return STATUS_META[status];
}
