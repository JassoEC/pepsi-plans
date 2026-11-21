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

function initial(nickname: string) {
  return nickname.trim().charAt(0).toUpperCase() || "?";
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
      setFeedback("Invitation link copied.");
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
        <Link href="/" className="text-sm font-bold text-[#005CB4] hover:underline">Dashboard</Link>
      </header>

      <section className="mx-auto w-full flex-1 py-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#071B3A] px-6 py-9 text-center text-white shadow-xl shadow-blue-950/10 sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-20 -top-28 size-72 rounded-full border-[38px] border-white/[0.06]" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-20 size-72 rounded-full bg-[#0878C9]/25 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-200">{moment.vibe_name}</span>
              <span className="size-1 rounded-full bg-blue-300/60" />
              <span className="text-[10px] font-bold text-blue-100/70">{status}</span>
            </div>

            <h1 className="mx-auto mt-5 max-w-2xl break-words text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              {moment.title}
            </h1>

            <div className="mt-7 flex items-center justify-center" aria-label={`${moment.participant_count} participants`}>
              <div className="flex -space-x-3">
                {moment.participants.map((participant, index) => {
                  const [background, foreground] = avatarPalettes[index % avatarPalettes.length];
                  return (
                    <span
                      key={participant.id}
                      aria-label={`Participant ${index + 1}`}
                      className="flex size-10 items-center justify-center rounded-full border-[3px] border-[#071B3A] text-sm font-black shadow-sm sm:size-11"
                      style={{ backgroundColor: background, color: foreground }}
                    >
                      {initial(participant.nickname)}
                    </span>
                  );
                })}
              </div>
            </div>

            {moment.is_host && isOpen ? (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={handleShare} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-extrabold text-[#005CB4] transition hover:bg-blue-50">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy invite
                </button>
                <button type="button" onClick={handleCloseVoting} disabled={isPending} className="min-h-11 rounded-full border border-white/25 px-5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
                  {isPending ? "Closing..." : "Close voting"}
                </button>
              </div>
            ) : null}
            {feedback ? <p role="status" className="mt-3 text-xs font-semibold text-emerald-300">{feedback}</p> : null}
          </div>
        </section>

        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">{isOpen ? "Crew favorites" : "Final results"}</h2>
            <span className="text-xs font-semibold text-slate-500">{moment.plans.length} plans</span>
          </div>
          <div className="space-y-3">
            {moment.plans.map((plan) => {
              const percentage = Math.round((plan.vote_count / maxVotes) * 100);
              return (
                <article key={plan.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-[#005CB4]">{String(plan.position).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold leading-6 text-slate-950">{plan.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black tabular-nums text-slate-950">{plan.vote_count}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{plan.vote_count === 1 ? "vote" : "votes"}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${plan.vote_count} votes, ${percentage}% of the leading plan's votes`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[#005CB4] to-[#20A7E8] transition-all duration-500" style={{ width: `${percentage}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {moment.is_host && isOpen && !moment.has_voted ? (
          <Link href={`/moment/${moment.id}/vote`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#005CB4] px-6 text-sm font-extrabold text-white transition hover:bg-[#004A91]">Add my votes</Link>
        ) : null}
      </section>
    </main>
  );
}
