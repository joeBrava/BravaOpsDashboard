import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusPill } from "@/components/status-pill";

describe("StatusPill", () => {
  it("renders its label text", () => {
    render(
      <StatusPill
        label="On track"
        pillClass="bg-[#f1f5ce] text-[#5c6a00]"
        dotClass="bg-lime"
      />,
    );
    expect(screen.getByText("On track")).toBeInTheDocument();
  });

  it("applies the supplied pill classes to the wrapper", () => {
    render(<StatusPill label="Blocked" pillClass="bg-danger" dotClass="bg-danger" />);
    const pill = screen.getByText("Blocked");
    expect(pill.className).toContain("bg-danger");
    expect(pill.className).toContain("rounded-full");
  });
});
