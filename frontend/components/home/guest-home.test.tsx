// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/guest-actions", () => ({ registerGuest: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import GuestHome from "./guest-home";
import type { GuestDashboard } from "@/lib/guest-identity";

afterEach(() => cleanup());

const room = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Saturday with friends",
  vibe_name: "Pepsi Original",
  status: "voting" as const,
  created_at: "2026-11-21T00:00:00.000Z",
  expires_at: "2026-11-22T04:00:00.000Z",
  participant_count: 3,
  plan_count: 5,
  kind: "hosted" as const,
};

const dashboard: GuestDashboard = {
  user: { id: "user-1", name: "Michelle" },
  hosted: [room],
  joined: [],
};

describe("GuestHome", () => {
  it("hides empty Moment sections and keeps the create action", () => {
    render(<GuestHome dashboard={{ ...dashboard, hosted: [], joined: [] }} />);

    expect(screen.getByRole("link", { name: /create a moment/i })).toHaveAttribute("href", "/create");
    expect(screen.queryByRole("region", { name: "Your Moments" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Moments you've joined" })).not.toBeInTheDocument();
    expect(screen.queryByText(/no moments yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no invitations yet/i)).not.toBeInTheDocument();
  });

  it("renders only populated collections", () => {
    render(<GuestHome dashboard={dashboard} />);

    expect(screen.getByRole("region", { name: "Your Moments" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Moments you've joined" })).not.toBeInTheDocument();
  });

  it("makes each Moment card the single navigation action", () => {
    render(<GuestHome dashboard={dashboard} />);

    const card = screen.getByRole("link", { name: /open saturday with friends, open moment/i });
    expect(card).toHaveAttribute("href", `/moment/${room.id}`);
    expect(screen.queryByRole("link", { name: /view and share/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /add my votes/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Open Moment")).not.toBeInTheDocument();
    expect(screen.queryByText("11/21/2026")).not.toBeInTheDocument();
  });

  it("shows hosted and joined collections when both contain Moments", () => {
    render(
      <GuestHome
        dashboard={{
          ...dashboard,
          joined: [{ ...room, id: "joined-1", title: "Friday with friends", kind: "joined" }],
        }}
      />,
    );

    expect(screen.getByRole("region", { name: "Your Moments" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Moments you've joined" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open friday with friends, open moment/i })).toHaveAttribute("href", "/moment/joined-1");
  });
});
