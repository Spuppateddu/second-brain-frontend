"use client";

import { useRouter } from "next/navigation";

import WishlistFormModal from "@/components/SecondBrain/forms/WishlistFormModal";

export default function NewWishlistPage() {
  const router = useRouter();
  return (
    <WishlistFormModal
      isOpen
      onClose={() => router.push("/wishlist")}
      onSaved={() => router.push("/wishlist")}
    />
  );
}
