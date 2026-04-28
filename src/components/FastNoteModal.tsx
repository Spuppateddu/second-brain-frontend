"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { useFastNote, useUpdateFastNote } from "@/lib/queries/entities";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FastNoteModal({ open, onClose }: Props) {
  const fastNote = useFastNote(open);
  const updateFastNote = useUpdateFastNote();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loadedFromId, setLoadedFromId] = useState<number | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const isDirty = content !== originalContent;
  const loading = fastNote.isLoading;
  const saving = updateFastNote.isPending;

  if (open && fastNote.data && fastNote.data.id !== loadedFromId) {
    const next = fastNote.data.content ?? "";
    setContent(next);
    setOriginalContent(next);
    setLoadedFromId(fastNote.data.id);
  }

  useEffect(() => {
    if (open && !loading) {
      const t = setTimeout(() => textareaRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open, loading]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        attemptClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isDirty, content]);

  function attemptClose() {
    if (saving) return;
    if (isDirty) {
      setConfirmingClose(true);
    } else {
      onClose();
    }
  }

  async function save() {
    if (!isDirty || saving) return;
    try {
      await updateFastNote.mutateAsync(content);
      setOriginalContent(content);
      onClose();
    } catch {
      // Error surfaced via mutation state below.
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={attemptClose}
    >
      <div
        className="mt-20 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Fast Note</h2>
            {isDirty && (
              <span className="text-xs text-orange-500">
                (unsaved changes)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={attemptClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500" />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jot down a thought… (⌘/Ctrl + Enter to save)"
              rows={12}
              className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed text-zinc-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          )}
          {updateFastNote.isError && (
            <p className="mt-2 text-sm text-danger">
              Failed to save. Try again.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={attemptClose}
            isDisabled={saving}
          >
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={save}
            isDisabled={!isDirty || saving || loading}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {confirmingClose && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/50 p-4"
          onClick={() => setConfirmingClose(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">Discard changes?</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              You have unsaved changes. Close without saving?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingClose(false)}
              >
                Keep editing
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setConfirmingClose(false);
                  onClose();
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
