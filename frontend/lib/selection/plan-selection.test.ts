import { describe, expect, it } from "vitest";

import {
  isPlanSelectionValid,
  MAX_SELECTED_PLANS,
  MIN_SELECTED_PLANS,
  togglePlanSelection,
} from "./plan-selection";

describe("togglePlanSelection", () => {
  it("adds a plan to the selection", () => {
    expect(togglePlanSelection(["plan-1"], "plan-2")).toEqual([
      "plan-1",
      "plan-2",
    ]);
  });

  it("removes a plan that is already selected", () => {
    expect(togglePlanSelection(["plan-1", "plan-2"], "plan-1")).toEqual([
      "plan-2",
    ]);
  });

  it("does not add more than the maximum number of plans", () => {
    const selected = Array.from(
      { length: MAX_SELECTED_PLANS },
      (_, index) => `plan-${index + 1}`,
    );

    expect(togglePlanSelection(selected, "plan-extra")).toEqual(selected);
  });

  it("preserves selections from previously loaded discovery batches", () => {
    const selectedFromFirstBatch = ["plan-1", "plan-3"];

    expect(
      togglePlanSelection(selectedFromFirstBatch, "plan-7"),
    ).toEqual(["plan-1", "plan-3", "plan-7"]);
  });

  it("removes duplicate IDs from an existing selection", () => {
    expect(togglePlanSelection(["plan-1", "plan-1"], "plan-2")).toEqual([
      "plan-1",
      "plan-2",
    ]);
  });

  it("rejects an empty plan ID", () => {
    expect(() => togglePlanSelection([], "  ")).toThrow(
      "A plan ID is required.",
    );
  });
});

describe("isPlanSelectionValid", () => {
  it("requires at least the minimum number of distinct plans", () => {
    expect(isPlanSelectionValid(["plan-1"])).toBe(false);
    expect(isPlanSelectionValid(["plan-1", "plan-2"])).toBe(true);
  });

  it("accepts selections up to the maximum number of plans", () => {
    const selected = Array.from(
      { length: MAX_SELECTED_PLANS },
      (_, index) => `plan-${index + 1}`,
    );

    expect(isPlanSelectionValid(selected)).toBe(true);
  });

  it("rejects more than the maximum number of distinct plans", () => {
    const selected = Array.from(
      { length: MAX_SELECTED_PLANS + 1 },
      (_, index) => `plan-${index + 1}`,
    );

    expect(isPlanSelectionValid(selected)).toBe(false);
  });

  it("does not count duplicate IDs as distinct plans", () => {
    expect(isPlanSelectionValid(["plan-1", "plan-1"])).toBe(false);
  });

  it("rejects empty IDs", () => {
    expect(isPlanSelectionValid(["plan-1", " "])).toBe(false);
  });

  it("exports the domain limits", () => {
    expect(MIN_SELECTED_PLANS).toBe(2);
    expect(MAX_SELECTED_PLANS).toBe(10);
  });
});
