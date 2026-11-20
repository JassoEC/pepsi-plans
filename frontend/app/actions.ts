"use server";

import { z } from "zod";

import { getActivePlansPageByVibe } from "@/lib/catalog/plans";

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
