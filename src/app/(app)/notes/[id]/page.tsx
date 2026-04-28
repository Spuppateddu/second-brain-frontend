"use client";

import { Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { RichTextEditor } from "@/components/RichTextEditor";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import { TagPicker } from "@/components/TagPicker";
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
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => router.push("/notes")}
          className="text-sm text-zinc-500 hover:underline"
        >
          ← Back to notes
        </button>
        <div className="flex items-center gap-2">
          {savedAt && !dirty ? (
            <span className="text-xs text-zinc-500">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          ) : null}
          <Button
            variant="primary"
            size="sm"
            isDisabled={update.isPending || !title.trim() || !dirty}
            onClick={save}
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            variant="danger-soft"
            size="sm"
            isDisabled={remove.isPending}
            onClick={destroy}
          >
            Delete
          </Button>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
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
      {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}
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
      <main className="p-6">
        <p className="text-sm text-danger">Invalid note id.</p>
      </main>
    );
  }

  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading note…</main>;
  }

  if (error || !note) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this note.
      </main>
    );
  }

  return <NoteEditForm note={note} key={note.id} />;
}
