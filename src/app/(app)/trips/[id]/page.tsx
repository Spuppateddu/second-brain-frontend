"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeleteTrip,
  useTrip,
  useUpdateTrip, type TripInput
} from "@/lib/queries/entities";
import type { Trip } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "date", key: "start_date", label: "Start date" },
  { kind: "date", key: "end_date", label: "End date" },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditTripPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Trip, TripInput>
      id={Number(id)}
      title="Trip"
      fields={FIELDS}
      listHref="/trips"
      toFormValues={(item) => ({
        name: item.name,
        start_date: item.start_date ?? "",
        end_date: item.end_date ?? "",
        description: item.description ?? ""
})}
      withTags

      useOne={useTrip}
      useUpdate={useUpdateTrip}
      useDelete={useDeleteTrip}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="trip" id={item.id} />
          <LinkedEntitiesPanel type="trip" id={item.id} />
        </>
      )}
    />
  );
}
