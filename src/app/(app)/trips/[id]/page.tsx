"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import TripFormModal from "@/components/SecondBrain/forms/TripFormModal";
import { useTrip } from "@/lib/queries/entities";

export default function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const tripId = Number(id);

  const { data: trip, isLoading, error } = useTrip(
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

  if (error || !trip) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this trip.
      </main>
    );
  }

  return (
    <TripFormModal
      isOpen
      initial={trip}
      onClose={() => router.push("/trips")}
    />
  );
}
