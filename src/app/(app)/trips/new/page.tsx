"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreateTrip } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "date", key: "start_date", label: "Start date" },
  { kind: "date", key: "end_date", label: "End date" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function NewTripPage() {
  return (
    <CreateEntityPage
      title="New trip"
      fields={FIELDS}
      listHref="/trips"
      detailHref={(id) => `/trips/${id}`}
      withTags

      useCreate={useCreateTrip}
    />
  );
}
