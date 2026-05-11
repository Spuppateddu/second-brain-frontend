"use client";

import { useState } from "react";

import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import {
  useCreateSharableLink,
  useDeleteSharableLink,
  useSharableLinks,
  type ShareableType,
} from "@/lib/queries/entities";

const DATETIME = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const PRESETS: { label: string; hours: number }[] = [
  { label: "1 hour", hours: 1 },
  { label: "1 day", hours: 24 },
  { label: "1 week", hours: 24 * 7 },
  { label: "1 month", hours: 24 * 30 },
];

function shareUrl(token: string): string {
  // Public-facing route on the SPA itself (renders via /share/[token]).
  // Falls back to relative path during SSR.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${token}`;
}

export function SharableLinksPanel({
  type,
  id,
}: {
  type: ShareableType;
  id: number;
}) {
  const links = useSharableLinks(type, id);
  const create = useCreateSharableLink(type, id);
  const remove = useDeleteSharableLink(type, id);
  const [copied, setCopied] = useState<string | null>(null);

  const list = links.data ?? [];

  return (
    <FormSection
      title="Public share links"
      actions={
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {links.isLoading ? "Loading…" : `${list.length} active`}
        </span>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          New link expires in
        </span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.hours}
            type="button"
            variant="secondary"
            size="sm"
            disabled={create.isPending}
            onClick={() => create.mutate(preset.hours)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          No active share links.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((link) => {
            const url = link.url ?? shareUrl(link.token);
            return (
              <li
                key={link.token}
                className="flex flex-col gap-1 rounded-[var(--radius-control)] border border-secondary-100 bg-secondary-50 p-2 text-sm dark:border-secondary-800 dark:bg-secondary-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    Expires {DATETIME.format(new Date(link.expires_at))}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      onClick={async () => {
                        await navigator.clipboard.writeText(url);
                        setCopied(link.token);
                        setTimeout(
                          () =>
                            setCopied((current) =>
                              current === link.token ? null : current,
                            ),
                          1500,
                        );
                      }}
                    >
                      {copied === link.token ? "Copied!" : "Copy"}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-secondary-500 hover:text-danger-600 dark:text-secondary-400 dark:hover:text-danger-400"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(link.token)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <code className="truncate text-xs text-secondary-700 dark:text-secondary-300">
                  {url}
                </code>
              </li>
            );
          })}
        </ul>
      )}
    </FormSection>
  );
}
