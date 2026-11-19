import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("../supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { getActiveVibes } from "./vibes";

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

describe("getActiveVibes", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns active Vibes within their validity window in catalog order", async () => {
    const vibes = [
      {
        id: "vibe-1",
        name: "Pepsi Original",
        slug: "pepsi-original",
        description: null,
        image_key: null,
        starts_at: null,
        ends_at: null,
        sort_order: 1,
      },
    ];
    const query = createQueryBuilder({ data: vibes, error: null });
    const from = vi.fn().mockReturnValue(query);

    createSupabaseServerClientMock.mockResolvedValue({ from });

    await expect(getActiveVibes()).resolves.toEqual(vibes);

    expect(from).toHaveBeenCalledWith("vibes");
    expect(query.select).toHaveBeenCalledWith(
      "id, name, slug, description, image_key, starts_at, ends_at, sort_order",
    );
    expect(query.eq).toHaveBeenCalledWith("is_active", true);
    expect(query.order).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "name", {
      ascending: true,
    });
  });

  it("returns an empty list when there are no active Vibes", async () => {
    const query = createQueryBuilder({ data: null, error: null });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActiveVibes()).resolves.toEqual([]);
  });

  it("propagates Supabase query errors", async () => {
    const error = new Error("Database unavailable");
    const query = createQueryBuilder({ data: null, error });
    createSupabaseServerClientMock.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });

    await expect(getActiveVibes()).rejects.toBe(error);
  });
});
