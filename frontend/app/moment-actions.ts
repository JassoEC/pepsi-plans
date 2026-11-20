"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getGuestToken() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

const roomIdSchema = z.string().uuid();

export async function startMomentVoting(roomId: string) {
  const parsed = roomIdSchema.safeParse(roomId);
  if (!parsed.success) return { ok: false as const, error: "Invalid Moment." };

  const token = await getGuestToken();
  if (!token) return { ok: false as const, error: "Your guest session has expired. Set up your nickname again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("start_guest_moment_voting", {
    p_token: token,
    p_room_id: parsed.data,
  });

  if (error || data !== true) {
    return { ok: false as const, error: "We couldn't start voting. Make sure you're the host and try again." };
  }

  revalidatePath(`/moment/${parsed.data}`);
  revalidatePath("/");
  return { ok: true as const };
}

const voteSchema = z.object({
  roomId: z.string().uuid(),
  planId: z.string().uuid(),
  action: z.enum(["like", "dislike", "boost"]),
});

export async function submitMomentVote(roomId: string, planId: string, action: "like" | "dislike" | "boost") {
  const parsed = voteSchema.safeParse({ roomId, planId, action });
  if (!parsed.success) return { ok: false as const, error: "Invalid vote." };

  const token = await getGuestToken();
  if (!token) return { ok: false as const, error: "Your guest session has expired. Set up your nickname again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_guest_moment_vote", {
    p_token: token,
    p_room_id: parsed.data.roomId,
    p_plan_id: parsed.data.planId,
    p_action: parsed.data.action,
  });

  if (error || data !== true) {
    return { ok: false as const, error: error?.code === "23505"
      ? "You've already voted on this plan or used your Boost."
      : "We couldn't save your vote. Please try again." };
  }

  revalidatePath(`/moment/${parsed.data.roomId}`);
  return { ok: true as const };
}

export async function closeMomentVoting(roomId: string) {
  const parsed = roomIdSchema.safeParse(roomId);
  if (!parsed.success) return { ok: false as const, error: "Invalid Moment." };

  const token = await getGuestToken();
  if (!token) return { ok: false as const, error: "Your guest session has expired. Set up your nickname again." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("close_guest_moment_voting", {
    p_token: token,
    p_room_id: parsed.data,
  });

  if (error || data !== true) {
    return { ok: false as const, error: "We couldn't close voting. Make sure you're the host and try again." };
  }

  revalidatePath(`/moment/${parsed.data}`);
  revalidatePath("/");
  return { ok: true as const };
}
