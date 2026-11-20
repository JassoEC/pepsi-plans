import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

import MomentVote from "@/components/moment/moment-vote";
import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const instant = false;

export default async function MomentVotePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  if (!z.string().uuid().safeParse(roomId).success) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_guest_moment", {
    p_token: token,
    p_room_id: roomId,
  });

  if (error || !data) notFound();

  return <MomentVote moment={data} />;
}
