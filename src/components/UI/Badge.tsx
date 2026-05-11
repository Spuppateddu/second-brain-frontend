"use client";

import type { ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "accent"
  | "info"
  | "success"
  | "warning"
  | "danger";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    "bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300",
  primary:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200",
  accent:
    "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200",
  info:
    "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-200",
  success:
    "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  warning:
    "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-200",
  danger:
    "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
