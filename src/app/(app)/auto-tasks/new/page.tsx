"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2";

import { AutoTaskWizard } from "@/components/AutoTaskWizard";
import { EntityListShell } from "@/components/EntityListShell";
import { IconButton } from "@/components/UI/IconButton";
import { useCreateAutoTaskRule } from "@/lib/queries/entities";

export default function NewAutoTaskPage() {
  const router = useRouter();
  const create = useCreateAutoTaskRule();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell
      title="New auto-task rule"
      maxWidth="3xl"
      headerActions={
        <IconButton
          type="button"
          variant="ghost"
          size="md"
          label="Cancel"
          onClick={() => router.push("/auto-tasks")}
        >
          <HiXMark />
        </IconButton>
      }
    >
      <AutoTaskWizard
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
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
