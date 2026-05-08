"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiArrowLongLeft, HiTrash } from "react-icons/hi2";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { RichTextEditor } from "@/components/RichTextEditor";
import AnchorToggleButton from "@/components/SecondBrain/AnchorToggleButton";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
import { Input } from "@/components/UI/Input";
import {
  useDeleteNote,
  useNote,
  useUpdateNote,
} from "@/lib/queries/entities";
import type { Note } from "@/types/entities";

function NoteEditForm({ note }: { note: Note }) {
  const router = useRouter();
  const update = useUpdateNote(note.id);
  const remove = useDeleteNote();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? "");
  const [tagIds, setTagIds] = useState<number[]>(note.tags.map((t) => t.id));
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function save() {
    setSaveError(null);
    try {
      await update.mutateAsync({ title, content, tags: tagIds });
      setDirty(false);
      setSavedAt(new Date());
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save.";
      setSaveError(message);
    }
  }

  async function destroy() {
    if (!confirm("Delete this note? This can't be undone.")) return;
    try {
      await remove.mutateAsync(note.id);
      router.push("/notes");
    } catch {
      setSaveError("Failed to delete.");
    }
  }

  return (
    <main className="flex flex-col gap-4 p-4 sm:p-6 lg:py-10">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/notes">
          <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
            Back to notes
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {savedAt && !dirty ? (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
          <AnchorToggleButton type="note" id={note.id} />
          <Button
            variant="primary"
            size="sm"
            disabled={update.isPending || !title.trim() || !dirty}
            loading={update.isPending}
            onClick={save}
          >
            Save
          </Button>
          <IconButton
            variant="danger"
            size="sm"
            label="Delete"
            disabled={remove.isPending}
            onClick={destroy}
          >
            <HiTrash />
          </IconButton>
        </div>
      </header>

      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        fullWidth
      />

      <RichTextEditor
        value={content}
        onChange={(html) => {
          setContent(html);
          setDirty(true);
        }}
        placeholder="Note body — markdown shortcuts work."
      />

      <TagPicker
        value={tagIds}
        onChange={(ids) => {
          setTagIds(ids);
          setDirty(true);
        }}
      />

      <SharableLinksPanel type="note" id={note.id} />
      <LinkedEntitiesPanel type="note" id={note.id} />

      {saveError ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">
          {saveError}
        </p>
      ) : null}
    </main>
  );
}

export default function NoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const noteId = Number(id);

  const { data: note, isLoading, error } = useNote(
    Number.isNaN(noteId) ? null : noteId,
  );

  if (Number.isNaN(noteId)) {
    return (
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid note id.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="p-4 sm:p-6 lg:py-10 text-sm text-secondary-500 dark:text-secondary-400">
        Loading note…
      </main>
    );
  }

  if (error || !note) {
    return (
      <main className="p-4 sm:p-6 lg:py-10 text-sm text-danger-600 dark:text-danger-400">
        Couldn&rsquo;t load this note.
      </main>
    );
  }

  return <NoteEditForm note={note} key={note.id} />;
}
