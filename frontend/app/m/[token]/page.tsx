import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import MomentInvite from "@/components/moment/moment-invite";

export const instant = false;

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_guest_moment_by_invite_token", {
    p_invite_token: token,
    p_guest_token: null,
  });

  if (error || !data) notFound();

  return <MomentInvite invite={data} inviteToken={token} />;
}
