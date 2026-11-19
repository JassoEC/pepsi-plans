import { createSupabaseServerClient } from "../supabase/server";

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

export async function getActivePlansByVibe(vibeId: string): Promise<Plan[]> {
  if (!vibeId.trim()) {
    throw new Error("A Vibe ID is required to fetch plans.");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("plans")
    .select(
      "id, vibe_id, title, category, neighborhood, budget_label, image_key, short_insight, description",
    )
    .eq("vibe_id", vibeId)
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Plan[];
}
