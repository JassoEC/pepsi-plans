"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function joinMomentFromInvite(inviteToken: string) {
  const parsed = z.string().min(40).max(128).regex(/^[A-Za-z0-9_-]+$/).safeParse(inviteToken);
  if (!parsed.success) return { ok: false as const, error: "This invitation link is invalid." };

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestToken) return { ok: false as const, error: "Set up your nickname before joining." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_guest_moment", {
    p_invite_token: parsed.data,
    p_guest_token: guestToken,
  });

  if (error || typeof data !== "string") {
    return { ok: false as const, error: "We couldn't join this Moment. The invitation may have expired." };
  }

  return { ok: true as const, roomId: data };
}
