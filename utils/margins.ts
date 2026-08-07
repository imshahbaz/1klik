/**
 * Shared symbol search for margin lists. The Trade, Calculator, and Holdings
 * screens each filter/sort the margin universe the same way: case-insensitive
 * substring match, then rank by relevance (exact match, prefix match, then
 * alphabetical). Keeping it in one place stops the ranking logic from drifting.
 */

export interface MarginSymbolRow {
  symbol?: string;
  [key: string]: any;
}

/**
 * Filters `margins` to rows whose symbol contains `query` (case-insensitive)
 * and ranks them: exact match first, then prefix matches, then alphabetical.
 * Pass `limit` to cap the returned list (e.g. autocomplete dropdowns).
 */
export function rankMarginSymbols(
  margins: ReadonlyArray<MarginSymbolRow> | null | undefined,
  query: string,
  limit?: number
): MarginSymbolRow[] {
  if (!Array.isArray(margins)) return [];

  const q = query.trim().toLowerCase();

  const filtered = q
    ? margins.filter((m) => m?.symbol?.toLowerCase().includes(q))
    : [...margins];

  const ranked = [...filtered];
  ranked.sort((a, b) => {
    const sA = a.symbol.toLowerCase();
    const sB = b.symbol.toLowerCase();
    if (sA === q) return -1;
    if (sB === q) return 1;
    const startsA = sA.startsWith(q);
    const startsB = sB.startsWith(q);
    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;
    return sA.localeCompare(sB);
  });

  return limit != null ? ranked.slice(0, limit) : ranked;
}
