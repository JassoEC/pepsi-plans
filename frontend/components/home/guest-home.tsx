"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerGuest } from "@/app/guest-actions";
import { getMomentInviteToken } from "@/app/actions";
import type { GuestDashboard, GuestRoom } from "@/lib/guest-identity";

type Props = { dashboard: GuestDashboard | null };

const statusCopy: Record<GuestRoom["status"], string> = {
  draft: "Draft",
  ready: "Waiting",
  voting: "Voting",
  completed: "Completed",
  expired: "Expired",
};

export default function GuestHome({ dashboard }: Props) {
  const [nickname, setNickname] = useState(dashboard?.user.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [sharingRoomId, setSharingRoomId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerGuest(nickname);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!dashboard) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#005CB4] text-2xl font-black italic text-white">P</span>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-[#005CB4]">Pepsi Moments</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Make this moment yours.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Pick a name your friends will recognize. No account or password needed.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <label htmlFor="nickname" className="text-sm font-bold text-slate-800">Your nickname</label>
          <input id="nickname" name="nickname" autoComplete="nickname" maxLength={32} required value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="e.g. Alex" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-[#005CB4] focus:ring-2 focus:ring-blue-100" />
          {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={isPending || !nickname.trim()} className="mt-5 w-full rounded-full bg-[#005CB4] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#004A91] disabled:cursor-wait disabled:opacity-50">{isPending ? "Saving..." : "Continue"}</button>
          <p className="mt-4 text-center text-xs text-slate-400">Your nickname is visible to people in your rooms.</p>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#005CB4]">Your space</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Hey, {dashboard.user.name}.</h1>
          <p className="mt-2 text-sm text-slate-500">Bring your people together and make something happen.</p>
        </div>
        <Link href="/create" className="inline-flex items-center justify-center rounded-full bg-[#005CB4] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#004A91]">+ Create a Moment</Link>
      </div>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <RoomSection title="Your Moments" rooms={dashboard.hosted} empty="No Moments yet. Bring your friends together and make one happen." onShare={async (roomId) => { setSharingRoomId(roomId); setShareMessage(null); const result = await getMomentInviteToken(roomId); if (!result.ok) { setShareMessage(result.error); setSharingRoomId(null); return; } const url = `${window.location.origin}/m/${result.inviteToken}`; try { await navigator.clipboard.writeText(url); setShareMessage("Invitation link copied."); } catch { setShareMessage(url); } setSharingRoomId(null); }} sharingRoomId={sharingRoomId} shareMessage={shareMessage} />
        <RoomSection title="Moments you have joined" rooms={dashboard.joined} empty="No invitations yet. When you join a friends Moment, you will find it here." />
      </div>
    </section>
  );
}

function RoomSection({ title, rooms, empty, onShare, sharingRoomId, shareMessage }: { title: string; rooms: GuestRoom[]; empty: string; onShare?: (roomId: string) => void; sharingRoomId?: string | null; shareMessage?: string | null }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#005CB4]">{rooms.length}</span>
      </div>
      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">{empty}</div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <article key={room.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{room.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#005CB4]">{room.vibe_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{room.participant_count} participants · {room.plan_count} plans</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{statusCopy[room.status]}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-400">{new Date(room.created_at).toLocaleDateString()}</p>
                {onShare ? <button type="button" onClick={() => onShare(room.id)} disabled={sharingRoomId === room.id} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-[#005CB4] transition hover:border-[#005CB4] disabled:opacity-50">{sharingRoomId === room.id ? "Preparing link..." : "Copy invitation"}</button> : null}
              </div>
              {shareMessage && onShare && sharingRoomId === null ? <p className="mt-2 break-all text-xs text-emerald-700" role="status">{shareMessage}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
