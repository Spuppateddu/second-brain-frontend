"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreatePlace } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "url", key: "url", label: "URL" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewPlacePage() {
  return (
    <CreateEntityPage
      title="New place"
      fields={FIELDS}
      listHref="/places"
      detailHref={(id) => `/places/${id}`}
      withTags

      useCreate={useCreatePlace}
    />
  );
}
