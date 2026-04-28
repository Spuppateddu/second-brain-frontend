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
  default: "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
  success: "border-success-500 focus:border-success-600 focus:ring-success-500",
  warning: "border-warning-500 focus:border-warning-600 focus:ring-warning-500",
  danger: "border-danger-500 focus:border-danger-600 focus:ring-danger-500",
};

const sizeStyles: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-base rounded-md",
  lg: "px-5 py-3 text-lg rounded-lg",
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
      "block border rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed";
    const widthStyles = fullWidth ? "w-full" : "";
    const paddingWithIcon = leftIcon ? "pl-10" : rightIcon ? "pr-10" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p
            className={`mt-1 text-sm ${error ? "text-danger-600" : "text-gray-500"}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
