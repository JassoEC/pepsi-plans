import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { getActivePlansPageByVibe } from "./plans";
import { PLAN_BATCH_SIZE } from "./plans";

function createQueryBuilder(response: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    then: (
      onFulfilled: (value: typeof response) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(response).then(onFulfilled, onRejected),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);

  return query;
}

function makePlan(id: string, title: string) {
  return {
    id,
    vibe_id: "vibe-1",
    title,
    category: "entertainment",
    neighborhood: "Downtown Miami",
    budget_label: "$$",
    image_key: null,
    short_insight: "A little friendly competition",
    description: null,
    vibes: { id: "vibe-1" },
  };
}

describe("getActivePlansPageByVibe", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("returns active plans for the requested Vibe and indicates whether another page exists", async () => {
    const rows = [makePlan("plan-1", "Arcade night")];
    const query = createQueryBuilder({ data: rows, error: null });
    const from = vi.fn().mockReturnValue(query);
    createSupabaseServerClientMock.mockResolvedValue({ from });

    const { vibes: _vibes, ...expectedPlan } = rows[0];
    await expect(getActivePlansPageByVibe("vibe-1")).resolves.toEqual({
      plans: [expectedPlan],
      hasMore: false,
    });

    expect(from).toHaveBeenCalledWith("plans");
    expect(query.select).toHaveBeenCalledWith(
      "id, vibe_id, title, category, neighborhood, budget_label, image_key, short_insight, description, vibes!inner(id)",
    );
    expect(query.eq).toHaveBeenNthCalledWith(1, "vibe_id", "vibe-1");
    expect(query.eq).toHaveBeenNthCalledWith(2, "is_active", true);
    expect(query.eq).toHaveBeenNthCalledWith(3, "vibes.is_active", true);
    expect(query.order).toHaveBeenNthCalledWith(1, "title", { ascending: true });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: true });
    expect(query.range).toHaveBeenCalledWith(0, PLAN_BATCH_SIZE);
  });

  it("returns only one batch and sets hasMore when an extra row is available", async () => {
    const rows = Array.from({ length: PLAN_BATCH_SIZE + 1 }, (_, index) =>
      makePlan(`plan-${index + 1}`, `Plan ${index + 1}`),
    );
    const query = createQueryBuilder({ data: rows, error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    const result = await getActivePlansPageByVibe("vibe-1", PLAN_BATCH_SIZE);

    expect(result.plans).toHaveLength(PLAN_BATCH_SIZE);
    expect(result.hasMore).toBe(true);
    expect(query.range).toHaveBeenCalledWith(PLAN_BATCH_SIZE, PLAN_BATCH_SIZE * 2);
  });

  it("returns an empty page when the Vibe has no active plans", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActivePlansPageByVibe("vibe-1")).resolves.toEqual({
      plans: [],
      hasMore: false,
    });
  });

  it("rejects an empty Vibe ID before querying Supabase", async () => {
    await expect(getActivePlansPageByVibe("  ")).rejects.toThrow(
      "A Vibe ID is required to fetch plans.",
    );
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid offset before querying Supabase", async () => {
    await expect(getActivePlansPageByVibe("vibe-1", -1)).rejects.toThrow(
      "A valid plan offset is required.",
    );
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled();
  });

  it("propagates Supabase query errors", async () => {
    const error = new Error("Database unavailable");
    const query = createQueryBuilder({ data: null, error });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActivePlansPageByVibe("vibe-1")).rejects.toBe(error);
  });
});