import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoiceCard } from "@/components/invoice-card";
import type { Invoice } from "@/lib/invoices";

const paid: Invoice = {
  id: "1038",
  dealName: "Salt Lake Temple",
  lineItem: "P1 milestone",
  amount: 4250,
  status: "paid",
  dueNote: "paid Jun 1",
};

const overdue: Invoice = {
  id: "1042",
  dealName: "Big Customer Logo",
  lineItem: "Design deposit",
  amount: 2500,
  status: "unpaid",
  dueNote: "8 days overdue",
  overdue: true,
};

describe("InvoiceCard", () => {
  it("renders the invoice id, deal name, line item and formatted amount", () => {
    render(<InvoiceCard invoice={paid} />);
    expect(screen.getByText(/#1038 · Salt Lake Temple/)).toBeInTheDocument();
    expect(screen.getByText("P1 milestone")).toBeInTheDocument();
    expect(screen.getByText("$4,250")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders as a static row with a View button when no href is given", () => {
    render(<InvoiceCard invoice={paid} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View" }),
    ).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<InvoiceCard invoice={paid} href="/deals/salt-lake-temple" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/deals/salt-lake-temple");
    expect(screen.getByText("View")).toBeInTheDocument();
  });

  it('shows a "Send reminder" action for overdue invoices', () => {
    render(<InvoiceCard invoice={overdue} />);
    expect(
      screen.getByRole("button", { name: "Send reminder" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });
});
