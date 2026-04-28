"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreateHardware } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewHardwarePage() {
  return (
    <CreateEntityPage
      title="New hardware"
      fields={FIELDS}
      listHref="/hardware"
      detailHref={(id) => `/hardware/${id}`}
      withTags

      useCreate={useCreateHardware}
    />
  );
}
