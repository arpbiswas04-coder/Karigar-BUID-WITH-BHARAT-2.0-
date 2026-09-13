// Use persisted evidence only; sorting never changes the API array or score.
export function sortByEvidence(products) {
  return [...products].sort((a, b) => {
    const left = a.evidence?.score;
    const right = b.evidence?.score;
    if (!Number.isFinite(left)) return Number.isFinite(right) ? 1 : 0;
    if (!Number.isFinite(right)) return -1;
    return right - left;
  });
}
