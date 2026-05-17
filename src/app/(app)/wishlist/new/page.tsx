"use client";

import { useRouter } from "next/navigation";

import WishlistEditor from "@/components/SecondBrain/forms/WishlistEditor";

export default function NewWishlistPage() {
  const router = useRouter();
  return (
    <WishlistEditor
      mode="modal"
      onClose={() => router.push("/wishlist")}
      onSaved={() => router.push("/wishlist")}
    />
  );
}
