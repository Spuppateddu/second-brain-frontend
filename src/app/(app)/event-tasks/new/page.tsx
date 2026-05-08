"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { EventTaskForm } from "@/components/EventTaskForm";
import { IconButton } from "@/components/UI/IconButton";
import { useCreateEventTask } from "@/lib/queries/entities";

export default function NewEventTaskPage() {
  const router = useRouter();
  const create = useCreateEventTask();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell
      title="New event task"
      maxWidth="2xl"
      headerActions={
        <IconButton
          type="button"
          variant="ghost"
          size="md"
          label="Cancel"
          onClick={() => router.push("/event-tasks")}
        >
          <HiXMark />
        </IconButton>
      }
    >
      <EventTaskForm
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
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
    </EntityListShell>
  );
}
