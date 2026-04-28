"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreateSoftware } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewSoftwarePage() {
  return (
    <CreateEntityPage
      title="New software"
      fields={FIELDS}
      listHref="/software"
      detailHref={(id) => `/software/${id}`}
      withTags

      useCreate={useCreateSoftware}
    />
  );
}
