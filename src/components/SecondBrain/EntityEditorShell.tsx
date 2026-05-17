"use client";

import { useEffect, type ReactNode } from "react";

interface EntityEditorShellProps {
  mode: "modal" | "page";
  titleContent: ReactNode;
  children: ReactNode;
  bottom: ReactNode;
  /** Rendered beneath the body in page mode only (e.g. LinkedEntitiesPanel). */
  belowBody?: ReactNode;
  /** Modal-only sizing hint. */
  size?: "lg" | "xl";
  /** Modal-only: fires on Escape (and backdrop click is intentionally disabled). */
  onClose?: () => void;
}

export default function EntityEditorShell({
  mode,
  titleContent,
  children,
  bottom,
  belowBody,
  size = "lg",
  onClose,
}: EntityEditorShellProps) {
  useEffect(() => {
    if (mode !== "modal" || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (mode === "modal") {
    const desktopMaxWidth = size === "xl" ? "md:max-w-7xl" : "md:max-w-6xl";
    return (
      <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-zinc-950/40 backdrop-blur-sm md:items-center md:p-4">
        <div
          className={[
            "flex flex-col overflow-hidden",
            "h-full w-full bg-white dark:bg-zinc-950",
            "md:h-[70vh] md:w-[85vw] md:rounded-xl md:border md:border-zinc-200 md:shadow-2xl md:dark:border-zinc-800",
            desktopMaxWidth,
          ].join(" ")}
        >
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="min-w-0 flex-1">{titleContent}</div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            {bottom}
          </div>
        </div>
      </div>
    );
  }

  // page mode
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6 lg:py-10">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:-mx-6 sm:px-6">
        <div className="min-w-0 flex-1">{titleContent}</div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      {belowBody ? <div className="flex flex-col gap-4">{belowBody}</div> : null}
      <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:-mx-6 sm:px-6">
        {bottom}
      </div>
    </main>
  );
}
