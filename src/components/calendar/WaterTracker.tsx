"use client";

import { useEffect, useMemo, useState } from "react";
import { HiMinus, HiPlus } from "react-icons/hi2";
import { PiPintGlassFill } from "react-icons/pi";

import {
  useAddGlass,
  useRemoveGlass,
  useWaterLog,
  type WaterLog,
} from "@/lib/queries/water";

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

type Props = {
  date: string;
  className?: string;
};

type IconState = "normal" | "warning" | "pulse" | "shake";
type DateRelation = "past" | "today" | "future";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 24;
const INACTIVITY_MS = 2 * 60 * 60 * 1000;

function computeIconState(
  log: WaterLog | undefined,
  dateRelation: DateRelation,
): IconState {
  if (dateRelation !== "today" || !log) return "normal";

  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < DAY_START_HOUR) return "normal";

  const totalDayMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const elapsedMinutes =
    (currentHour - DAY_START_HOUR) * 60 + now.getMinutes();
  const progress = elapsedMinutes / totalDayMinutes;
  const expectedCount = log.target * progress;
  const behindSchedule = log.count < expectedCount * 0.5;

  let inactive = false;
  if (log.last_logged_at) {
    const lastLogged = new Date(log.last_logged_at);
    inactive = Date.now() - lastLogged.getTime() > INACTIVITY_MS;
  } else {
    const dayStart = new Date();
    dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
    inactive = Date.now() - dayStart.getTime() > INACTIVITY_MS;
  }

  if (behindSchedule && inactive) return "shake";
  if (behindSchedule) return "warning";
  if (inactive) return "pulse";
  return "normal";
}

function iconClassesFor(state: IconState): string {
  switch (state) {
    case "shake":
      return "text-red-500 animate-shake";
    case "warning":
      return "text-red-500";
    case "pulse":
      return "text-cyan-500 animate-water-pulse";
    default:
      return "text-cyan-500";
  }
}

export function WaterTracker({ date, className = "" }: Props) {
  const log = useWaterLog(date);
  const addGlass = useAddGlass();
  const removeGlass = useRemoveGlass();

  const today = todayString();
  const dateRelation: DateRelation =
    date === today ? "today" : date < today ? "past" : "future";

  const [iconState, setIconState] = useState<IconState>("normal");

  useEffect(() => {
    if (dateRelation !== "today") {
      setIconState("normal");
      return;
    }
    const update = () => setIconState(computeIconState(log.data, dateRelation));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [log.data, dateRelation]);

  const count = log.data?.count ?? 0;
  const target = log.data?.target ?? 8;
  const pending = addGlass.isPending || removeGlass.isPending;

  const iconClass = useMemo(() => {
    if (dateRelation === "past") {
      return count === 0 ? "text-zinc-400" : "text-cyan-500";
    }
    return iconClassesFor(iconState);
  }, [iconState, dateRelation, count]);

  if (dateRelation === "future") return null;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg bg-zinc-50 px-1 py-1 dark:bg-zinc-700/50 ${className}`}
    >
      <button
        type="button"
        onClick={() => removeGlass.mutate(date)}
        disabled={pending || count <= 0}
        aria-label="Remove glass"
        className="rounded p-1.5 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-600"
      >
        <HiMinus className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>
      <div className="flex items-center gap-1.5 px-1">
        <PiPintGlassFill className={`h-5 w-5 transition-colors ${iconClass}`} />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {count}/{target}
        </span>
      </div>
      <button
        type="button"
        onClick={() => addGlass.mutate(date)}
        disabled={pending}
        aria-label="Add glass"
        className="rounded p-1.5 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:hover:bg-zinc-600"
      >
        <HiPlus className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>
    </div>
  );
}
