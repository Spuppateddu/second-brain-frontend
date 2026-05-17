"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import PlaceEditor from "@/components/SecondBrain/forms/PlaceEditor";
import { usePlace } from "@/lib/queries/entities";

export default function EditPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const placeId = Number(id);

  const { data, isLoading, error } = usePlace(
    Number.isNaN(placeId) ? null : placeId,
  );

  if (Number.isNaN(placeId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid place id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading place…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this place.</main>
    );
  }

  return (
    <PlaceEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="place" id={data.id} />}
    />
  );
}
