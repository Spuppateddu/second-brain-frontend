"use client";

import React, { useCallback, useState } from "react";
import { HiArrowLeft, HiArrowRight, HiCheck } from "react-icons/hi2";

import { IconButton } from "./IconButton";

export interface WizardStep {
  /** Stable id for the step (used for keys and goto). */
  id: string;
  /** Short title shown in the stepper. */
  title: string;
  /** Optional one-liner shown above the step body. */
  description?: string;
  /** Optional icon for the stepper bullet. Defaults to the step number. */
  icon?: React.ReactNode;
  /** Disable forward nav from this step until true. Defaults to true. */
  canAdvance?: boolean;
  /** Step body. */
  content: React.ReactNode;
}

interface WizardProps {
  steps: WizardStep[];
  /** Fires when the user submits the final step. */
  onComplete: () => void | Promise<void>;
  /** Pending state for the submit button. */
  isSubmitting?: boolean;
  /** Tooltip on the final submit button. */
  submitLabel?: string;
  /** Optional inline error to display below the step body. */
  error?: string | null;
  /** Slot for extra footer-left actions (e.g. Delete on edit screens). */
  extraActions?: React.ReactNode;
  /** Additional classes on the outer wrapper. */
  className?: string;
}

export function Wizard({
  steps,
  onComplete,
  isSubmitting = false,
  submitLabel = "Save",
  error,
  extraActions,
  className = "",
}: WizardProps) {
  const [index, setIndex] = useState(0);

  const safeIndex = Math.min(Math.max(0, index), steps.length - 1);
  const current = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;
  const canAdvance = current?.canAdvance ?? true;

  const back = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setIndex((i) => Math.min(steps.length - 1, i + 1));
  }, [steps.length]);

  if (!current) return null;

  const progress = ((safeIndex + 1) / steps.length) * 100;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div
        role="progressbar"
        aria-label={`Step ${safeIndex + 1} of ${steps.length}`}
        aria-valuenow={safeIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800"
      >
        <div
          className="h-full bg-primary-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step body */}
      <section
        aria-labelledby={`wizard-step-${current.id}`}
        className="rounded-[var(--radius-card)] border border-secondary-200 bg-white shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950"
      >
        <header className="px-4 py-3 sm:px-5 sm:py-4">
          <h2
            id={`wizard-step-${current.id}`}
            className="text-base font-semibold text-secondary-900 dark:text-secondary-100"
          >
            {current.title}
          </h2>
          {current.description ? (
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              {current.description}
            </p>
          ) : null}
        </header>
        <div className="flex flex-col gap-3 border-t border-secondary-200 p-4 dark:border-secondary-800 sm:p-5">
          {current.content}
        </div>
      </section>

      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}

      {/* Footer: Back on the left, primary on the right.
          On mobile (<sm) the primary action takes the full row width;
          Back sits above it for safe one-thumb reach. */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconButton
            type="button"
            variant="secondary"
            size="md"
            label="Back"
            onClick={back}
            disabled={isFirst}
          >
            <HiArrowLeft />
          </IconButton>
          {extraActions}
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {isLast ? (
            <IconButton
              type="button"
              variant="primary"
              size="md"
              label={submitLabel}
              loading={isSubmitting}
              disabled={!canAdvance || isSubmitting}
              onClick={() => {
                void onComplete();
              }}
            >
              <HiCheck />
            </IconButton>
          ) : (
            <IconButton
              type="button"
              variant="primary"
              size="md"
              label="Next"
              disabled={!canAdvance}
              onClick={next}
            >
              <HiArrowRight />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}
