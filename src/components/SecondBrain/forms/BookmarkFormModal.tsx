"use client";

import { Button } from "@heroui/react";
import { useState } from "react";
import { FiCopy, FiExternalLink } from "react-icons/fi";

import EntityModalShell from "@/components/SecondBrain/EntityModalShell";
import InlineTagPicker from "@/components/SecondBrain/InlineTagPicker";
import SearchableToggle from "@/components/SecondBrain/SearchableToggle";
import {
  FooterCloseButton,
  FooterPrimaryButton,
  FormError,
  FormFieldLabel,
  ModalTitleInput,
} from "@/components/SecondBrain/forms/sharedFormBits";
import {
  useCreateBookmark,
  useUpdateBookmark,
} from "@/lib/queries/entities";
import type { Bookmark } from "@/types/entities";

interface BookmarkFormModalProps {
  isOpen: boolean;
  initial?: Bookmark | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export default function BookmarkFormModal(props: BookmarkFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initial ? `edit-${props.initial.id}` : "new";
  return <BookmarkFormModalInner key={key} {...props} />;
}

function BookmarkFormModalInner({
  initial,
  prefillTagId,
  onClose,
  onSaved,
}: BookmarkFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [showDescription, setShowDescription] = useState(
    !!initial?.description,
  );
  const [tagIds, setTagIds] = useState<number[]>(
    initial?.tags?.map((t) => t.id) ?? [],
  );
  const [isSearchable, setIsSearchable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateBookmark();
  const updateMut = useUpdateBookmark(initial?.id ?? 0);
  const isPending = createMut.isPending || updateMut.isPending;

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

  const handleSubmit = async () => {
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
      tag_ids: tagIds,
    };
    try {
      if (initial) {
        await updateMut.mutateAsync(payload);
      } else {
        await createMut.mutateAsync(payload);
      }
      onSaved?.();
      onClose();
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

  return (
    <EntityModalShell
      isOpen
      onClose={onClose}
      titleContent={
        <ModalTitleInput
          value={title}
          onChange={setTitle}
          placeholder={initial ? "Bookmark title" : "Create New Bookmark"}
        />
      }
      footer={
        <>
          <FooterCloseButton
            onClick={onClose}
            isPending={isPending}
            label={initial ? "Close" : "Close"}
          />
          <FooterPrimaryButton onClick={handleSubmit} isPending={isPending}>
            {initial ? "Save" : "Create Bookmark"}
          </FooterPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FormFieldLabel>URL</FormFieldLabel>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
                }}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Remove
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}

        <InlineTagPicker
          selectedTagIds={tagIds}
          onChange={setTagIds}
          prefillTagId={prefillTagId}
        />

        <SearchableToggle value={isSearchable} onChange={setIsSearchable} />

        <FormError message={error} />
      </div>
    </EntityModalShell>
  );
}
