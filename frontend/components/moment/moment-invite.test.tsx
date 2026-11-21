// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("@/app/guest-actions", () => ({
  registerGuest: vi.fn(),
}));
vi.mock("@/app/invite-actions", () => ({
  joinMomentFromInvite: vi.fn(),
}));

import { registerGuest } from "@/app/guest-actions";
import { joinMomentFromInvite } from "@/app/invite-actions";
import MomentInvite from "./moment-invite";

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

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
  it("shows a clear invitation and opens nickname onboarding from View plans", () => {
    render(<MomentInvite invite={invite} inviteToken="invite-token" />);

    expect(screen.getByText("You've been invited to")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Friday Night Out" })).toBeInTheDocument();
    expect(screen.getByText("Your next moment starts here.")).toBeInTheDocument();
    expect(screen.getByText("3 people are already in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view plans/i })).toBeEnabled();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view plans/i }));

    expect(screen.getByRole("heading", { name: "What should we call you?" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /your nickname/i })).toBeInTheDocument();
  });

  it("registers the nickname, joins the invited Moment, and opens its voting route", async () => {
    vi.mocked(registerGuest).mockResolvedValue({ ok: true });
    vi.mocked(joinMomentFromInvite).mockResolvedValue({
      ok: true,
      roomId: "30000000-0000-4000-8000-000000000001",
    });

    render(<MomentInvite invite={invite} inviteToken="invite-token" />);
    fireEvent.click(screen.getByRole("button", { name: /view plans/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /your nickname/i }), {
      target: { value: "Alex" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue to plans/i }));

    await waitFor(() => {
      expect(registerGuest).toHaveBeenCalledWith("Alex");
      expect(joinMomentFromInvite).toHaveBeenCalledWith("invite-token");
      expect(pushMock).toHaveBeenCalledWith(
        "/moment/30000000-0000-4000-8000-000000000001/vote",
      );
    });
  });

  it("does not expose the plans list on the invitation or nickname screens", () => {
    render(<MomentInvite invite={invite} inviteToken="invite-token" />);

    expect(screen.queryByText("Rooftop vibes")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /view plans/i }));
    expect(screen.queryByText("Rooftop vibes")).not.toBeInTheDocument();
  });
});
