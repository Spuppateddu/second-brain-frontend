"use client";

import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  actions,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-secondary-200 bg-white shadow-[var(--shadow-card)] dark:border-secondary-800 dark:bg-secondary-950 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-secondary-900 dark:text-secondary-100">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </header>
      <div className="flex flex-col gap-3 border-t border-secondary-200 p-4 dark:border-secondary-800 sm:p-5">
        {children}
      </div>
    </section>
  );
}
