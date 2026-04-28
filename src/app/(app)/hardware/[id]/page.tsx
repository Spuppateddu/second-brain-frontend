"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeleteHardware,
  useHardwareOne,
  useUpdateHardware, type HardwareInput
} from "@/lib/queries/entities";
import type { Hardware } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditHardwarePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Hardware, HardwareInput>
      id={Number(id)}
      title="Hardware"
      fields={FIELDS}
      listHref="/hardware"
      toFormValues={(item) => ({
        title: item.title,
        description: item.description ?? ""
})}
      withTags

      useOne={useHardwareOne}
      useUpdate={useUpdateHardware}
      useDelete={useDeleteHardware}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="hardware" id={item.id} />
          <LinkedEntitiesPanel type="hardware" id={item.id} />
        </>
      )}
    />
  );
}
