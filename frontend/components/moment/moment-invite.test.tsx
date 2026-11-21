// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import MomentInvite from "./moment-invite";

afterEach(() => cleanup());

const invite = {
  id: "20000000-0000-4000-8000-000000000001",
  title: "Friday Night Out",
  status: "voting" as const,
  expires_at: "2026-11-22T04:00:00.000Z",
  vibe_name: "Pepsi Original",
  is_participant: false,
  participant_count: 3,
  plans: [
    {
      position: 1,
      title: "Rooftop vibes",
      category: "Nightlife",
      neighborhood: "Wynwood",
      budget_label: "$$",
      short_insight: "Great views",
      description: "A rooftop bar",
    },
  ],
};

describe("MomentInvite", () => {
  it("shows a clear, minimal invitation centered on the Moment title", () => {
    render(<MomentInvite invite={invite} />);

    expect(screen.getByText("You've been invited to")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Friday Night Out" })).toBeInTheDocument();
    expect(screen.getByText("Your friends are making plans. Come help decide what happens next.")).toBeInTheDocument();
    expect(screen.getByText("3 people are already in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view plans/i })).toBeDisabled();
  });

  it("does not expose the plans list or ask for a nickname on the invitation landing", () => {
    render(<MomentInvite invite={invite} />);

    expect(screen.queryByText("Rooftop vibes")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/nickname/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
