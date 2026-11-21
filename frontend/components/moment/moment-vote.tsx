"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type PointerEvent } from "react";

import { submitMomentVote } from "@/app/moment-actions";

type VoteAction = "like" | "dislike" | "boost";
type Plan = {
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
  vibe_name: string;
  my_vote_count: number;
  plan_count: number;
  has_voted: boolean;
  my_boost_used: boolean;
  plans: Plan[];
};

const categoryStyles: Record<string, { eyebrow: string; mark: string; gradient: string }> = {
  outdoors: { eyebrow: "OUT IN THE OPEN", mark: "↗", gradient: "from-emerald-950 via-teal-800 to-cyan-600" },
  food: { eyebrow: "GOOD TASTE, GOOD COMPANY", mark: "✳", gradient: "from-orange-950 via-rose-800 to-amber-500" },
  culture: { eyebrow: "A LITTLE INSPIRATION", mark: "✦", gradient: "from-violet-950 via-indigo-800 to-sky-600" },
  nightlife: { eyebrow: "AFTER HOURS", mark: "✧", gradient: "from-slate-950 via-indigo-950 to-fuchsia-700" },
  entertainment: { eyebrow: "LET'S HAVE SOME FUN", mark: "★", gradient: "from-blue-950 via-blue-800 to-cyan-500" },
};

function getCategoryStyle(category: string) {
  return categoryStyles[category.toLowerCase()] ?? {
    eyebrow: "A MOMENT TO REMEMBER",
    mark: "✦",
    gradient: "from-[#061A36] via-[#07569B] to-[#12A6D6]",
  };
}

