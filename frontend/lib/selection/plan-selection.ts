export const MIN_SELECTED_PLANS = 2;
export const MAX_SELECTED_PLANS = 10;

/**
 * Adds or removes a plan from the current selection.
 * Selection IDs are independent of the currently visible discovery batch,
 * so callers can retain this list while loading more plans.
 */
export function togglePlanSelection(
  selectedPlanIds: readonly string[],
  planId: string,
): string[] {
  if (!planId.trim()) {
    throw new Error("A plan ID is required.");
  }

  const uniqueSelectedIds = [...new Set(selectedPlanIds)];

  if (uniqueSelectedIds.includes(planId)) {
    return uniqueSelectedIds.filter((selectedId) => selectedId !== planId);
  }

  if (uniqueSelectedIds.length >= MAX_SELECTED_PLANS) {
    return uniqueSelectedIds;
  }

  return [...uniqueSelectedIds, planId];
}

/**
 * A deck can be finalized only when it contains 2–10 distinct plan IDs.
 */
export function isPlanSelectionValid(
  selectedPlanIds: readonly string[],
): boolean {
  const uniqueSelectedIds = new Set(selectedPlanIds);

  return (
    uniqueSelectedIds.size >= MIN_SELECTED_PLANS &&
    uniqueSelectedIds.size <= MAX_SELECTED_PLANS &&
    [...uniqueSelectedIds].every((planId) => planId.trim().length > 0)
  );
}
