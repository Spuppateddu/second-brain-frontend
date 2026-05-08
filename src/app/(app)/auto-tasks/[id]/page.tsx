"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash } from "react-icons/hi2";

import { AutoTaskForm } from "@/components/AutoTaskForm";
import { EntityListShell } from "@/components/EntityListShell";
import { IconButton } from "@/components/UI/IconButton";
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
      extraActions={
        <IconButton
          type="button"
          variant="danger"
          size="sm"
          disabled={remove.isPending}
          className="mr-auto"
          label="Delete"
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
          <HiTrash />
        </IconButton>
      }
    />
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
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid auto-task id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Rule · ${data.name}` : "Auto-task rule"}
      isLoading={isLoading}
      error={error}
      maxWidth="3xl"
    >
      {data ? <EditCard rule={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
