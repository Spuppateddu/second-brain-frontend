"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeleteSoftware,
  useSoftwareOne,
  useUpdateSoftware, type SoftwareInput
} from "@/lib/queries/entities";
import type { Software } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditSoftwarePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Software, SoftwareInput>
      id={Number(id)}
      title="Software"
      fields={FIELDS}
      listHref="/software"
      toFormValues={(item) => ({
        title: item.title,
        description: item.description ?? ""
})}
      withTags

      useOne={useSoftwareOne}
      useUpdate={useUpdateSoftware}
      useDelete={useDeleteSoftware}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="software" id={item.id} />
          <LinkedEntitiesPanel type="software" id={item.id} />
        </>
      )}
    />
  );
}
