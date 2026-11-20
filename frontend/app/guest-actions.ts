"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GUEST_COOKIE } from "@/lib/guest-identity";

const nicknameSchema = z.string().trim().min(1).max(32);

export async function registerGuest(name: string) {
  const parsed = nicknameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false as const, error: "Choose a nickname between 1 and 32 characters." };
  }

  const cookieStore = await cookies();
  const existingToken = cookieStore.get(GUEST_COOKIE)?.value;
  const token = existingToken ?? randomBytes(32).toString("hex");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("register_guest_identity", {
    p_token: token,
    p_name: parsed.data,
  });

  if (error || !data) {
    return { ok: false as const, error: "We couldn't save your identity. Please try again." };
  }

  cookieStore.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true as const };
}
