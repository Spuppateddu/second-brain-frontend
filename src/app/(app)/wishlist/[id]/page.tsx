"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { LinkedEntitiesPanel } from "@/components/LinkedEntitiesPanel";
import WishlistEditor from "@/components/SecondBrain/forms/WishlistEditor";
import { useWishlistOne } from "@/lib/queries/entities";

export default function EditWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = Number(id);

  const { data, isLoading, error } = useWishlistOne(
    Number.isNaN(itemId) ? null : itemId,
  );

  if (Number.isNaN(itemId)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid wishlist id.</p>
      </main>
    );
  }
  if (isLoading) {
    return (
      <main className="p-6 text-sm text-zinc-500">Loading wishlist item…</main>
    );
  }
  if (error || !data) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this wishlist item.
      </main>
    );
  }

  return (
    <WishlistEditor
      mode="page"
      initial={data}
      onClose={() => router.push("/second-brain")}
      belowBody={<LinkedEntitiesPanel type="wishlist_item" id={data.id} />}
    />
  );
}
