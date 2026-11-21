"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { getMomentInviteToken } from "@/app/actions";
import { closeMomentVoting } from "@/app/moment-actions";

type MomentPlan = {
  id: string;
  position: number;
  title: string;
  category: string;
  neighborhood: string | null;
  budget_label: string | null;
  short_insight: string | null;
  description: string | null;
  vote_count: number;
};
type Participant = { id: string; nickname: string };
type Moment = {
  id: string;
  title: string;
  status: "draft" | "ready" | "voting" | "completed" | "expired";
  expires_at: string;
  created_at: string;
  vibe_name: string;
  is_host: boolean;
  has_voted: boolean;
  participant_count: number;
  plan_count: number;
  participants: Participant[];
  plans: MomentPlan[];
};

const avatarPalettes = [
  ["#DCEBFF", "#1556A0"],
  ["#FCE5D5", "#9A481B"],
  ["#E9DDFB", "#6536A0"],
  ["#D9F2E6", "#176B48"],
  ["#FCE7F3", "#9D174D"],
  ["#FEF3C7", "#92400E"],
];

function initials(nickname: string) {
  const parts = nickname.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

function getStatus(moment: Moment) {
  if (moment.expires_at && new Date(moment.expires_at).getTime() <= Date.now() && moment.status !== "completed") return "Expired";
  if (moment.status === "completed") return "Voting closed";
  if (moment.status === "expired") return "Expired";
  return "Voting open";
}

export default function MomentDetail({ moment }: { moment: Moment }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const status = getStatus(moment);
  const isOpen = status === "Voting open";
  const maxVotes = Math.max(1, ...moment.plans.map((plan) => plan.vote_count));

  async function handleShare() {
    setError(null);
    setFeedback(null);
    const result = await getMomentInviteToken(moment.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const url = `${window.location.origin}/m/${result.inviteToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Invitation link copied. Your crew is one tap away.");
    } catch {
      setError("Couldn't copy the invitation link. Please try again.");
    }
  }

  function handleCloseVoting() {
    setError(null);
    startTransition(async () => {
      const result = await closeMomentVoting(moment.id);
      if (!result.ok) setError(result.error);
      else window.location.reload();
    });
  }

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">P</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">Pepsi <span className="text-[#005CB4]">Moments</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">MIAMI, FL</span>
      </header>

      <section className="mx-auto w-full flex-1 py-7">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#005CB4] hover:underline">
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>

        <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-[#071B3A] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
          <div aria-hidden="true" className="absolute -right-20 -top-28 size-72 rounded-full border-[38px] border-white/[0.06]" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-20 size-72 rounded-full bg-[#0878C9]/25 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">{moment.vibe_name}</p>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">{status}</span>
            </div>
            <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#72C5FF]">A moment with your crew</p>
            <h1 className="mt-2 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">{moment.title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-blue-100/80">
              {moment.is_host ? "Bring your crew together. Your next great memory starts here." : "You're part of this Moment. See what your crew is vibing with."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-blue-100/75">
              <span>Miami, FL</span><span aria-hidden="true">·</span><span>{moment.vibe_name}</span>
            </div>
            {moment.is_host && isOpen ? (
              <button type="button" onClick={handleCloseVoting} disabled={isPending} className="mt-6 rounded-full border border-white/25 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
                {isPending ? "Closing voting..." : "Close voting"}
              </button>
            ) : null}
          </div>
        </section>

        {moment.is_host ? (
          <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">Make it happen</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Bring your crew together.</h2>
                <p className="mt-1 text-sm text-slate-500">Share the invite so everyone can be part of the decision.</p>
              </div>
              <button type="button" onClick={handleShare} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#005CB4] px-6 text-sm font-extrabold text-white transition hover:bg-[#004A91]">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy invitation link
              </button>
            </div>
            {feedback ? <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{feedback}</p> : null}
          </section>
        ) : (
          <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">You're in</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Your votes are part of the story.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Here's how the group is shaping this Moment together.</p>
          </section>
        )}

        {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">The people</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Your crew</h2>
            </div>
            <p className="text-xs font-semibold text-slate-500">{moment.participant_count} {moment.participant_count === 1 ? "person" : "people"} joined</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {moment.participants.map((participant, index) => {
              const [background, foreground] = avatarPalettes[index % avatarPalettes.length];
              return (
                <div key={participant.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm" title={participant.nickname}>
                  <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full text-xs font-black" style={{ backgroundColor: background, color: foreground }}>
                    {initials(participant.nickname)}
                  </span>
                  <span className="max-w-28 truncate text-xs font-bold text-slate-700">{participant.nickname}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">The lineup</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{isOpen ? "What's winning?" : "The final results"}</h2>
            <p className="mt-1 text-sm text-slate-500">{isOpen ? "See which experiences are winning your crew over." : "Here's how your crew voted."}</p>
          </div>
          <div className="space-y-5">
            {moment.plans.map((plan) => {
              const percentage = Math.round((plan.vote_count / maxVotes) * 100);
              return (
                <article key={plan.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-[#005CB4]">{String(plan.position).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#005CB4]">{plan.category}</p>
                      <h3 className="mt-1 text-base font-extrabold leading-6 text-slate-950">{plan.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black tabular-nums text-slate-950">{plan.vote_count}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{plan.vote_count === 1 ? "vote" : "votes"}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${plan.vote_count} votes, ${percentage}% of the leading plan's votes`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[#005CB4] to-[#20A7E8] transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                  {plan.short_insight ? <p className="mt-3 text-sm leading-6 text-slate-500">{plan.short_insight}</p> : null}
                </article>
              );
            })}
          </div>
        </section>

        {moment.is_host && isOpen && !moment.has_voted ? (
          <div className="mt-7">
            <Link href={`/moment/${moment.id}/vote`} className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#005CB4] bg-white px-6 text-sm font-extrabold text-[#005CB4] transition hover:bg-blue-50">Add my votes</Link>
          </div>
        ) : null}
      </section>

      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}
