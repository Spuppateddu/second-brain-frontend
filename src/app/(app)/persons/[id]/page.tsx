"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import PersonEditor from "@/components/SecondBrain/forms/PersonEditor";
import { usePerson } from "@/lib/queries/entities";

export default function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const personId = Number(id);

  const { data, isLoading, error } = usePerson(
    Number.isNaN(personId) ? null : personId,
  );

  if (Number.isNaN(personId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid person id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading person…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this person.</main>
    );
  }

  return (
    <PersonEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="person" id={data.id} />}
    />
  );
}
