"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import SoftwareEditor from "@/components/SecondBrain/forms/SoftwareEditor";
import { useSoftwareOne } from "@/lib/queries/entities";

export default function EditSoftwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const swId = Number(id);

  const { data, isLoading, error } = useSoftwareOne(
    Number.isNaN(swId) ? null : swId,
  );

  if (Number.isNaN(swId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid software id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading software…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this software.
      </main>
    );
  }

  return (
    <SoftwareEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="software" id={data.id} />}
    />
  );
}
