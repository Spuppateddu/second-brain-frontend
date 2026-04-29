"use client";

import { useRouter } from "next/navigation";

import TripFormModal from "@/components/SecondBrain/forms/TripFormModal";

export default function NewTripPage() {
  const router = useRouter();
  return (
    <TripFormModal
      isOpen
      onClose={() => router.push("/trips")}
      onSaved={() => router.push("/trips")}
    />
  );
}
