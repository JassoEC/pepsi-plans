import { createSupabaseServerClient } from "../supabase/server";

export type Vibe = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_key: string | null;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

export async function getActiveVibes(): Promise<Vibe[]> {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("vibes")
    .select(
      "id, name, slug, description, image_key, starts_at, ends_at, sort_order",
    )
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Vibe[];
}
