import { createSupabaseServerClient } from "../supabase/server";

export const PLAN_BATCH_SIZE = 5;

export type Plan = {
  id: string;
  vibe_id: string;
  title: string;
  category: string;
  neighborhood: string | null;
  budget_label: string | null;
  image_key: string | null;
  short_insight: string | null;
  description: string | null;
};

export type PlansPage = {
  plans: Plan[];
  hasMore: boolean;
};

export async function getActivePlansPageByVibe(
  vibeId: string,
  offset = 0,
): Promise<PlansPage> {
  if (!vibeId.trim()) {
    throw new Error("A Vibe ID is required to fetch plans.");
  }

  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("A valid plan offset is required.");
  }

  const supabase = await createSupabaseServerClient();

  // Fetch one extra row to determine whether another batch is available.
  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, vibe_id, title, category, neighborhood, budget_label, image_key, short_insight, description, vibes!inner(id)",
    )
    .eq("vibe_id", vibeId)
    .eq("is_active", true)
    .order("title", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + PLAN_BATCH_SIZE);

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map(({ vibes: _vibe, ...plan }) => plan as Plan);

  return {
    plans: rows.slice(0, PLAN_BATCH_SIZE),
    hasMore: rows.length > PLAN_BATCH_SIZE,
  };
}
