"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { MegaFileForm } from "@/components/MegaFileForm";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import {
  useDeleteMegaFile,
  useMegaFile,
  useUpdateMegaFile,
} from "@/lib/queries/entities";
import type { MegaFile } from "@/types/entities";

function MegaFileEditCard({ file }: { file: MegaFile }) {
  const router = useRouter();
  const update = useUpdateMegaFile(file.id);
  const remove = useDeleteMegaFile();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <MegaFileForm
        initial={file}
        submitLabel="Save"
        isPending={update.isPending}
        error={error}
        onCancel={() => router.push("/mega-files")}
        onSubmit={async (input) => {
          setError(null);
          try {
            await update.mutateAsync(input);
            router.push("/mega-files");
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
            if (!confirm("Delete this mega file?")) return;
            try {
              await remove.mutateAsync(file.id);
              router.push("/mega-files");
            } catch {
              setError("Failed to delete.");
            }
          }}
        >
          Delete
        </Button>
      </div>
      <SharableLinksPanel type="mega_file" id={file.id} />
      <LinkedEntitiesPanel type="mega_file" id={file.id} />
    </div>
  );
}

export default function EditMegaFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const fileId = Number(id);
  const { data, isLoading, error } = useMegaFile(
    Number.isNaN(fileId) ? null : fileId,
  );

  if (Number.isNaN(fileId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid mega file id.</p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Mega file · ${data.title}` : "Mega file"}
      isLoading={isLoading}
      error={error}
    >
      {data ? <MegaFileEditCard file={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
