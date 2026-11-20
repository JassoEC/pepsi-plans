import { notFound } from "next/navigation";
import { cookies } from "next/headers";

import MomentDetail from "@/components/moment/moment-detail";
import { GUEST_COOKIE } from "@/lib/guest-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MomentPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(GUEST_COOKIE)?.value;
  if (!token) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_guest_moment", {
    p_token: token,
    p_room_id: roomId,
  });

  if (error || !data) notFound();

  return <MomentDetail moment={data} />;
}
