"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import HardwareEditor from "@/components/SecondBrain/forms/HardwareEditor";
import { useHardwareOne } from "@/lib/queries/entities";

export default function EditHardwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const hwId = Number(id);

  const { data, isLoading, error } = useHardwareOne(
    Number.isNaN(hwId) ? null : hwId,
  );

  if (Number.isNaN(hwId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid hardware id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading hardware…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this hardware.
      </main>
    );
  }

  return (
    <HardwareEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="hardware" id={data.id} />}
    />
  );
}
