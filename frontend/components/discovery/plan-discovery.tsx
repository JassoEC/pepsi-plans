"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { createMoment, getMorePlans } from "@/app/actions";
import {
  isPlanSelectionValid,
  MAX_SELECTED_PLANS,
  MIN_SELECTED_PLANS,
  togglePlanSelection,
} from "@/lib/selection/plan-selection";
import type { Plan } from "@/lib/catalog/plans";

type PlanDiscoveryProps = {
  vibeId: string;
  initialPlans: Plan[];
  initialHasMore: boolean;
};

export default function PlanDiscovery({
  vibeId,
  initialPlans,
  initialHasMore,
}: PlanDiscoveryProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [showDeck, setShowDeck] = useState(false);
  const [hasRequestedMore, setHasRequestedMore] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [momentTitle, setMomentTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [isCreating, startCreating] = useTransition();

  const selectedPlans = useMemo(
    () => plans.filter((plan) => selectedPlanIds.includes(plan.id)),
    [plans, selectedPlanIds],
  );
  const selectionIsValid = isPlanSelectionValid(selectedPlanIds);

  useEffect(() => {
    if (!activePlan) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePlan(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activePlan]);

  async function handleGetMoreSuggestions() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const nextPage = await getMorePlans(vibeId, plans.length);
      setPlans((current) => {
        const existingIds = new Set(current.map((plan) => plan.id));
        return [
          ...current,
          ...nextPage.plans.filter((plan) => !existingIds.has(plan.id)),
        ];
      });
      setHasMore(nextPage.hasMore);
      setHasRequestedMore(true);
    } catch {
      setLoadError("We couldn't load more ideas. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleToggle(planId: string) {
    setSelectedPlanIds((current) => togglePlanSelection(current, planId));
    setActivePlan(null);
  }

  function handleCreateMoment() {
    setCreateError(null);
    startCreating(async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const result = await createMoment(vibeId, selectedPlanIds, momentTitle, expiresAt);
      if (!result.ok) {
        setCreateError(result.error);
        return;
      }
      setShareUrl(`${window.location.origin}/m/${result.inviteToken}`);
    });
  }

  async function handleCopyInviteLink() {
    if (!shareUrl) return;

    setCopyError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
      setCopyError("Your browser could not copy the link. Select the URL above and copy it manually.");
    }
  }

  function handleRemoveFromDeck(planId: string) {
    setSelectedPlanIds((current) => {
      if (current.length <= MIN_SELECTED_PLANS) return current;
      return current.filter((id) => id !== planId);
    });
  }

  if (shareUrl) {
    return (
      <section className="rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50 text-3xl text-[#005CB4]" aria-hidden="true">
          ✓
        </div>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">
          Moment created
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {momentTitle.trim()}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          Your Moment is ready. Share this invitation link with your friends.
        </p>
        <div className="mt-7 text-left">
          <label htmlFor="moment-invite-link" className="text-sm font-bold text-slate-800">
            Your invite link
          </label>
          <input
            id="moment-invite-link"
            type="text"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#005CB4] focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={handleCopyInviteLink}
          className="mt-4 w-full rounded-full bg-[#005CB4] px-7 py-4 text-sm font-extrabold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#004A91] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4]"
        >
          {linkCopied ? "Link copied!" : "Copy and share the invitation link"}
        </button>
        <p className="mt-3 min-h-5 text-sm text-emerald-700" role="status" aria-live="polite">
          {linkCopied ? "Your invite link is ready to share." : ""}
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#005CB4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4]"
        >
          <span aria-hidden="true">←</span>
          Back to dashboard
        </Link>
        {copyError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">{copyError}</p>
        ) : null}
      </section>
    );
  }

  if (showDeck) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#005CB4]">
              Selected Plans
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              Your selected plans are ready.
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedPlans.length} plans ready for your group.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeck(false)}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-[#005CB4] hover:text-[#005CB4]"
          >
            Edit selections
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {selectedPlans.map((plan, index) => {
            const canRemove = selectedPlans.length > MIN_SELECTED_PLANS;

            return (
              <div key={plan.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-[#005CB4]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{plan.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFromDeck(plan.id)}
                  disabled={!canRemove}
                  aria-label={canRemove ? `Remove ${plan.title} from your selection` : `At least ${MIN_SELECTED_PLANS} plans are required`}
                  title={canRemove ? "Remove from your selection" : `Keep at least ${MIN_SELECTED_PLANS} plans`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          These are the ideas you want to bring to your group. Create your Moment to save them and invite your friends.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Keep at least {MIN_SELECTED_PLANS} plans selected. You can remove a plan when you've selected more than {MIN_SELECTED_PLANS}.
        </p>
        <div className="mt-5">
          <label htmlFor="moment-title" className="text-sm font-bold text-slate-800">
            Give your Moment a title
          </label>
          <input
            id="moment-title"
            name="momentTitle"
            type="text"
            required
            minLength={3}
            maxLength={60}
            value={momentTitle}
            onChange={(event) => setMomentTitle(event.target.value)}
            placeholder="e.g. Mauricio's birthday"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#005CB4] focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-400">Your Vibe and selected plans will be saved with this Moment.</p>
        </div>
        {createError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            <p>{createError}</p>
            {createError.includes("nickname") ? (
              <Link href="/" className="mt-2 inline-block font-bold underline">Set up your nickname</Link>
            ) : null}
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleCreateMoment}
          disabled={isCreating || !selectionIsValid || momentTitle.trim().length < 3}
          className="mt-5 w-full rounded-full bg-[#005CB4] px-7 py-4 text-sm font-extrabold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#004A91] disabled:cursor-wait disabled:bg-slate-300 disabled:shadow-none"
        >
          {isCreating ? "Creating your Moment..." : "Create Moment"}
        </button>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-bold text-slate-900">No plans in this Vibe yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Try another Vibe to find something for your group.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-bold text-slate-900">Choose your plans</p>
        <p
          className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-extrabold tabular-nums text-[#005CB4]"
          aria-live="polite"
        >
          {selectedPlanIds.length} of {MAX_SELECTED_PLANS} selected
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const isSelected = selectedPlanIds.includes(plan.id);
          const isAtLimit = selectedPlanIds.length >= MAX_SELECTED_PLANS;
          const isDisabled = !isSelected && isAtLimit;

          return (
            <article
              key={plan.id}
              className={`relative flex min-h-48 flex-col rounded-2xl border p-5 transition-all ${
                isSelected
                  ? "border-[#005CB4] bg-blue-50/80 ring-2 ring-[#005CB4]/15"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {plan.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle(plan.id)}
                  disabled={isDisabled}
                  aria-label={isSelected ? `Remove ${plan.title} from your selection` : `Add ${plan.title} to your selection`}
                  aria-pressed={isSelected}
                  title={isSelected ? "Remove from your selection" : "Add to your selection"}
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4] disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? "border-[#005CB4] bg-[#005CB4] text-white"
                      : "border-slate-300 bg-white text-transparent hover:border-[#005CB4]"
                  }`}
                >
                  <span className="size-3 rounded-full bg-current" />
                </button>
              </div>
              <h3 className="mt-5 text-lg font-extrabold leading-snug tracking-tight text-slate-950">
                {plan.title}
              </h3>
              {plan.short_insight ? (
                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  {plan.short_insight}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-400">
                  {plan.neighborhood ? <span>{plan.neighborhood}</span> : null}
                  {plan.neighborhood && plan.budget_label ? <span>·</span> : null}
                  {plan.budget_label ? <span>{plan.budget_label}</span> : null}
                </p>
                <button
                  type="button"
                  onClick={() => setActivePlan(plan)}
                  aria-label={`Explore ${plan.title}`}
                  className="rounded-full px-3 py-2 text-xs font-extrabold text-[#005CB4] transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4]"
                >
                  Explore details <span aria-hidden="true">↗</span>
                </button>
              </div>
              {isDisabled ? (
                <p className="mt-2 text-xs font-medium text-slate-400">
                  You've selected the maximum number of plans.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {hasMore ? (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-white px-5 py-5 text-center">
          <p className="text-sm font-bold text-slate-900">That's all for now.</p>
          <p className="mt-1 text-sm text-slate-500">Want more ideas?</p>
          <button
            type="button"
            onClick={handleGetMoreSuggestions}
            disabled={isLoadingMore}
            className="mt-4 rounded-full bg-[#005CB4] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#004A91] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoadingMore ? "Finding more ideas..." : "Get more suggestions"}
          </button>
          {loadError ? (
            <p className="mt-3 text-sm font-medium text-red-600" role="alert">
              {loadError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-center">
          <p className="text-sm font-bold text-slate-900">
            {hasRequestedMore ? "You've seen all the ideas for this Vibe." : "That's all for now."}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {hasRequestedMore
              ? "Try another Vibe to explore a different kind of plan."
              : "You've reached the end of this Vibe's suggestions."}
          </p>
        </div>
      )}

      <div className="sticky bottom-0 z-10 mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {selectedPlanIds.length < MIN_SELECTED_PLANS
              ? `Choose ${MIN_SELECTED_PLANS - selectedPlanIds.length} more to continue`
              : selectedPlanIds.length === MAX_SELECTED_PLANS
                ? "You've selected the maximum number of plans"
                : "Looking good. Keep exploring or continue."}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            No account needed to explore and choose your plans.
          </p>
        </div>
        <button
          type="button"
          disabled={!selectionIsValid}
          onClick={() => setShowDeck(true)}
          className="rounded-full bg-[#005CB4] px-7 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#004A91] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Review {selectedPlanIds.length} selected plans
        </button>
      </div>

      {activePlan ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px] sm:p-6"
          onClick={() => setActivePlan(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-detail-title"
            className="my-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-center rounded-t-2xl bg-white/95 px-5 pb-2 pt-3 backdrop-blur">
              <span className="h-1.5 w-12 rounded-full bg-slate-200" />
              <button
                type="button"
                onClick={() => setActivePlan(null)}
                aria-label="Close plan details"
                className="absolute right-4 top-3 flex size-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="px-5 pb-7 sm:px-7">
              {activePlan.image_key?.startsWith("https://") ||
              activePlan.image_key?.startsWith("http://") ? (
                <img
                  src={activePlan.image_key}
                  alt={activePlan.title}
                  className="mb-6 h-52 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mb-6 flex h-44 items-end rounded-2xl bg-gradient-to-br from-[#071B3A] via-[#005CB4] to-[#42A5E8] p-5 text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                      Pepsi Vibes · Miami
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-tight">
                      {activePlan.category}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#005CB4]">
                  {activePlan.category}
                </span>
                {activePlan.budget_label ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {activePlan.budget_label}
                  </span>
                ) : null}
              </div>
              <h2 id="plan-detail-title" className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950">
                {activePlan.title}
              </h2>
              {activePlan.neighborhood ? (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {activePlan.neighborhood}, Miami
                </p>
              ) : null}

              {activePlan.short_insight ? (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#005CB4]">
                    The Pepsi Vibe
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                    {activePlan.short_insight}
                  </p>
                </div>
              ) : null}

              <div className="mt-6">
                <h3 className="text-sm font-extrabold text-slate-900">The plan</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activePlan.description ?? activePlan.short_insight ?? "A chance to make a new memory together."}
                </p>
              </div>

              <button
                type="button"
                disabled={selectedPlanIds.length >= MAX_SELECTED_PLANS && !selectedPlanIds.includes(activePlan.id)}
                onClick={() => handleToggle(activePlan.id)}
                className="mt-7 w-full rounded-full bg-[#005CB4] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition hover:bg-[#004A91] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {selectedPlanIds.includes(activePlan.id)
                  ? "Remove from your selection"
                  : "Add to your selection"}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Exploring a plan won't add it to your selection.
              </p>
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
