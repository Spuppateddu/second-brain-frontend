"use client";

import { CreateEntityPage } from "@/components/EntityCrudPages";
import type { FieldDef } from "@/components/SimpleEntityForm";
import { useCreateWishlist } from "@/lib/queries/entities";

const FIELDS: FieldDef[] = [
  { kind: "text", key: "name", label: "Name", required: true },
  { kind: "url", key: "link", label: "Link" },
  { kind: "textarea", key: "notes", label: "Notes" },
];

export default function NewWishlistPage() {
  return (
    <CreateEntityPage
      title="New wishlist item"
      fields={FIELDS}
      listHref="/wishlist"
      detailHref={(id) => `/wishlist/${id}`}
      withTags

      useCreate={useCreateWishlist}
    />
  );
}
