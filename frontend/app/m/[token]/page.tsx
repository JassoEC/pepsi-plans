import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import MomentInvite from "@/components/moment/moment-invite";
import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) notFound();

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value ?? null;
  const supabase = await createSupabaseServerClient();
  const { data: dashboard } = guestToken
    ? await supabase.rpc("get_guest_dashboard", { p_token: guestToken })
    : { data: null };
  const hasIdentity = Boolean(dashboard);

  const { data, error } = await supabase.rpc("get_guest_moment_by_invite_token", {
    p_invite_token: token,
    p_guest_token: guestToken,
  });

  if (error || !data) notFound();

  return <MomentInvite invite={data} inviteToken={token} hasIdentity={hasIdentity} />;
}
