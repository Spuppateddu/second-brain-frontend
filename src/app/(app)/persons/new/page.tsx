"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreatePerson } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "date", key: "birth_date", label: "Birth date" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewPersonPage() {
  return (
    <CreateEntityPage
      title="New person"
      fields={FIELDS}
      listHref="/persons"
      detailHref={(id) => `/persons/${id}`}
      withTags

      useCreate={useCreatePerson}
    />
  );
}
