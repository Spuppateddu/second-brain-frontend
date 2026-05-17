"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import MegaFileEditor from "@/components/SecondBrain/forms/MegaFileEditor";
import { useMegaFile } from "@/lib/queries/entities";

export default function EditMegaFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const fileId = Number(id);

  const { data, isLoading, error } = useMegaFile(
    Number.isNaN(fileId) ? null : fileId,
  );

  if (Number.isNaN(fileId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid file id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading file…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this file.</main>
    );
  }

  return (
    <MegaFileEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="mega_file" id={data.id} />}
    />
  );
}
