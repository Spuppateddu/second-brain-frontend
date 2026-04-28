"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EventTaskForm } from "@/components/EventTaskForm";
import { useCreateEventTask } from "@/lib/queries/entities";

export default function NewEventTaskPage() {
  const router = useRouter();
  const create = useCreateEventTask();
  const [error, setError] = useState<string | null>(null);

  return (
    <EventTaskForm
      mode="create"
      isPending={create.isPending}
      error={error}
      onCancel={() => router.push("/event-tasks")}
      onSubmit={async (input) => {
        setError(null);
        try {
          await create.mutateAsync(input);
          router.push("/event-tasks");
        } catch (err) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to save.";
          setError(message);
        }
      }}
    />
  );
}
