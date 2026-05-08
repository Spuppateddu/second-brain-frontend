"use client";

import { Tooltip } from "@heroui/react";
import React, { ButtonHTMLAttributes } from "react";

import { Button, type ButtonSize, type ButtonVariant } from "./Button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tooltip + aria-label. Required: icon-only buttons need an accessible name. */
  label: string;
  /** Icon element. */
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Hide the tooltip (keeps aria-label). */
  noTooltip?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, noTooltip, children, ...props }, ref) => {
    const button = (
      <Button ref={ref} iconOnly aria-label={label} {...props}>
        {children}
      </Button>
    );
    if (noTooltip) return button;
    return (
      <Tooltip delay={250} closeDelay={0}>
        <Tooltip.Trigger>{button}</Tooltip.Trigger>
        <Tooltip.Content className="rounded-md bg-secondary-900 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-secondary-100 dark:text-secondary-900">
          {label}
        </Tooltip.Content>
      </Tooltip>
    );
  },
);

IconButton.displayName = "IconButton";
