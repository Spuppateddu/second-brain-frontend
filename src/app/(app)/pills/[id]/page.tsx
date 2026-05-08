"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash, HiXMark } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { PillForm } from "@/components/PillForm";
import { IconButton } from "@/components/UI/IconButton";
import {
  useDeletePill,
  usePill,
  useUpdatePill,
} from "@/lib/queries/entities";
import type { PillFull } from "@/lib/queries/entities";

function EditCard({ pill }: { pill: PillFull }) {
  const router = useRouter();
  const update = useUpdatePill(pill.id);
  const remove = useDeletePill();
  const [error, setError] = useState<string | null>(null);

  return (
    <PillForm
      initial={pill}
      submitLabel="Save"
      isPending={update.isPending}
      error={error}
      onSubmit={async (input) => {
        setError(null);
        try {
          await update.mutateAsync(input);
          router.push("/pills");
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
            if (!confirm("Delete this pill?")) return;
            try {
              await remove.mutateAsync(pill.id);
              router.push("/pills");
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

export default function EditPillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const pillId = Number(id);
  const { data, isLoading, error } = usePill(
    Number.isNaN(pillId) ? null : pillId,
  );

  if (Number.isNaN(pillId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid pill id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Pill · ${data.name}` : "Pill"}
      isLoading={isLoading}
      error={error}
      maxWidth="3xl"
      headerActions={
        <IconButton
          type="button"
          variant="ghost"
          size="md"
          label="Cancel"
          onClick={() => router.push("/pills")}
        >
          <HiXMark />
        </IconButton>
      }
    >
      {data ? <EditCard pill={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
