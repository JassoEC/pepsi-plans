// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({ getMomentInviteToken: vi.fn() }));
vi.mock("@/app/moment-actions", () => ({ closeMomentVoting: vi.fn() }));

import MomentDetail from "./moment-detail";

afterEach(() => cleanup());

const baseMoment = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Saturday with friends",
  status: "voting" as const,
  expires_at: "2026-11-22T04:00:00.000Z",
  created_at: "2026-11-21T00:00:00.000Z",
  vibe_name: "Pepsi Zero Sugar",
  is_host: true,
  has_voted: false,
  participant_count: 2,
  plan_count: 2,
  participants: [
    { id: "p1", nickname: "Emanuel" },
    { id: "p2", nickname: "Maria J" },
  ],
  plans: [
    {
      id: "plan1",
      position: 1,
      title: "Paddleboard on Biscayne Bay",
      category: "outdoors",
      neighborhood: "Key Biscayne",
      budget_label: "$$",
      short_insight: "Get out on the water.",
      description: null,
      vote_count: 3,
    },
    {
      id: "plan2",
      position: 2,
      title: "Sunset boat cruise",
      category: "on the water",
      neighborhood: "Miami",
      budget_label: "$$$",
      short_insight: null,
      description: null,
      vote_count: 1,
    },
  ],
};

describe("MomentDetail", () => {
  it("puts the Moment title first and shows participant initials only", () => {
    render(<MomentDetail moment={baseMoment} />);

    expect(screen.getByRole("heading", { name: "Saturday with friends" })).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.queryByText("Emanuel")).not.toBeInTheDocument();
    expect(screen.queryByText("Maria J")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy invite/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crew favorites" })).toBeInTheDocument();
    expect(screen.getByText("Paddleboard on Biscayne Bay")).toBeInTheDocument();
    expect(screen.getByLabelText("3 votes, 100% of the leading plan's votes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add my votes" })).toBeInTheDocument();
  });

  it("shows the same simplified Moment card to guests without host controls", () => {
    render(
      <MomentDetail
        moment={{
          ...baseMoment,
          is_host: false,
          has_voted: true,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Saturday with friends" })).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.queryByText("Maria J")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crew favorites" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy invite/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close voting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add my votes" })).not.toBeInTheDocument();
  });
});
