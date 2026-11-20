"use client";

import { useMemo, useState } from "react";

import {
  isPlanSelectionValid,
  MAX_SELECTED_PLANS,
  MIN_SELECTED_PLANS,
  togglePlanSelection,
} from "@/lib/selection/plan-selection";
import type { Plan } from "@/lib/catalog/plans";

const BATCH_SIZE = 5;

type PlanDiscoveryProps = {
  plans: Plan[];
};

export default function PlanDiscovery({ plans }: PlanDiscoveryProps) {
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [showDeck, setShowDeck] = useState(false);

  const visiblePlans = plans.slice(0, visibleCount);
  const selectedPlans = useMemo(
    () => plans.filter((plan) => selectedPlanIds.includes(plan.id)),
    [plans, selectedPlanIds],
  );
  const selectionIsValid = isPlanSelectionValid(selectedPlanIds);
  const hasMorePlans = visibleCount < plans.length;

  function handleToggle(planId: string) {
    setShowDeck(false);
    setSelectedPlanIds((current) => togglePlanSelection(current, planId));
  }

  if (showDeck) {
    return (
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#005CB4]">
              Deck selected
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
              Your shortlist is ready.
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {selectedPlans.length} ideas ready for your group.
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
          {selectedPlans.map((plan, index) => (
            <div key={plan.id} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-extrabold text-[#005CB4]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900">{plan.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          These are the ideas you want to bring to your group. Next, you’ll be able to create and share a room.
        </p>
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
        <div>
          <p className="text-sm font-bold text-slate-900">Choose your plans</p>
        </div>
        <p className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-extrabold tabular-nums text-[#005CB4]" aria-live="polite">
          {selectedPlanIds.length} of {MAX_SELECTED_PLANS} selected
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visiblePlans.map((plan) => {
          const isSelected = selectedPlanIds.includes(plan.id);
          const isAtLimit = selectedPlanIds.length >= MAX_SELECTED_PLANS;
          const isDisabled = !isSelected && isAtLimit;

          return (
            <button
              key={plan.id}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => handleToggle(plan.id)}
              className={`group relative flex min-h-48 flex-col rounded-2xl border p-5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB4] ${
                isSelected
                  ? "border-[#005CB4] bg-blue-50/80 ring-2 ring-[#005CB4]/15"
                  : isDisabled
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {plan.category}
                </span>
                <span className={`flex size-7 items-center justify-center rounded-full border text-xs font-bold transition ${
                  isSelected
                    ? "border-[#005CB4] bg-[#005CB4] text-white"
                    : "border-slate-300 text-transparent group-hover:border-[#005CB4]"
                }`}>
                  ✓
                </span>
              </span>
              <span className="mt-5 block text-lg font-extrabold leading-snug tracking-tight text-slate-950">
                {plan.title}
              </span>
              {plan.short_insight ? (
                <span className="mt-1.5 block text-sm leading-5 text-slate-500">
                  {plan.short_insight}
                </span>
              ) : null}
              <span className="mt-auto flex flex-wrap gap-x-2 gap-y-1 pt-5 text-xs font-semibold text-slate-400">
                {plan.neighborhood ? <span>{plan.neighborhood}</span> : null}
                {plan.neighborhood && plan.budget_label ? <span>·</span> : null}
                {plan.budget_label ? <span>{plan.budget_label}</span> : null}
              </span>
            </button>
          );
        })}
      </div>

      {hasMorePlans ? (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + BATCH_SIZE, plans.length))}
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-[#005CB4] hover:text-[#005CB4]"
          >
            Show {Math.min(BATCH_SIZE, plans.length - visibleCount)} more plans
          </button>
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-3 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {selectedPlanIds.length < MIN_SELECTED_PLANS
              ? `Choose ${MIN_SELECTED_PLANS - selectedPlanIds.length} more to continue`
              : selectedPlanIds.length === MAX_SELECTED_PLANS
                ? "Your deck is full"
                : "Looking good. Keep exploring or continue."}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            No account needed to explore and build your shortlist.
          </p>
        </div>
        <button
          type="button"
          disabled={!selectionIsValid}
          onClick={() => setShowDeck(true)}
          className="rounded-full bg-[#005CB4] px-7 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-900/15 transition hover:bg-[#004A91] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Review {selectedPlanIds.length} plans
        </button>
      </div>
    </div>
  );
}
