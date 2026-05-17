"use client";

import { useEffect } from "react";
import { HiXMark } from "react-icons/hi2";

import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { ShareableType } from "@/lib/queries/entities";

interface ShareLinkModalProps {
  isOpen: boolean;
  kind: ShareableType;
  id: number;
  onClose: () => void;
}

export default function ShareLinkModal({
  isOpen,
  kind,
  id,
  onClose,
}: ShareLinkModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h3 className="text-base font-semibold">Public share link</h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <SharableLinksPanel type={kind} id={id} />
        </div>
      </div>
    </div>
  );
}
