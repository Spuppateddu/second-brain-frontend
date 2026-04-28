"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AutoTaskForm } from "@/components/AutoTaskForm";
import { EntityListShell } from "@/components/EntityListShell";
import { useCreateAutoTaskRule } from "@/lib/queries/entities";

export default function NewAutoTaskPage() {
  const router = useRouter();
  const create = useCreateAutoTaskRule();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell title="New auto-task rule">
      <AutoTaskForm
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
        onCancel={() => router.push("/auto-tasks")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await create.mutateAsync(input);
            router.push("/auto-tasks");
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
