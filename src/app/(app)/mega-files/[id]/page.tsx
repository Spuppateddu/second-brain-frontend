"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { HiTrash } from "react-icons/hi2";

import { EntityListShell } from "@/components/EntityListShell";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { MegaFileForm } from "@/components/MegaFileForm";
import AnchorToggleButton from "@/components/SecondBrain/AnchorToggleButton";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import { FormSection } from "@/components/UI/FormSection";
import { IconButton } from "@/components/UI/IconButton";
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
      <FormSection
        title="Details"
        actions={
          <IconButton
            size="sm"
            variant="danger"
            label="Delete mega file"
            disabled={remove.isPending}
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
            <HiTrash />
          </IconButton>
        }
      >
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
                (err as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message ?? "Failed to save.";
              setError(message);
            }
          }}
        />
      </FormSection>
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
      <main className="p-4 sm:p-6 lg:py-10">
        <p className="text-sm text-danger-600 dark:text-danger-400">
          Invalid mega file id.
        </p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `Mega file · ${data.title}` : "Mega file"}
      isLoading={isLoading}
      error={error}
      headerActions={
        data ? <AnchorToggleButton type="mega_file" id={data.id} /> : undefined
      }
    >
      {data ? <MegaFileEditCard file={data} key={data.id} /> : null}
    </EntityListShell>
  );
}
