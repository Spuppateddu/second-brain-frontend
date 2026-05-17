"use client";

import { useEffect, useRef, useState } from "react";
import { HiChevronDown, HiOutlineDuplicate } from "react-icons/hi";

import ConfirmDialog from "@/components/SecondBrain/ConfirmDialog";
import { useBags } from "@/lib/queries/entities";
import type { Bag } from "@/types/entities";

type Props = {
  currentValue: string;
  onPicked: (html: string) => void;
};

export default function CopyFromBagPicker({ currentValue, onPicked }: Props) {
  const { data: bags = [] } = useBags();
  const defaults = bags.filter((b) => b.is_default);

  const [open, setOpen] = useState(false);
  const [pendingBag, setPendingBag] = useState<Bag | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const applyBag = (bag: Bag) => {
    onPicked(bag.description ?? "");
  };

  const handlePick = (bag: Bag) => {
    setOpen(false);
    if (currentValue.trim() !== "") {
      setPendingBag(bag);
    } else {
      applyBag(bag);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={defaults.length === 0}
        className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title={
          defaults.length === 0
            ? "No default bags yet"
            : "Copy content from a default bag"
        }
      >
        <HiOutlineDuplicate className="h-3.5 w-3.5" />
        <span>Copy from bag</span>
        <HiChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && defaults.length > 0 && (
        <div className="absolute right-0 z-30 mt-1 max-h-64 w-64 overflow-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          {defaults.map((bag) => (
            <button
              key={bag.id}
              type="button"
              onClick={() => handlePick(bag)}
              className="block w-full truncate rounded px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {bag.title}
            </button>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingBag !== null}
        title="Replace bag content?"
        message={
          pendingBag
            ? `Replace the current bag content with «${pendingBag.title}»? This cannot be undone.`
            : ""
        }
        confirmText="Replace"
        cancelText="Cancel"
        variant="danger"
        onClose={() => setPendingBag(null)}
        onConfirm={() => {
          if (pendingBag) applyBag(pendingBag);
          setPendingBag(null);
        }}
      />
    </div>
  );
}
