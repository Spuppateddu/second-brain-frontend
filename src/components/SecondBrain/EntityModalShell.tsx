"use client";

import { useEffect, type ReactNode } from "react";

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
}: EntityModalShellProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  // Mobile: fullscreen. Desktop: centered, capped width.
  const desktopMaxWidth = size === "xl" ? "md:max-w-3xl" : "md:max-w-2xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-zinc-950/40 backdrop-blur-sm md:items-start md:p-4"
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className={[
          "flex flex-col overflow-hidden",
          "h-full w-full bg-white dark:bg-zinc-950",
          "md:mt-12 md:h-auto md:max-h-[calc(100vh-6rem)] md:rounded-xl md:border md:border-zinc-200 md:shadow-2xl md:dark:border-zinc-800",
          desktopMaxWidth,
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {titleContent}
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          {footer}
        </div>
      </div>
    </div>
  );
}
