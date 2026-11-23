"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerGuest } from "@/app/guest-actions";
import PepsiLogo from "@/components/brand/pepsi-logo";
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
        <div className="relative mb-8 overflow-hidden rounded-[2rem] bg-[#071B3A] px-7 py-8 text-center text-white shadow-[0_24px_60px_-30px_rgba(0,42,92,0.55)]">
          <span aria-hidden="true" className="absolute -right-12 -top-16 size-44 rounded-full border-[22px] border-[#005CB4]/50" />
          <span aria-hidden="true" className="absolute -bottom-12 -left-10 size-36 rounded-full bg-[#E31B54]/90 blur-2xl" />
          <div className="relative">
            <PepsiLogo size={58} className="mx-auto drop-shadow-lg" />
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.22em] text-[#8FC8FF]">Pepsi Moments</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight">Make this moment yours.</h1>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-blue-100/80">Bring your people together. Find a plan. Make it happen.</p>
          </div>
          <span aria-hidden="true" className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#E31B54] via-white to-[#005CB4]" />
        </div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_45px_-32px_rgba(15,35,65,0.35)] backdrop-blur sm:p-7">
          <label htmlFor="nickname" className="text-sm font-bold text-slate-800">Your nickname</label>
          <input id="nickname" name="nickname" autoComplete="nickname" maxLength={32} required value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="e.g. Alex" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-[#005CB4] focus:ring-4 focus:ring-blue-100" />
          {error ? <p role="alert" className="mt-2 text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={isPending || !nickname.trim()} className="mt-5 w-full rounded-full bg-[#005CB4] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(0,92,180,0.7)] transition hover:bg-[#004A91] hover:shadow-[0_12px_24px_-8px_rgba(0,92,180,0.65)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-50">{isPending ? "Saving..." : "Continue"}</button>
          <p className="mt-4 text-center text-xs text-slate-400">Your nickname is visible to people in your rooms.</p>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl flex-1 py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#071B3A] px-6 py-8 text-white shadow-[0_24px_60px_-32px_rgba(0,42,92,0.55)] sm:px-9 sm:py-10">
        <span aria-hidden="true" className="absolute -right-10 -top-20 size-56 rounded-full border-[28px] border-[#005CB4]/50" />
        <span aria-hidden="true" className="absolute -bottom-16 right-24 size-40 rounded-full bg-[#E31B54]/70 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <PepsiLogo size={30} />
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#8FC8FF]">Your space</p>
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Hey, {dashboard.user.name}.</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100/80">Bring your people together and make something happen.</p>
          </div>
          <Link href="/create" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#005CB4] shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40">+ Create a Moment</Link>
        </div>
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#E31B54] via-white to-[#005CB4]" />
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
            className="group block rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005CB4] focus-visible:ring-offset-2 active:translate-y-0"
            aria-label={`Open ${room.title}, ${statusCopy[room.status]} Moment`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-slate-950 transition group-hover:text-[#005CB4]">{room.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{room.participant_count} participants · {room.plan_count} plans</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">{statusCopy[room.status]}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
