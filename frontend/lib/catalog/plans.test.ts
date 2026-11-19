import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { getActivePlansByVibe } from "./plans";

function createQueryBuilder(response: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: (
      onFulfilled: (value: typeof response) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(onFulfilled, onRejected),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}

describe("getActivePlansByVibe", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("returns active plans for the requested Vibe ordered by title", async () => {
    const plans = [
      {
        id: "plan-1",
        vibe_id: "vibe-1",
        title: "Arcade night",
        category: "entertainment",
        neighborhood: "Downtown Miami",
        budget_label: "$$",
        image_key: null,
        short_insight: "A little friendly competition",
        description: null,
        vibes: { id: "vibe-1" },
      },
    ];
    const query = createQueryBuilder({ data: plans, error: null });
    const from = vi.fn().mockReturnValue(query);

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(getActivePlansByVibe("vibe-1")).resolves.toEqual(plans);

    expect(from).toHaveBeenCalledWith("plans");
    expect(query.select).toHaveBeenCalledWith(
      "id, vibe_id, title, category, neighborhood, budget_label, image_key, short_insight, description, vibes!inner(id)",
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, "vibe_id", "vibe-1");
    expect(query.eq).toHaveBeenNthCalledWith(2, "is_active", true);
    expect(query.order).toHaveBeenCalledWith("title", { ascending: true });
  });

  it("returns an empty list when the Vibe has no active plans", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActivePlansByVibe("vibe-1")).resolves.toEqual([]);
  });

  it("rejects an empty Vibe ID before querying Supabase", async () => {
    await expect(getActivePlansByVibe("  ")).rejects.toThrow(
      "A Vibe ID is required to fetch plans.",
    );

    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("propagates Supabase query errors", async () => {
    const error = new Error("Database unavailable");
    const query = createQueryBuilder({ data: null, error });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActivePlansByVibe("vibe-1")).rejects.toBe(error);
  });
});
