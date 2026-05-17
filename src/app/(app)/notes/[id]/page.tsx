"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import NoteEditor from "@/components/SecondBrain/forms/NoteEditor";
import { useNote } from "@/lib/queries/entities";

export default function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const noteId = Number(id);

  const { data, isLoading, error } = useNote(
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
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this note.</main>
    );
  }

  return (
    <NoteEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="note" id={data.id} />}
    />
  );
}
