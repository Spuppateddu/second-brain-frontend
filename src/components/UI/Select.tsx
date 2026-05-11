"use client";

import React, { SelectHTMLAttributes, forwardRef } from "react";

export type SelectVariant = "default" | "success" | "warning" | "danger";
export type SelectSize = "sm" | "md" | "lg";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
  inputSize?: SelectSize;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<SelectVariant, string> = {
  default:
    "border-secondary-300 bg-white text-secondary-900 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100",
  success:
    "border-success-500 bg-white focus:border-success-600 focus:ring-success-500/30 dark:bg-secondary-950",
  warning:
    "border-warning-500 bg-white focus:border-warning-600 focus:ring-warning-500/30 dark:bg-secondary-950",
  danger:
    "border-danger-500 bg-white focus:border-danger-600 focus:ring-danger-500/30 dark:bg-secondary-950",
};

const sizeStyles: Record<SelectSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-control)]",
  md: "px-3.5 py-2 text-sm rounded-[var(--radius-control)]",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = "default",
      inputSize = "md",
      label,
      helperText,
      error,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const finalVariant = error ? "danger" : variant;
    const baseStyles =
      "block border transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed dark:disabled:bg-secondary-900";
    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`${baseStyles} ${variantStyles[finalVariant]} ${sizeStyles[inputSize]} ${widthStyles} ${className}`}
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
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

Select.displayName = "Select";
