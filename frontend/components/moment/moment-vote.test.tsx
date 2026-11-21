// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { submitVoteMock } = vi.hoisted(() => ({ submitVoteMock: vi.fn() }));

vi.mock("@/app/moment-actions", () => ({
  submitMomentVote: submitVoteMock,
}));

import { submitMomentVote } from "@/app/moment-actions";
import MomentVote from "./moment-vote";

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

const moment = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Friday Night Out",
  status: "voting" as const,
  expires_at: "2026-11-22T04:00:00.000Z",
  vibe_name: "Pepsi Original",
  my_vote_count: 0,
  plan_count: 2,
  has_voted: false,
  my_boost_used: false,
  plans: [
    {
      id: "40000000-0000-4000-8000-000000000001",
      position: 1,
      title: "Sunset picnic",
      category: "outdoors",
      neighborhood: "South Beach",
      budget_label: "$",
      image_key: null,
      short_insight: "Golden-hour views by the water",
      description: "Pick up snacks and enjoy the sunset.",
      my_vote: null,
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      position: 2,
      title: "Little Havana food crawl",
      category: "food",
      neighborhood: "Little Havana",
      budget_label: "$$",
      image_key: null,
      short_insight: "A casual walk with plenty to taste",
      description: "Explore Cuban coffee and small bites.",
      my_vote: null,
    },
  ],
};

describe("MomentVote", () => {
  it("shows one plan at a time with Tinder-style vote controls", () => {
    render(<MomentVote moment={moment} />);

    expect(screen.getByRole("heading", { name: "Sunset picnic" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Little Havana food crawl" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dislike plan" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Like plan" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pepsi Boost" })).toBeEnabled();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("saves a vote and advances to the next plan without reloading", async () => {
    vi.mocked(submitMomentVote).mockResolvedValue({ ok: true });
    render(<MomentVote moment={moment} />);

    fireEvent.click(screen.getByRole("button", { name: "Like plan" }));

    await waitFor(() => {
      expect(submitMomentVote).toHaveBeenCalledWith(
        moment.id,
        moment.plans[0].id,
        "like",
      );
      expect(screen.getByRole("heading", { name: "Little Havana food crawl" })).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    });
  });

  it("allows only one Pepsi Boost per participant", async () => {
    vi.mocked(submitMomentVote).mockResolvedValue({ ok: true });
    render(<MomentVote moment={moment} />);

    fireEvent.click(screen.getByRole("button", { name: "Pepsi Boost" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pepsi Boost already used" })).toBeDisabled();
    });
    expect(submitMomentVote).toHaveBeenCalledWith(
      moment.id,
      moment.plans[0].id,
      "boost",
    );
  });

  it("uses Pepsi Boost when the guest swipes up in the dedicated gesture area", async () => {
    vi.mocked(submitMomentVote).mockResolvedValue({ ok: true });
    render(<MomentVote moment={moment} />);

    const gestureArea = screen.getByRole("group", { name: "Pepsi Boost gesture area" });
    fireEvent.pointerDown(gestureArea, { pointerId: 1, pointerType: "touch", clientX: 100, clientY: 120 });
    fireEvent.pointerMove(gestureArea, { pointerId: 1, pointerType: "touch", clientX: 104, clientY: 35 });
    fireEvent.pointerUp(gestureArea, { pointerId: 1, pointerType: "touch", clientX: 104, clientY: 35 });

    await waitFor(() => {
      expect(submitMomentVote).toHaveBeenCalledWith(
        moment.id,
        moment.plans[0].id,
        "boost",
      );
      expect(screen.getByRole("heading", { name: "Little Havana food crawl" })).toBeInTheDocument();
    });
  });

  it("shows the completion state after all plans are rated", async () => {
    vi.mocked(submitMomentVote).mockResolvedValue({ ok: true });
    render(<MomentVote moment={moment} />);

    fireEvent.click(screen.getByRole("button", { name: "Dislike plan" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Little Havana food crawl" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Like plan" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "You've made your picks." })).toBeInTheDocument();
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });
  });
});
