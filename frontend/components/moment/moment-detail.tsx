"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { getMomentInviteToken } from "@/app/actions";
import { closeMomentVoting, startMomentVoting, submitMomentVote } from "@/app/moment-actions";

type VoteAction = "like" | "dislike" | "boost";
type MomentPlan = {
  id: string;
  position: number;
  title: string;
  category: string;
  neighborhood: string | null;
  budget_label: string | null;
  image_key: string | null;
  short_insight: string | null;
  description: string | null;
  my_vote: VoteAction | null;
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
  my_vote_count: number;
  has_voted: boolean;
  my_boost_used: boolean;
  plans: MomentPlan[];
};

const statusLabels: Record<Moment["status"], string> = {
  draft: "Getting ready",
  ready: "Ready to vote",
  voting: "Voting is open",
  completed: "Voting completed",
  expired: "Expired",
};

export default function MomentDetail({ moment }: { moment: Moment }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function handleStartVoting() {
    setError(null);
    startTransition(async () => {
      const result = await startMomentVoting(moment.id);
      if (!result.ok) setError(result.error);
      else window.location.reload();
    });
  }

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

  function handleCloseVoting() {
    setError(null);
    startTransition(async () => {
      const result = await closeMomentVoting(moment.id);
      if (!result.ok) setError(result.error);
      else window.location.reload();
    });
  }

  const canVote = moment.status === "voting" && !moment.has_voted;

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
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">{statusLabels[moment.status]}</span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{moment.title}</h1>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-blue-100">
            <span>{moment.participant_count} {moment.participant_count === 1 ? "person" : "people"}</span>
            <span>{moment.plan_count} plans</span>
            <span>Expires {new Date(moment.expires_at).toLocaleString()}</span>
          </div>
          {moment.is_host ? <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-200">You're hosting this Moment</p> : null}
        </div>

        {moment.status === "draft" || moment.status === "ready" ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <h2 className="text-lg font-extrabold text-slate-950">Your Moment is ready to bring everyone together.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Share the invitation first, then start voting when your friends are ready. You’ll vote too.</p>
            {moment.is_host ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleStartVoting} disabled={isPending} className="rounded-full bg-[#005CB4] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#004A91] disabled:opacity-50">
                  {isPending ? "Starting..." : "Start voting"}
                </button>
                <button type="button" onClick={handleShare} className="rounded-full border border-[#005CB4] bg-white px-6 py-3 text-sm font-extrabold text-[#005CB4] transition hover:bg-blue-50">Share invitation</button>
              </div>
            ) : <p className="mt-3 text-sm text-slate-600">The host will open voting when everyone is ready.</p>}
          </div>
        ) : null}

        {moment.status === "voting" ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            {moment.has_voted ? (
              <>
                <h2 className="text-lg font-extrabold text-slate-950">You're all set.</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">You've voted on all {moment.plan_count} plans. {moment.is_host ? "Share the invitation so your friends can finish voting too." : "Your votes are saved. You can come back to see the group's outcome."}</p>
                {moment.is_host ? <button type="button" onClick={handleShare} className="mt-4 rounded-full bg-[#005CB4] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#004A91]">Copy invitation link</button> : null}
              </>
            ) : (
              <>
                <h2 className="text-lg font-extrabold text-slate-950">What would you like to do?</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Vote on each plan. Your choices help the group find the plan everyone is excited about.</p>
                <p className="mt-3 text-xs font-bold text-[#005CB4]">{moment.my_vote_count} of {moment.plan_count} votes submitted</p>
              </>
            )}
          </div>
        ) : null}

        {moment.status === "completed" ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <h2 className="text-lg font-extrabold text-slate-950">Voting is closed.</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">The group has finished voting on this Moment.</p>
            {moment.is_host ? <button type="button" onClick={handleShare} className="mt-4 rounded-full bg-[#005CB4] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#004A91]">Share this Moment</button> : null}
          </div>
        ) : null}

        {moment.status === "expired" ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This Moment has expired.</div>
        ) : null}

        {feedback ? <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{feedback}</p> : null}

        {error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">The shortlist</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Plans in this Moment</h2>
            </div>
            {canVote ? <span className="text-xs font-bold text-slate-500">{moment.my_vote_count}/{moment.plan_count} voted</span> : null}
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
        </div>

        {moment.is_host && moment.status === "voting" ? (
          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">Ready to wrap things up? You can close voting once everyone has had a chance.</p>
            <button type="button" onClick={handleCloseVoting} disabled={isPending} className="mt-3 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:border-slate-500 disabled:opacity-50">{isPending ? "Closing..." : "Close voting"}</button>
          </div>
        ) : null}
      </section>

      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}
