"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerGuest } from "@/app/guest-actions";
import type { GuestDashboard, GuestRoom } from "@/lib/guest-identity";

type Props = { dashboard: GuestDashboard | null };

const statusCopy: Record<GuestRoom["status"], string> = {
  draft: "Open",
  ready: "Open",
  voting: "Open",
  completed: "Completed",
  expired: "Expired",
};

export default function GuestHome({ dashboard }: Props) {
  const [nickname, setNickname] = useState(dashboard?.user.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
      <div className="mt-10 space-y-9">
        {dashboard.hosted.length > 0 ? (
          <RoomSection title="Your Moments" rooms={dashboard.hosted} />
        ) : null}
        {dashboard.joined.length > 0 ? (
          <RoomSection title="Moments you've joined" rooms={dashboard.joined} />
        ) : null}
      </div>
    </section>
  );
}

function RoomSection({ title, rooms }: { title: string; rooms: GuestRoom[] }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-4 text-xl font-black text-slate-950">{title}</h2>
      <div className="space-y-3">
        {rooms.map((room) => (
          <Link
            key={room.id}
            href={`/moment/${room.id}`}
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005CB4] focus-visible:ring-offset-2 active:translate-y-0"
            aria-label={`Open ${room.title}, ${statusCopy[room.status]} Moment`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#005CB4]">{room.vibe_name}</p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-950 transition group-hover:text-[#005CB4]">{room.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{room.participant_count} participants · {room.plan_count} plans</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{statusCopy[room.status]}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400">{new Date(room.created_at).toLocaleDateString()}</p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#005CB4]">
                Open Moment
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
