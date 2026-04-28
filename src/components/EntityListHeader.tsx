"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

export function NewEntityButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="flex justify-end">
      <Link href={href}>
        <Button variant="primary" size="sm">
          + {label}
        </Button>
      </Link>
    </div>
  );
}

export function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="shrink-0 text-xs text-zinc-500 hover:underline"
    >
      Edit
    </Link>
  );
}
