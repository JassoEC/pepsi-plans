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
  it("shows host sharing, participant identities, and plan vote bars", () => {
    render(<MomentDetail moment={baseMoment} />);

    expect(screen.getByRole("button", { name: /copy invitation link/i })).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("MJ")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What's winning?" })).toBeInTheDocument();
    expect(screen.getByText("Paddleboard on Biscayne Bay")).toBeInTheDocument();
    expect(screen.getByLabelText("3 votes, 100% of the leading plan's votes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add my votes" })).toBeInTheDocument();
  });

  it("shows a social results recap for a guest without host actions or voting controls", () => {
    render(
      <MomentDetail
        moment={{
          ...baseMoment,
          is_host: false,
          has_voted: true,
        }}
      />,
    );

    expect(screen.getByText("You're part of this Moment. See what your crew is vibing with.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "The final results" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copy invitation link/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Add my votes" })).not.toBeInTheDocument();
    expect(screen.getByText("MJ")).toBeInTheDocument();
  });
});
