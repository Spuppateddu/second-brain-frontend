"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import WishlistFormModal from "@/components/SecondBrain/forms/WishlistFormModal";
import { useWishlistOne } from "@/lib/queries/entities";

export default function EditWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const itemId = Number(id);

  const { data: item, isLoading, error } = useWishlistOne(
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

  if (error || !item) {
    return (
      <main className="p-6 text-sm text-danger">
        Couldn&rsquo;t load this wishlist item.
      </main>
    );
  }

  return (
    <WishlistFormModal
      isOpen
      initial={item}
      onClose={() => router.push("/wishlist")}
    />
  );
}
