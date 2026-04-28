"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useBag,
  useDeleteBag,
  useUpdateBag, type BagInput
} from "@/lib/queries/entities";
import type { Bag } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "title", label: "Title", required: true },
  { kind: "textarea", key: "description", label: "Description" },
];

export default function EditBagPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<Bag, BagInput>
      id={Number(id)}
      title="Bag"
      fields={FIELDS}
      listHref="/bags"
      toFormValues={(item) => ({
        title: item.title,
        description: item.description ?? ""
})}
      withTags

      useOne={useBag}
      useUpdate={useUpdateBag}
      useDelete={useDeleteBag}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="bag" id={item.id} />
          <LinkedEntitiesPanel type="bag" id={item.id} />
        </>
      )}
    />
  );
}
