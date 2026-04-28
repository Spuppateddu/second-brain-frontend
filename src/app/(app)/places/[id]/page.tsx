"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeletePlace,
  usePlace,
  useUpdatePlace, type PlaceInput
} from "@/lib/queries/entities";
import type { Place } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "url", key: "url", label: "URL" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditPlacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Place, PlaceInput>
      id={Number(id)}
      title="Place"
      fields={FIELDS}
      listHref="/places"
      toFormValues={(item) => ({
        name: item.name,
        url: item.url ?? "",
        description: item.description ?? ""
})}
      withTags

      useOne={usePlace}
      useUpdate={useUpdatePlace}
      useDelete={useDeletePlace}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="place" id={item.id} />
          <LinkedEntitiesPanel type="place" id={item.id} />
        </>
      )}
    />
  );
}
