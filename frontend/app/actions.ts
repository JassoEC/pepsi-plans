"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActivePlansPageByVibe } from "@/lib/catalog/plans";
import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getMorePlansSchema = z.object({
  vibeId: z.string().uuid(),
  offset: z.number().int().min(0).max(10_000),
});

export async function getMorePlans(vibeId: string, offset: number) {
  const parsed = getMorePlansSchema.safeParse({ vibeId, offset });

  if (!parsed.success) {
    throw new Error("Invalid plan discovery request.");
  }

  return getActivePlansPageByVibe(parsed.data.vibeId, parsed.data.offset);
}


const createMomentSchema = z.object({
  vibeId: z.string().uuid(),
  planIds: z.array(z.string().uuid()).min(2).max(10),
  title: z.string().trim().min(3).max(60),
  expiresAt: z.string().datetime({ offset: true }),
}).refine(({ planIds }) => new Set(planIds).size === planIds.length, {
  message: "Selected plans must be unique.",
  path: ["planIds"],
});

export async function createMoment(
  vibeId: string,
  planIds: string[],
  title: string,
  expiresAt: string,
) {
  const parsed = createMomentSchema.safeParse({ vibeId, planIds, title, expiresAt });
  if (!parsed.success) {
    return { ok: false as const, error: "Choose between 2 and 10 different plans before creating your Moment." };
  }

  const expiry = new Date(parsed.data.expiresAt).getTime();
  const now = Date.now();
  if (expiry <= now || expiry > now + 24 * 60 * 60 * 1000 + 60_000) {
    return { ok: false as const, error: "The Moment expiration must be within the next 24 hours." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) {
    return { ok: false as const, error: "Create a nickname on the home page before creating a Moment." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_guest_moment", {
    p_token: token,
    p_vibe_id: parsed.data.vibeId,
    p_plan_ids: parsed.data.planIds,
    p_title: parsed.data.title,
    p_expires_at: parsed.data.expiresAt,
  });

  if (error || typeof data !== "string") {
    return { ok: false as const, error: "We couldn't create your Moment. Please check your selection and try again." };
  }

  revalidatePath("/");
  return { ok: true as const, roomId: data };
}
