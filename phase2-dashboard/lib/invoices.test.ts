import { describe, it, expect } from "vitest";
import {
  invoices,
  invoiceSummary,
  invoiceStatusMeta,
  formatUsd,
} from "./invoices";
import type { InvoiceStatus } from "./invoices";

describe("formatUsd", () => {
  it("formats with thousands separators and a leading $", () => {
    expect(formatUsd(11000)).toBe("$11,000");
    expect(formatUsd(2500)).toBe("$2,500");
    expect(formatUsd(0)).toBe("$0");
  });
});

describe("invoiceSummary", () => {
  it("outstanding sums every non-paid invoice", () => {
    const expected = invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
    expect(invoiceSummary.outstanding).toBe(expected);
  });

  it("overdue counts invoices flagged overdue", () => {
    const expected = invoices.filter((i) => i.overdue).length;
    expect(invoiceSummary.overdue).toBe(expected);
  });

  it("paidThisMonth sums every paid invoice", () => {
    const expected = invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
    expect(invoiceSummary.paidThisMonth).toBe(expected);
  });

  it("computes the expected totals for the seeded data", () => {
    expect(invoiceSummary.outstanding).toBe(11000);
    expect(invoiceSummary.overdue).toBe(2);
    expect(invoiceSummary.paidThisMonth).toBe(8250);
  });
});

describe("invoiceStatusMeta", () => {
  it("maps each status to a label and non-empty classes", () => {
    for (const status of ["unpaid", "pending", "paid"] as InvoiceStatus[]) {
      const meta = invoiceStatusMeta(status);
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.edgeClass.length).toBeGreaterThan(0);
      expect(meta.pillClass.length).toBeGreaterThan(0);
      expect(meta.dotClass.length).toBeGreaterThan(0);
    }
  });

  it("uses the danger edge for unpaid and teal edge for paid", () => {
    expect(invoiceStatusMeta("unpaid").edgeClass).toContain("border-l-danger");
    expect(invoiceStatusMeta("paid").edgeClass).toContain("border-l-teal");
  });
});
