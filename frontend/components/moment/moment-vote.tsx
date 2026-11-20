"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { submitMomentVote } from "@/app/moment-actions";

type VoteAction = "like" | "dislike" | "boost";
type Plan = {
  id: string;
  position: number;
  title: string;
  category: string;
  neighborhood: string | null;
  budget_label: string | null;
  short_insight: string | null;
  description: string | null;
  my_vote: VoteAction | null;
};
type Moment = {
  id: string;
  title: string;
  status: "draft" | "ready" | "voting" | "completed" | "expired";
  expires_at: string;
  vibe_name: string;
  my_vote_count: number;
  plan_count: number;
  has_voted: boolean;
  my_boost_used: boolean;
  plans: Plan[];
};

export default function MomentVote({ moment }: { moment: Moment }) {
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isOpen = moment.status === "draft" || moment.status === "ready" || moment.status === "voting";
  const canVote = isOpen;

  function handleVote(planId: string, action: VoteAction) {
    setError(null);
    setPendingPlanId(planId);
    startTransition(async () => {
      const result = await submitMomentVote(moment.id, planId, action);
      setPendingPlanId(null);
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

      <section className="flex-1 py-8">
        <Link href={`/moment/${moment.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#005CB4] hover:underline">
          <span aria-hidden="true">←</span> Back to Moment
        </Link>

        <div className="mt-5 rounded-3xl bg-[#071B3A] p-6 text-white sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-200">{moment.vibe_name}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Add your votes</h1>
          <p className="mt-2 text-lg font-bold text-blue-100">{moment.title}</p>
          <p className="mt-4 text-sm text-blue-100">{moment.my_vote_count} of {moment.plan_count} plans rated</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${moment.plan_count ? (moment.my_vote_count / moment.plan_count) * 100 : 0}%` }} />
          </div>
        </div>

        {!isOpen ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold text-slate-950">{moment.status === "expired" ? "This Moment has expired." : "Voting is closed."}</h2>
            <p className="mt-1 text-sm text-slate-600">You can review your saved votes, but no more votes can be submitted.</p>
          </div>
        ) : moment.has_voted ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="font-extrabold text-slate-950">You're all caught up.</h2>
            <p className="mt-1 text-sm text-slate-600">Your votes are saved. You can come back while this Moment is open to see the shortlist and your choices.</p>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-600">Rate each plan based on how excited you are to experience it. Your votes are saved as you go.</p>
        )}

        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 space-y-3">
          {moment.plans.map((plan) => (
            <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#005CB4]">{plan.position}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#005CB4]">{plan.category}</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-950">{plan.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}</p>
                  {plan.short_insight ? <p className="mt-3 text-sm leading-6 text-slate-600">{plan.short_insight}</p> : null}
                  {plan.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{plan.description}</p> : null}
                  {plan.my_vote ? <p className="mt-3 text-xs font-bold text-emerald-700">Your vote: {plan.my_vote === "boost" ? "Pepsi Boost" : plan.my_vote === "like" ? "Like" : "Dislike"}</p> : null}
                  {canVote && !plan.my_vote ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={isPending} onClick={() => handleVote(plan.id, "dislike")} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:border-slate-400 disabled:opacity-50">{pendingPlanId === plan.id ? "Saving..." : "Not for me"}</button>
                      <button type="button" disabled={isPending} onClick={() => handleVote(plan.id, "like")} className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-[#005CB4] hover:bg-blue-100 disabled:opacity-50">I like it</button>
                      <button type="button" disabled={isPending || moment.my_boost_used} onClick={() => handleVote(plan.id, "boost")} className="rounded-full bg-[#005CB4] px-4 py-2 text-xs font-bold text-white hover:bg-[#004A91] disabled:opacity-40">⚡ {moment.my_boost_used ? "Boost used" : "Boost this plan"}</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}
