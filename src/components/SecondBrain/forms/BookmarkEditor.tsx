"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import { FiCopy, FiExternalLink } from "react-icons/fi";

import EntityActionBar from "@/components/SecondBrain/EntityActionBar";
import EntityEditorShell from "@/components/SecondBrain/EntityEditorShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import {
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateBookmark,
  useDeleteBookmark,
  useUpdateBookmark,
} from "@/lib/queries/entities";
import type { Bookmark } from "@/types/entities";

interface BookmarkEditorProps {
  mode: "modal" | "page";
  initial?: Bookmark | null;
  prefillTagId?: number;
  belowBody?: React.ReactNode;
  onClose: () => void;
  onSaved?: () => void;
}

export default function BookmarkEditor(props: BookmarkEditorProps) {
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <BookmarkEditorInner key={key} {...props} />;
}

function BookmarkEditorInner({
  mode,
  initial,
  prefillTagId,
  belowBody,
  onClose,
  onSaved,
}: BookmarkEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [showDescription, setShowDescription] = useState(
    !!initial?.description,
  );
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(
    (initial as Bookmark & { is_searchable?: boolean })?.is_searchable ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const createMut = useCreateBookmark();
  const updateMut = useUpdateBookmark(initial?.id ?? 0);
  const deleteMut = useDeleteBookmark();
  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  const markDirty = () => setDirty(true);

  const handleOpenUrl = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const handleCopyUrl = async () => {
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // ignore
      }
    }
  };

  const submit = async (closeAfter: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    const payload = {
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      is_searchable: isSearchable,
      tag_ids: tagIds,
    };
    try {
      if (initial) await updateMut.mutateAsync(payload);
      else await createMut.mutateAsync(payload);
      onSaved?.();
      setDirty(false);
      if (closeAfter) onClose();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to save.",
      );
    }
  };

  const handleDelete = initial
    ? async () => {
        try {
          await deleteMut.mutateAsync(initial.id);
          onClose();
        } catch (e: unknown) {
          const err = e as { response?: { data?: { message?: string } } };
          setError(err?.response?.data?.message ?? "Failed to delete.");
        }
      }
    : undefined;

  return (
    <EntityEditorShell
      mode={mode}
      onClose={onClose}
      belowBody={belowBody}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={(v) => {
            setTitle(v);
            markDirty();
          }}
          placeholder={initial ? "Bookmark title" : "New Bookmark"}
        />
      }
      bottom={
        <EntityActionBar
          mode={mode}
          kind="bookmark"
          id={initial?.id}
          entityLabel="bookmark"
          dirty={dirty}
          isPending={isPending}
          isSearchable={{
            value: isSearchable,
            onChange: (v) => {
              setIsSearchable(v);
              markDirty();
            },
          }}
          onSave={() => submit(false)}
          onSaveAndExit={() => submit(true)}
          onDelete={handleDelete}
          onClose={mode === "modal" ? onClose : undefined}
        />
      }
    >
      <div className="space-y-4 pt-4">
        <div>
          <FormFieldLabel>URL</FormFieldLabel>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                markDirty();
              }}
              placeholder="https://example.com"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenUrl}
              isDisabled={!url}
              aria-label="Open URL"
            >
              <FiExternalLink className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUrl}
              isDisabled={!url}
              aria-label="Copy URL"
            >
              <FiCopy className="h-5 w-5" />
            </Button>
          </div>
          {!showDescription && (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="mt-2 text-sm text-sky-600 hover:underline dark:text-sky-400"
            >
              add description
            </button>
          )}
        </div>

        {showDescription && (
          <div>
            <div className="flex items-center justify-between">
              <FormFieldLabel>Description</FormFieldLabel>
              <button
                type="button"
                onClick={() => {
                  setShowDescription(false);
                  setDescription("");
                  markDirty();
                }}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Remove
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                markDirty();
              }}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={(ids) => {
            setTagIds(ids);
            markDirty();
          }}
          prefillTagId={prefillTagId}
        />

        <FormError message={error} />
      </div>
    </EntityEditorShell>
  );
}
