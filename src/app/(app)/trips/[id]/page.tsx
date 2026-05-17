"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import TripEditor from "@/components/SecondBrain/forms/TripEditor";
import { useTrip } from "@/lib/queries/entities";

export default function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const tripId = Number(id);

  const { data, isLoading, error } = useTrip(
    Number.isNaN(tripId) ? null : tripId,
  );

  if (Number.isNaN(tripId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid trip id.</p>
      </main>
    );
  }
  if (isLoading) {
    return <main className="p-6 text-sm text-zinc-500">Loading trip…</main>;
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">Couldn&rsquo;t load this trip.</main>
    );
  }

  return (
    <TripEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="trip" id={data.id} />}
    />
  );
}
