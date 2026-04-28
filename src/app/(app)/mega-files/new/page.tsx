"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { MegaFileForm } from "@/components/MegaFileForm";
import { useCreateMegaFile } from "@/lib/queries/entities";

export default function NewMegaFilePage() {
  const router = useRouter();
  const create = useCreateMegaFile();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell title="New mega file">
      <MegaFileForm
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
        onCancel={() => router.push("/mega-files")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await create.mutateAsync(input);
            router.push("/mega-files");
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
