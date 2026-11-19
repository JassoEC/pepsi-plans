// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlanDiscovery from "./plan-discovery";
import type { Plan } from "@/lib/catalog/plans";

function makePlans(count: number): Plan[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `plan-${index + 1}`,
    vibe_id: "vibe-1",
    title: `Plan ${index + 1}`,
    category: "outdoors",
    neighborhood: "Miami",
    budget_label: "$$",
    image_key: null,
    short_insight: "A good time together",
    description: null,
  }));
}

describe("PlanDiscovery", () => {
  it("preserves selected plans when another batch is revealed", () => {
    render(<PlanDiscovery plans={makePlans(8)} />);

    fireEvent.click(screen.getByRole("button", { name: /plan 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /show 3 more plans/i }));
    fireEvent.click(screen.getByRole("button", { name: /plan 6/i }));

    expect(screen.getByText("2 of 10 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /continue with 2/i }));

    expect(screen.getByText("This is your shortlist.")).toBeTruthy();
    expect(screen.getByText("Plan 1")).toBeTruthy();
    expect(screen.getByText("Plan 6")).toBeTruthy();
  });

  it("requires at least two plans before continuing", () => {
    render(<PlanDiscovery plans={makePlans(3)} />);

    const continueButton = screen.getByRole("button", { name: /continue with 0/i });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /plan 1/i }));
    expect(screen.getByRole("button", { name: /continue with 1/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /plan 2/i }));
    expect(screen.getByRole("button", { name: /continue with 2/i })).toBeEnabled();
  });

  it("prevents selecting more than ten plans", () => {
    render(<PlanDiscovery plans={makePlans(11)} />);

    fireEvent.click(screen.getByRole("button", { name: /show 5 more plans/i }));
    fireEvent.click(screen.getByRole("button", { name: /show 1 more plans/i }));

    for (let index = 1; index <= 10; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`Plan ${index}`, "i") }));
    }

    expect(screen.getByText("10 of 10 selected")).toBeTruthy();
    expect(screen.getByRole("button", { name: /plan 11/i })).toBeDisabled();
  });
});
