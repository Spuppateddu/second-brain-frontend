"use client";

import React, { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "success"
  | "info"
  | "warning";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /**
   * Render as a square icon-only button. The button's children should be a
   * single icon. Always pair with `aria-label` for accessibility.
   */
  iconOnly?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300 disabled:cursor-not-allowed",
  secondary:
    "border border-secondary-300 bg-white text-secondary-800 hover:bg-secondary-50 active:bg-secondary-100 disabled:bg-secondary-100 disabled:text-secondary-400 disabled:cursor-not-allowed dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-100 dark:hover:bg-secondary-800",
  danger:
    "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 disabled:bg-danger-300 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200 disabled:text-secondary-300 disabled:cursor-not-allowed dark:text-secondary-300 dark:hover:bg-secondary-800",
  success:
    "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 disabled:bg-success-300 disabled:cursor-not-allowed",
  info:
    "bg-info-500 text-white hover:bg-info-600 active:bg-info-700 disabled:bg-info-300 disabled:cursor-not-allowed",
  warning:
    "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 disabled:bg-warning-300 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-control)]",
  md: "px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-[var(--radius-control)]",
  lg: "px-4 py-2 text-base md:px-5 md:py-2.5 md:text-lg rounded-lg",
  xl: "px-5 py-2.5 text-lg md:px-6 md:py-3 md:text-xl rounded-lg",
};

const iconOnlySizeStyles: Record<ButtonSize, string> = {
  xs: "p-1 text-xs rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5",
  sm: "p-1.5 text-sm rounded-[var(--radius-control)] [&>svg]:h-4 [&>svg]:w-4",
  md: "p-2 text-base rounded-[var(--radius-control)] [&>svg]:h-5 [&>svg]:w-5",
  lg: "p-2.5 text-lg rounded-lg [&>svg]:h-5 [&>svg]:w-5",
  xl: "p-3 text-xl rounded-lg [&>svg]:h-6 [&>svg]:w-6",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex shrink-0 items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";
    const widthStyles = fullWidth ? "w-full" : "";
    const sizeClass = iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size];

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeClass} ${widthStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className={`animate-spin h-4 w-4 ${iconOnly ? "" : "-ml-1 mr-2"}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
