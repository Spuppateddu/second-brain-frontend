"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

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
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Public share links</h3>
        {links.isLoading ? (
          <span className="text-xs text-zinc-500">Loading…</span>
        ) : (
          <span className="text-xs text-zinc-500">
            {list.length} active
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-500">New link expires in</span>
        {PRESETS.map((preset) => (
          <Button
            key={preset.hours}
            type="button"
            variant="outline"
            size="sm"
            isDisabled={create.isPending}
            onClick={() => create.mutate(preset.hours)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">No active share links.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((link) => {
            const url = link.url ?? shareUrl(link.token);
            return (
              <li
                key={link.token}
                className="flex flex-col gap-1 rounded-md border border-zinc-100 bg-zinc-50 p-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">
                    Expires {DATETIME.format(new Date(link.expires_at))}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
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
                      className="text-xs text-zinc-500 hover:text-danger"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(link.token)}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <code className="truncate text-xs">{url}</code>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
