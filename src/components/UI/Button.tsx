"use client";

import React, { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "ghost";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed",
  secondary:
    "bg-secondary-500 text-primary-900 hover:bg-secondary-600 active:bg-secondary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed",
  success:
    "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 disabled:bg-success-300 disabled:cursor-not-allowed",
  info:
    "bg-info-500 text-white hover:bg-info-600 active:bg-info-700 disabled:bg-info-300 disabled:cursor-not-allowed",
  warning:
    "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 disabled:bg-warning-300 disabled:cursor-not-allowed",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 disabled:bg-danger-300 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100 disabled:text-primary-300 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "px-2 py-1 text-xs rounded",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-1.5 text-sm md:px-4 md:py-2 md:text-base rounded-md",
  lg: "px-4 py-2 text-base md:px-5 md:py-2.5 md:text-lg rounded-lg",
  xl: "px-5 py-2.5 text-lg md:px-6 md:py-3 md:text-xl rounded-lg",
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
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2";
    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
