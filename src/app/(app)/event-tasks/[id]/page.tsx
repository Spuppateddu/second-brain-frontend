"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash, HiXMark } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { EventTaskForm } from "@/components/EventTaskForm";
import { IconButton } from "@/components/UI/IconButton";
import {
  useDeleteEventTask,
  useEventTask,
  useUpdateEventTask,
} from "@/lib/queries/entities";
import type { EventTask } from "@/types/entities";

function EditCard({ task }: { task: EventTask }) {
  const router = useRouter();
  const update = useUpdateEventTask(task.id);
  const remove = useDeleteEventTask();
  const [error, setError] = useState<string | null>(null);

  return (
    <EventTaskForm
      initial={task}
      submitLabel="Save"
      isPending={update.isPending}
      error={error}
      onSubmit={async (input) => {
        setError(null);
        try {
          await update.mutateAsync(input);
          router.push("/event-tasks");
        } catch (err) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to save.";
          setError(message);
        }
      }}
      extraActions={
        <IconButton
          type="button"
          variant="danger"
          size="md"
          disabled={remove.isPending}
          className="mr-auto"
          label="Delete"
          onClick={async () => {
            if (!confirm("Delete this event task?")) return;
            try {
              await remove.mutateAsync(task.id);
              router.push("/event-tasks");
            } catch {
              setError("Failed to delete.");
            }
          }}
        >
          <HiTrash />
        </IconButton>
      }
    />
  );
}

export default function EditEventTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const taskId = Number(id);
  const { data, isLoading, error } = useEventTask(
    Number.isNaN(taskId) ? null : taskId,
  );

  if (Number.isNaN(taskId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid event task id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Event · ${data.name}` : "Event task"}
      isLoading={isLoading}
      error={error}
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
      {data ? <EditCard task={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
