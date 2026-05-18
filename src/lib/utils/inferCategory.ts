import type { TaskCategory } from "@/types/calendar";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pick the first category whose keyword list has a word-boundary match in the
 * title. Iteration order of `categories` defines tiebreak — callers should pass
 * the list in priority order (the backend already returns them ordered by
 * `order` then `name`).
 */
export function inferCategoryFromTitle(
  title: string,
  categories: TaskCategory[],
): TaskCategory | null {
  const normalized = title.toLowerCase();
  if (normalized.trim().length < 2) return null;
  for (const c of categories) {
    const kws = c.keywords;
    if (!kws?.length) continue;
    for (const kw of kws) {
      const k = kw.toLowerCase().trim();
      if (!k) continue;
      const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "i");
      if (re.test(normalized)) return c;
    }
  }
  return null;
}