function getImageUrl(imageKey: string | null) {
  if (!imageKey) return null;
  try {
    const url = new URL(imageKey);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function MomentVote({ moment }: { moment: Moment }) {
  const [plans, setPlans] = useState(moment.plans);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnrated = moment.plans.findIndex((plan) => !plan.my_vote);
    return firstUnrated === -1 ? 0 : firstUnrated;
  });
  const [boostUsed, setBoostUsed] = useState(moment.my_boost_used);
  const [error, setError] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isPending, startTransition] = useTransition();
  const pointerStartX = useRef<number | null>(null);

  const isOpen = moment.status === "draft" || moment.status === "ready" || moment.status === "voting";
  const ratedCount = plans.filter((plan) => plan.my_vote !== null).length;
  const allRated = plans.length > 0 && ratedCount === plans.length;
  const currentPlan = plans[currentIndex] ?? null;
  const progress = plans.length ? (ratedCount / plans.length) * 100 : 0;

  function handleVote(planId: string, action: VoteAction) {
    if (!isOpen || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await submitMomentVote(moment.id, planId, action);
      if (!result.ok) {
        setSwipeOffset(0);
        setError(result.error);
        return;
      }

      setPlans((current) =>
        current.map((plan) => plan.id === planId ? { ...plan, my_vote: action } : plan),
      );
      if (action === "boost") setBoostUsed(true);
      setSwipeOffset(0);

      const nextIndex = plans.findIndex(
        (plan, index) => index > currentIndex && plan.id !== planId && !plan.my_vote,
      );
      const earlierUnrated = plans.findIndex(
        (plan, index) => index < currentIndex && plan.id !== planId && !plan.my_vote,
      );
      if (nextIndex !== -1) setCurrentIndex(nextIndex);
      else if (earlierUnrated !== -1) setCurrentIndex(earlierUnrated);
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (currentPlan?.my_vote) return;
    pointerStartX.current = event.clientX;
    setSwipeOffset(0);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    setSwipeOffset(Math.max(-180, Math.min(180, distance)));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerStartX.current === null || !currentPlan || !isOpen || currentPlan.my_vote || isPending) {
      pointerStartX.current = null;
      return;
    }

    const distance = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 75) {
      setSwipeOffset(0);
      return;
    }

    setSwipeOffset(distance > 0 ? 420 : -420);
    handleVote(currentPlan.id, distance > 0 ? "like" : "dislike");
  }

  function moveToPlan(direction: -1 | 1) {
    const next = Math.min(Math.max(currentIndex + direction, 0), plans.length - 1);
    setCurrentIndex(next);
    setError(null);
  }

  return (
    <main className="relative mx-auto flex min-h-[100svh] w-full max-w-xl flex-1 flex-col overflow-hidden bg-[#F4F7FB] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">P</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">Pepsi <span className="text-[#005CB4]">Moments</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-slate-500">THE LINEUP</span>
      </header>

      <section className="flex flex-1 flex-col pt-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">{moment.vibe_name}</p>
            <h1 className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">{moment.title}</h1>
          </div>
          <p className="shrink-0 text-xs font-bold tabular-nums text-slate-500">{ratedCount} <span className="font-medium text-slate-400">/ {plans.length}</span></p>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label="Voting progress"
          aria-valuemin={0}
          aria-valuemax={plans.length}
          aria-valuenow={ratedCount}
        >
          <div className="h-full rounded-full bg-[#0878C9] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {!isOpen ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold text-slate-950">{moment.status === "expired" ? "This Moment has expired." : "Voting is closed."}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">You can look through the plans and review the votes you saved, but no more votes can be submitted.</p>
          </div>
        ) : null}

        {plans.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-black text-slate-950">No plans to show</h2>
            <p className="mt-2 text-sm text-slate-500">This Moment doesn't have any plans to vote on.</p>
          </div>
        ) : allRated ? (
          <div className="mt-8 rounded-[2rem] bg-[#071B3A] px-6 py-10 text-center text-white shadow-xl shadow-blue-950/10">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl">✦</div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#72C5FF]">That's a wrap</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">You've made your picks.</h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-blue-100/75">Your votes are in. The group is one step closer to making this Moment happen.</p>
            <div className="mt-7 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-left">
              <div className="flex justify-between text-sm"><span className="text-blue-100/70">Plans rated</span><strong>{ratedCount} / {plans.length}</strong></div>
              <div className="mt-3 flex justify-between text-sm"><span className="text-blue-100/70">Pepsi Boost</span><strong>{boostUsed ? "Used ⚡" : "Not used"}</strong></div>
            </div>
            <Link href={`/moment/${moment.id}`} className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-extrabold text-[#005CB4] transition hover:bg-blue-50">Back to Moment</Link>
          </div>
        ) : currentPlan ? (
          <>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Swipe to decide</span>
              <span className="text-xs font-bold tabular-nums text-slate-500">{currentIndex + 1} of {plans.length}</span>
            </div>

            <article
              key={currentPlan.id}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { pointerStartX.current = null; setSwipeOffset(0); }}
              style={{ transform: `translate3d(${swipeOffset}px, 0, 0) rotate(${swipeOffset / 24}deg)`, transition: pointerStartX.current === null ? "transform 180ms ease-out" : "none" }}
              className="step-enter relative mt-3 flex min-h-[390px] flex-1 touch-pan-y flex-col overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(7,27,58,0.12)] sm:min-h-[470px]"
              aria-label={`Plan: ${currentPlan.title}`}
            >
              {(() => {
                const imageUrl = getImageUrl(currentPlan.image_key);
                const style = getCategoryStyle(currentPlan.category);
                return (
                  <div className={`relative flex min-h-[235px] flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br ${style.gradient} p-5 sm:min-h-[290px]`}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <>
                        <div aria-hidden="true" className="absolute -right-14 -top-16 size-64 rounded-full border-[32px] border-white/10" />
                        <div aria-hidden="true" className="absolute -bottom-24 -left-10 size-64 rounded-full bg-white/10 blur-2xl" />
                        <span aria-hidden="true" className="absolute right-7 top-1/2 -translate-y-1/2 text-[9rem] font-black leading-none text-white/15">{style.mark}</span>
                      </>
                    )}
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <span className="rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur">{currentPlan.category}</span>
                      {currentPlan.budget_label ? <span className="rounded-full border border-white/25 bg-black/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{currentPlan.budget_label}</span> : null}
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/75">{style.eyebrow}</p>
                      <h2 className="mt-2 max-w-sm text-3xl font-black leading-[1.02] tracking-[-0.04em] text-white drop-shadow sm:text-4xl">{currentPlan.title}</h2>
                      {currentPlan.neighborhood ? <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-white/85"><span aria-hidden="true">⌖</span>{currentPlan.neighborhood}</p> : null}
                    </div>
                  </div>
                );
              })()}

              <div className="p-5 sm:p-6">
                {currentPlan.my_vote ? (
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-700">Already rated · {currentPlan.my_vote === "boost" ? "Pepsi Boost" : currentPlan.my_vote === "like" ? "Liked" : "Passed"}</p>
                ) : null}
                {currentPlan.short_insight ? <p className="text-base font-extrabold leading-6 text-slate-900">{currentPlan.short_insight}</p> : null}
                {currentPlan.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{currentPlan.description}</p> : null}
              </div>
            </article>

            {error ? <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

            {isOpen && !currentPlan.my_vote ? (
              <div className="mt-5">
                <div className="flex items-center justify-center gap-5 sm:gap-7">
                  <button
                    type="button"
                    aria-label="Dislike plan"
                    disabled={isPending}
                    onClick={() => handleVote(currentPlan.id, "dislike")}
                    className="flex size-14 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-500 shadow-lg shadow-rose-950/5 transition hover:-translate-y-1 hover:bg-rose-50 disabled:opacity-50 sm:size-16"
                  >
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12"/></svg>
                  </button>
                  <button
                    type="button"
                    aria-label={boostUsed ? "Pepsi Boost already used" : "Pepsi Boost"}
                    disabled={isPending || boostUsed}
                    onClick={() => handleVote(currentPlan.id, "boost")}
                    className="flex size-12 items-center justify-center rounded-full bg-[#0878C9] text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-1 hover:bg-[#0066B3] disabled:cursor-not-allowed disabled:opacity-40 sm:size-14"
                  >
                    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z"/></svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Like plan"
                    disabled={isPending}
                    onClick={() => handleVote(currentPlan.id, "like")}
                    className="flex size-14 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-500 shadow-lg shadow-emerald-950/5 transition hover:-translate-y-1 hover:bg-emerald-50 disabled:opacity-50 sm:size-16"
                  >
                    <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-center gap-8 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  <span>Pass</span><span className={boostUsed ? "text-slate-300" : "text-[#0878C9]"}>Boost</span><span>Like</span>
                </div>
                <p className="mt-3 text-center text-[11px] text-slate-400">{boostUsed ? "Your Boost has been used. You can still Like or Pass." : "One Pepsi Boost per person. Make it count."}</p>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" onClick={() => moveToPlan(-1)} disabled={currentIndex === 0} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-35">Previous</button>
                <span className="text-xs font-semibold text-slate-400">{currentPlan.my_vote ? "Your vote is saved" : "Reviewing plan"}</span>
                <button type="button" onClick={() => moveToPlan(1)} disabled={currentIndex === plans.length - 1} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-35">Next</button>
              </div>
            )}
          </>
        ) : null}
      </section>

      <footer className="pt-5 text-center text-[10px] font-semibold tracking-wide text-slate-400">GOOD MOMENTS. BETTER TOGETHER.</footer>
    </main>
  );
}
