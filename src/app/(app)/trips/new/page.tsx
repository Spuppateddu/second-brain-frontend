"use client";

import { useRouter } from "next/navigation";

import TripEditor from "@/components/SecondBrain/forms/TripEditor";

export default function NewTripPage() {
  const router = useRouter();
  return (
    <TripEditor
      mode="modal"
      onClose={() => router.push("/trips")}
      onSaved={() => router.push("/trips")}
    />
  );
}
