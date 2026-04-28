"use client";

import { use } from "react";

import { GenericEditPage } from "@/components/EntityCrudPages";
import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import { SharableLinksPanel } from "@/components/SharableLinksPanel";
import type { FieldDef } from "@/components/SimpleEntityForm";
import {
  useDeleteWishlist,
  useUpdateWishlist,
  useWishlistOne, type WishlistInput
} from "@/lib/queries/entities";
import type { WishlistItem } from "@/types/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "url", key: "link", label: "Link" },
  { kind: "textarea", key: "notes", label: "Notes" },
];

export default function EditWishlistPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <GenericEditPage<WishlistItem, WishlistInput>
      id={Number(id)}
      title="Wishlist item"
      fields={FIELDS}
      listHref="/wishlist"
      toFormValues={(item) => ({
        name: item.name,
        link: item.link ?? "",
        notes: item.notes ?? ""
})}
      withTags

      useOne={useWishlistOne}
      useUpdate={useUpdateWishlist}
      useDelete={useDeleteWishlist}
      renderBelow={(item) => (
        <>
          <SharableLinksPanel type="wishlist_item" id={item.id} />
          <LinkedEntitiesPanel type="wishlist_item" id={item.id} />
        </>
      )}
    />
  );
}
