"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreateBag } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewBagPage() {
  return (
    <CreateEntityPage
      title="New bag"
      fields={FIELDS}
      listHref="/bags"
      detailHref={(id) => `/bags/${id}`}
      withTags

      useCreate={useCreateBag}
    />
  );
}
