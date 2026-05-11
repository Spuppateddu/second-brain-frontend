"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HiXMark } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { PillForm } from "@/components/PillForm";
import { IconButton } from "@/components/UI/IconButton";
import { useCreatePill } from "@/lib/queries/entities";

export default function NewPillPage() {
  const router = useRouter();
  const create = useCreatePill();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell
      title="New pill"
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
      <PillForm
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
        onSubmit={async (input) => {
          setError(null);
          try {
            await create.mutateAsync(input);
            router.push("/pills");
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
