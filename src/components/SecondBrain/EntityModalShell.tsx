"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FaExpand } from "react-icons/fa";

import AnchorToggleButton from "@/components/SecondBrain/AnchorToggleButton";
import type { EditableEntityType } from "@/lib/entity-fetch";

interface EntityModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Top-of-modal title slot. The old design puts a free-form `<input>` here
   * (e.g. the bookmark/title field), so we hand the caller full control.
   */
  titleContent: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  size?: "lg" | "xl";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /**
   * When set, renders an "open full page" icon button in the header that
   * routes to this path on click. Mirrors the same affordance shown in the
   * spotlight search results.
   */
  fullPagePath?: string;
  /**
   * When set, renders an anchor toggle so the user can pin this entity to
   * the calendar Entities panel directly from the modal.
   */
  anchorEntity?: { type: EditableEntityType; id: number };
}

export default function EntityModalShell({
  isOpen,
  onClose,
  titleContent,
  children,
  footer,
  size = "lg",
  closeOnBackdrop = false,
  closeOnEscape = true,
  fullPagePath,
  anchorEntity,
}: EntityModalShellProps) {
  const router = useRouter();
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  // Mobile: fullscreen. Desktop: centered, ~85% wide × 70% tall.
  const desktopMaxWidth = size === "xl" ? "md:max-w-7xl" : "md:max-w-6xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-zinc-950/40 backdrop-blur-sm md:items-center md:p-4"
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className={[
          "flex flex-col overflow-hidden",
          "h-full w-full bg-white dark:bg-zinc-950",
          "md:h-[70vh] md:w-[85vw] md:rounded-xl md:border md:border-zinc-200 md:shadow-2xl md:dark:border-zinc-800",
          desktopMaxWidth,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0 flex-1">{titleContent}</div>
          {anchorEntity && (
            <AnchorToggleButton
              type={anchorEntity.type}
              id={anchorEntity.id}
            />
          )}
          {fullPagePath && (
            <button
              type="button"
              aria-label="Open full page"
              title="Open full page"
              onClick={() => {
                onClose();
                router.push(fullPagePath);
              }}
              className="flex-shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:text-zinc-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
            >
              <FaExpand className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          {footer}
        </div>
      </div>
    </div>
  );
}
