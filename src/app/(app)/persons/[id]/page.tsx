"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeletePerson,
  usePerson,
  useUpdatePerson, type PersonInput
} from "@/lib/queries/entities";
import type { Person } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "date", key: "birth_date", label: "Birth date" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditPersonPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Person, PersonInput>
      id={Number(id)}
      title="Person"
      fields={FIELDS}
      listHref="/persons"
      toFormValues={(item) => ({
        name: item.name,
        birth_date: item.birth_date ?? "",
        description: item.description ?? ""
})}
      withTags

      useOne={usePerson}
      useUpdate={useUpdatePerson}
      useDelete={useDeletePerson}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="person" id={item.id} />
          <LinkedEntitiesPanel type="person" id={item.id} />
        </>
      )}
    />
  );
}
