"use client";

import React, {
  InputHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type InputVariant = "default" | "success" | "warning" | "danger";
export type InputSize = "sm" | "md" | "lg";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isFocused?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  default:
    "border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-primary-500/30 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100 dark:placeholder-secondary-500",
  success:
    "border-success-500 bg-white focus:border-success-600 focus:ring-success-500/30 dark:bg-secondary-950",
  warning:
    "border-warning-500 bg-white focus:border-warning-600 focus:ring-warning-500/30 dark:bg-secondary-950",
  danger:
    "border-danger-500 bg-white focus:border-danger-600 focus:ring-danger-500/30 dark:bg-secondary-950",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[var(--radius-control)]",
  md: "px-3.5 py-2 text-sm rounded-[var(--radius-control)]",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      inputSize = "md",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      isFocused = false,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

    useEffect(() => {
      if (isFocused) {
        localRef.current?.focus();
      }
    }, [isFocused]);

    const finalVariant = error ? "danger" : variant;
    const baseStyles =
      "block border transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed dark:disabled:bg-secondary-900";
    const widthStyles = fullWidth ? "w-full" : "";
    const paddingWithIcon = leftIcon ? "pl-10" : rightIcon ? "pr-10" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mb-1 block text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={localRef}
            className={`${baseStyles} ${variantStyles[finalVariant]} ${sizeStyles[inputSize]} ${widthStyles} ${paddingWithIcon} ${className}`}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400">
              {rightIcon}
            </div>
          )}
        </div>
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

Input.displayName = "Input";
