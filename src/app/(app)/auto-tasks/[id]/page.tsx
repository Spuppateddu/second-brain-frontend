"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { AutoTaskForm } from "@/components/AutoTaskForm";
import { EntityListShell } from "@/components/EntityListShell";
import {
  useAutoTaskRule,
  useDeleteAutoTaskRule,
  useUpdateAutoTaskRule,
} from "@/lib/queries/entities";
import type { AutoTaskRule } from "@/types/entities";

function EditCard({ rule }: { rule: AutoTaskRule }) {
  const router = useRouter();
  const update = useUpdateAutoTaskRule(rule.id);
  const remove = useDeleteAutoTaskRule();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <AutoTaskForm
        initial={rule}
        submitLabel="Save"
        isPending={update.isPending}
        error={error}
        onCancel={() => router.push("/auto-tasks")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await update.mutateAsync(input);
            router.push("/auto-tasks");
          } catch (err) {
            const message =
              (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ?? "Failed to save.";
            setError(message);
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          variant="danger-soft"
          size="sm"
          isDisabled={remove.isPending}
          onClick={async () => {
            if (!confirm("Delete this rule?")) return;
            try {
              await remove.mutateAsync(rule.id);
              router.push("/auto-tasks");
            } catch {
              setError("Failed to delete.");
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export default function EditAutoTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ruleId = Number(id);
  const { data, isLoading, error } = useAutoTaskRule(
    Number.isNaN(ruleId) ? null : ruleId,
  );

  if (Number.isNaN(ruleId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid auto-task id.</p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Rule · ${data.name}` : "Auto-task rule"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <EditCard rule={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
