"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";

export function FormFieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
      {children}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function ModalTitleInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus
      className="w-full border-0 bg-transparent text-lg font-semibold outline-none placeholder:text-zinc-400 dark:text-zinc-100"
    />
  );
}

export function FooterCloseButton({
  onClick,
  isPending,
  label = "Close",
}: {
  onClick: () => void;
  isPending?: boolean;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      isDisabled={isPending}
    >
      {label}
    </Button>
  );
}

export function FooterPrimaryButton({
  onClick,
  isPending,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  isPending?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      isDisabled={isPending}
    >
      {isPending ? "Saving…" : children}
    </Button>
  );
}
