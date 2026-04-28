"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { EventTaskForm } from "@/components/EventTaskForm";
import {
  useEventTask,
  useUpdateEventTask,
} from "@/lib/queries/entities";
import type { EventTask } from "@/types/entities";

function EditCard({ task }: { task: EventTask }) {
  const router = useRouter();
  const update = useUpdateEventTask(task.id);
  const [error, setError] = useState<string | null>(null);

  return (
    <EventTaskForm
      initial={task}
      mode="edit"
      isPending={update.isPending}
      error={error}
      onCancel={() => router.push("/event-tasks")}
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
    />
  );
}

export default function EditEventTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const taskId = Number(id);
  const { data, isLoading, error } = useEventTask(
    Number.isNaN(taskId) ? null : taskId,
  );

  if (Number.isNaN(taskId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid event task id.</p>
      </main>
    );
  }

  if (isLoading || error || !data) {
    return (
      <EntityListShell
        title="Edit Event Task"
        isLoading={isLoading}
        error={error}
      >
        <p className="text-sm text-zinc-500">Loading…</p>
      </EntityListShell>
    );
  }

  return <EditCard task={data} key={data.id} />;
}
