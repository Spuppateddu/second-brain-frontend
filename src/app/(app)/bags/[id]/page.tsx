"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import BagEditor from "@/components/SecondBrain/forms/BagEditor";
import { useBag } from "@/lib/queries/entities";

export default function EditBagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const bagId = Number(id);

  const { data, isLoading, error } = useBag(
    Number.isNaN(bagId) ? null : bagId,
  );

  if (Number.isNaN(bagId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid bag id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading bag…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this bag.</main>
    );
  }

  return (
    <BagEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="bag" id={data.id} />}
    />
  );
}
