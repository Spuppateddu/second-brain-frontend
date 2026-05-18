// Helpers for formatting a planning task's `task_date` and the days
// remaining / overdue relative to today.

export type DueStatus = {
  /** Short locale date label, e.g. "May 18". */
  dateLabel: string;
  /** Negative if overdue, 0 if due today, positive if upcoming. */
  daysDiff: number;
  /** Human-readable diff: "Today", "3 days left", "2 days overdue". */
  diffLabel: string;
  /** Tone hint for callers picking a color. */
  tone: "overdue" | "today" | "soon" | "upcoming";
};

export function parseLocalDate(yyyymmdd: string): Date | null {
  const m = yyyymmdd?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d));
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function describeDueDate(
  taskDate: string | null | undefined,
  now: Date = new Date(),
): DueStatus | null {
  if (!taskDate) return null;
  const parsed = parseLocalDate(taskDate);
  if (!parsed) return null;

  const today = startOfDay(now);
  const target = startOfDay(parsed);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.round((target.getTime() - today.getTime()) / msPerDay);

  const dateLabel = parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  let diffLabel: string;
  let tone: DueStatus["tone"];
  if (daysDiff === 0) {
    diffLabel = "Today";
    tone = "today";
  } else if (daysDiff < 0) {
    const n = Math.abs(daysDiff);
    diffLabel = `${n} day${n === 1 ? "" : "s"} overdue`;
    tone = "overdue";
  } else if (daysDiff <= 3) {
    diffLabel = `${daysDiff} day${daysDiff === 1 ? "" : "s"} left`;
    tone = "soon";
  } else {
    diffLabel = `${daysDiff} days left`;
    tone = "upcoming";
  }

  return { dateLabel, daysDiff, diffLabel, tone };
}
