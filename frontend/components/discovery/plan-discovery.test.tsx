// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getMorePlans } from "@/app/actions";
import PlanDiscovery from "./plan-discovery";
import type { Plan } from "@/lib/catalog/plans";

vi.mock("@/app/actions", () => ({
  getMorePlans: vi.fn(),
}));

const mockedGetMorePlans = vi.mocked(getMorePlans);

afterEach(() => cleanup());

function makePlans(count: number, startAt = 1): Plan[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `plan-${startAt + index}`,
    vibe_id: "20000000-0000-4000-8000-000000000001",
    title: `Plan ${startAt + index}`,
    category: "outdoors",
    neighborhood: "Miami",
    budget_label: "$$",
    image_key: null,
    short_insight: "A good time together",
    description: null,
  }));
}

describe("PlanDiscovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the next batch from the server and preserves the current selection", async () => {
    mockedGetMorePlans.mockResolvedValue({
      plans: makePlans(3, 6),
      hasMore: false,
    });

    render(
      <PlanDiscovery
        vibeId="20000000-0000-4000-8000-000000000001"
        initialPlans={makePlans(5)}
        initialHasMore
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Plan 1 to your selection" }));
    fireEvent.click(screen.getByRole("button", { name: /^Get more suggestions$/ }));

    expect(mockedGetMorePlans).toHaveBeenCalledWith(
      "20000000-0000-4000-8000-000000000001",
      5,
    );

    await screen.findByRole("button", { name: "Add Plan 8 to your selection" });
    expect(screen.getByText("1 of 10 selected")).toBeInTheDocument();
    expect(screen.getByText("You've seen all the ideas for this Vibe.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Plan 6 to your selection" }));
    fireEvent.click(screen.getByRole("button", { name: "Review 2 selected plans" }));

    expect(screen.getByText("Your selected plans are ready.")).toBeInTheDocument();
    expect(screen.getByText("Plan 1")).toBeInTheDocument();
    expect(screen.getByText("Plan 6")).toBeInTheDocument();
  });

  it("shows a retry message when loading another batch fails", async () => {
    mockedGetMorePlans.mockRejectedValue(new Error("Network error"));

    render(
      <PlanDiscovery
        vibeId="20000000-0000-4000-8000-000000000001"
        initialPlans={makePlans(5)}
        initialHasMore
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /get more suggestions/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't load more ideas. Please try again.",
    );
    expect(screen.getByRole("button", { name: /get more suggestions/i })).toBeEnabled();
  });

  it("requires at least two plans before continuing", () => {
    render(
      <PlanDiscovery
        vibeId="20000000-0000-4000-8000-000000000001"
        initialPlans={makePlans(3)}
        initialHasMore={false}
      />,
    );

    const continueButton = screen.getByRole("button", { name: "Review 0 selected plans" });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Add Plan 1 to your selection" }));
    expect(screen.getByRole("button", { name: "Review 1 selected plans" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Add Plan 2 to your selection" }));
    expect(screen.getByRole("button", { name: "Review 2 selected plans" })).toBeEnabled();
  });

  it("prevents selecting more than ten plans", () => {
    render(
      <PlanDiscovery
        vibeId="20000000-0000-4000-8000-000000000001"
        initialPlans={makePlans(11)}
        initialHasMore={false}
      />,
    );

    for (let index = 1; index <= 10; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: `Add Plan ${index} to your selection` }));
    }

    expect(screen.getByText("10 of 10 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Plan 11 to your selection" })).toBeDisabled();
  });
});
