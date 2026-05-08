"use client";

import { HiBookmark, HiOutlineBookmark } from "react-icons/hi2";

import {
  useCalendarAnchors,
  useToggleCalendarAnchor,
} from "@/lib/queries/entity-anchors";
import type { EditableEntityType } from "@/lib/entity-fetch";

interface AnchorToggleButtonProps {
  type: EditableEntityType;
  id: number;
  className?: string;
}

export default function AnchorToggleButton({
  type,
  id,
  className,
}: AnchorToggleButtonProps) {
  const anchors = useCalendarAnchors();
  const toggle = useToggleCalendarAnchor();
  const anchored = (anchors.data ?? []).some(
    (a) => a.type === type && a.id === id,
  );

  const baseClasses =
    "flex-shrink-0 rounded-[var(--radius-control)] p-2 transition-colors disabled:opacity-50";
  const colorClasses = anchored
    ? "text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30"
    : "text-secondary-400 hover:bg-amber-100 hover:text-amber-600 dark:text-secondary-500 dark:hover:bg-amber-900/30 dark:hover:text-amber-400";

  return (
    <button
      type="button"
      aria-label={anchored ? "Unanchor from calendar" : "Anchor to calendar"}
      title={
        anchored
          ? "Anchored to calendar — click to remove"
          : "Anchor to calendar Entities panel"
      }
      disabled={toggle.isPending}
      onClick={() =>
        toggle.mutate({ type, id, is_calendar_anchored: !anchored })
      }
      className={[baseClasses, colorClasses, className ?? ""].join(" ")}
    >
      {anchored ? (
        <HiBookmark className="h-4 w-4" />
      ) : (
        <HiOutlineBookmark className="h-4 w-4" />
      )}
    </button>
  );
}
