import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GUEST_COOKIE = "pepsi_guest_identity";

export type GuestRoom = {
  id: string;
  title: string;
  vibe_name: string;
  status: "draft" | "ready" | "voting" | "completed" | "expired";
  created_at: string;
  expires_at: string;
  participant_count: number;
  plan_count: number;
  kind: "hosted" | "joined";
};

export type GuestDashboard = {
  user: { id: string; name: string };
  hosted: GuestRoom[];
  joined: GuestRoom[];
};

export async function getGuestDashboard(): Promise<GuestDashboard | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_guest_dashboard", {
    p_token: token,
  });

  if (error) throw error;
  return (data as GuestDashboard | null) ?? null;
}

export { GUEST_COOKIE };
