"use client";

import React, { TextareaHTMLAttributes, forwardRef } from "react";

export type TextareaVariant = "default" | "success" | "warning" | "danger";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextareaVariant;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<TextareaVariant, string> = {
  default:
    "border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100 dark:placeholder-secondary-500",
  success:
    "border-success-500 bg-white focus:border-success-600 focus:ring-success-500/30 dark:bg-secondary-950",
  warning:
    "border-warning-500 bg-white focus:border-warning-600 focus:ring-warning-500/30 dark:bg-secondary-950",
  danger:
    "border-danger-500 bg-white focus:border-danger-600 focus:ring-danger-500/30 dark:bg-secondary-950",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = "default",
      label,
      helperText,
      error,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const finalVariant = error ? "danger" : variant;
    const baseStyles =
      "block border px-3.5 py-2 text-sm rounded-[var(--radius-control)] transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed dark:disabled:bg-secondary-900";
    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`${baseStyles} ${variantStyles[finalVariant]} ${widthStyles} ${className}`}
          disabled={disabled}
          {...props}
        />
        {(helperText || error) && (
          <p
            className={`mt-1 text-xs ${error ? "text-danger-600" : "text-secondary-500"}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
