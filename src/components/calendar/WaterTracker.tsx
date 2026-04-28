"use client";

import { HiMinus, HiPlus } from "react-icons/hi2";
import { PiPintGlassFill } from "react-icons/pi";

import {
  useAddGlass,
  useRemoveGlass,
  useWaterLog,
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

export function WaterTracker({ date, className = "" }: Props) {
  const log = useWaterLog(date);
  const addGlass = useAddGlass();
  const removeGlass = useRemoveGlass();

  const today = todayString();
  if (date > today) return null;

  const count = log.data?.count ?? 0;
  const target = log.data?.target ?? 8;
  const pending = addGlass.isPending || removeGlass.isPending;
  const iconClass =
    count >= target
      ? "text-cyan-500"
      : count === 0
        ? "text-zinc-400"
        : "text-cyan-500";

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
        <PiPintGlassFill className={`h-5 w-5 ${iconClass}`} />
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
