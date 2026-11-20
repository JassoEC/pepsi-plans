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
};
type Moment = {
  id: string;
  title: string;
  status: "draft" | "ready" | "voting" | "completed" | "expired";
  expires_at: string;
  created_at: string;
  vibe_name: string;
  is_host: boolean;
  participant_count: number;
  plan_count: number;
  plans: MomentPlan[];
};

function getStatus(moment: Moment) {
  if (moment.expires_at && new Date(moment.expires_at).getTime() <= Date.now() && moment.status !== "completed") return "Expired";
  if (moment.status === "completed") return "Voting completed";
  if (moment.status === "expired") return "Expired";
  return "Voting is open";
}

export default function MomentDetail({ moment }: { moment: Moment }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isOpen = getStatus(moment) === "Voting is open";

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
      setFeedback("Couldn't copy the invitation link. Please try again.");
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
    <main className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">P</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">Pepsi <span className="text-[#005CB4]">Moments</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">MIAMI, FL</span>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#005CB4] hover:underline">
          <span aria-hidden="true">←</span> Back to dashboard
        </Link>

        <div className="mt-5 overflow-hidden rounded-3xl bg-[#071B3A] p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">{moment.vibe_name}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">{getStatus(moment)}</span>
              {moment.is_host && isOpen ? (
                <button type="button" onClick={handleCloseVoting} disabled={isPending} className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50">
                  {isPending ? "Closing..." : "Close voting"}
                </button>
              ) : null}
            </div>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{moment.title}</h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
            <span>{moment.participant_count} {moment.participant_count === 1 ? "person" : "people"}</span>
            <span>{moment.plan_count} plans</span>
            <span>Expires {new Date(moment.expires_at).toLocaleString()}</span>
          </div>
          {moment.is_host ? <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-200">You're hosting this Moment</p> : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {isOpen ? (
            <Link href={`/moment/${moment.id}/vote`} className="rounded-full bg-[#005CB4] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#004A91]">Add my votes</Link>
          ) : null}
          {moment.is_host ? (
            <button type="button" onClick={handleShare} className="rounded-full border border-[#005CB4] bg-white px-6 py-3 text-sm font-extrabold text-[#005CB4] transition hover:bg-blue-50">Copy invitation link</button>
          ) : null}
        </div>
        {feedback ? <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{feedback}</p> : null}
        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">The shortlist</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Plans in this Moment</h2>
          </div>
          <div className="space-y-3">
            {moment.plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#005CB4]">{plan.position}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#005CB4]">{plan.category}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-950">{plan.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}</p>
                    {plan.short_insight ? <p className="mt-3 text-sm leading-6 text-slate-600">{plan.short_insight}</p> : null}
                    {plan.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{plan.description}</p> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}
