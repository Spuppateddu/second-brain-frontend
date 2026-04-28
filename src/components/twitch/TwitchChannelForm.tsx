"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HiInformationCircle } from "react-icons/hi2";

import { Input } from "@/components/UI/Input";
import type { TwitchChannelInput } from "@/lib/queries/heavy";
import type { TwitchChannelView } from "@/types/heavy";

type Mode = "create" | "edit";

type FormErrors = Partial<Record<keyof TwitchChannelInput, string>>;

export function TwitchChannelForm({
  mode,
  channel,
  isPending,
  onSubmit,
}: {
  mode: Mode;
  channel?: TwitchChannelView;
  isPending: boolean;
  onSubmit: (payload: TwitchChannelInput) => Promise<void>;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(channel?.url ?? "");
  const [description, setDescription] = useState(channel?.description ?? "");
  const [isActive, setIsActive] = useState(channel?.is_active ?? true);
  const [pushEnabled, setPushEnabled] = useState(
    channel?.push_notifications_enabled ?? true,
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const submitLabel = mode === "create" ? "Add Channel" : "Update Channel";
  const pendingLabel = mode === "create" ? "Adding…" : "Updating…";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    try {
      await onSubmit({
        url,
        description: description.trim() || null,
        is_active: isActive,
        push_notifications_enabled: pushEnabled,
      });
    } catch (err) {
      const response = (
        err as {
          response?: {
            data?: {
              message?: string;
              errors?: Record<string, string | string[]>;
            };
          };
        }
      )?.response;

      const fieldErrors = response?.data?.errors;
      if (fieldErrors) {
        const next: FormErrors = {};
        for (const [key, value] of Object.entries(fieldErrors)) {
          const message = Array.isArray(value) ? value[0] : value;
          if (
            key === "url" ||
            key === "description" ||
            key === "is_active" ||
            key === "push_notifications_enabled"
          ) {
            next[key as keyof TwitchChannelInput] = message;
          }
        }
        setErrors(next);
        if (Object.keys(next).length === 0) {
          setGeneralError(response?.data?.message ?? "Failed to save.");
        }
      } else {
        setGeneralError(response?.data?.message ?? "Failed to save.");
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-3 py-6 sm:px-6 sm:py-12">
      <h1 className="text-xl font-semibold sm:text-2xl">
        {mode === "create" ? "Add Twitch Channel" : "Edit Twitch Channel"}
      </h1>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <Input
              id="url"
              type="url"
              label="Twitch Channel URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.twitch.tv/username"
              error={errors.url}
              required
              fullWidth
            />
            {!errors.url ? (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Full URL to the Twitch channel
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description or notes about this channel"
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-purple-600 shadow-sm focus:ring-purple-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Active (automatically track streams from this channel)
                </span>
              </label>
              {mode === "edit" ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Uncheck this to temporarily stop tracking this channel
                  without deleting it
                </p>
              ) : null}
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="rounded border-zinc-300 text-purple-600 shadow-sm focus:ring-purple-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Send push notification when this channel goes live
                </span>
              </label>
              {mode === "edit" ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Uncheck to stop receiving push notifications for this channel
                  only
                </p>
              ) : null}
            </div>
          </div>

          {mode === "edit" && channel ? (
            <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-medium">Channel Information</h3>
              <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                {channel.last_live_at ? (
                  <InfoRow
                    label="Last Live"
                    value={new Date(channel.last_live_at).toLocaleString()}
                  />
                ) : null}
                {channel.last_checked_at ? (
                  <InfoRow
                    label="Last Checked"
                    value={new Date(channel.last_checked_at).toLocaleString()}
                  />
                ) : null}
                {channel.created_at ? (
                  <InfoRow
                    label="Created"
                    value={new Date(channel.created_at).toLocaleString()}
                  />
                ) : null}
                {channel.updated_at ? (
                  <InfoRow
                    label="Updated"
                    value={new Date(channel.updated_at).toLocaleString()}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {generalError ? (
            <p className="text-sm text-danger">{generalError}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/twitch")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-900/30">
        <div className="flex items-start">
          <HiInformationCircle className="h-5 w-5 shrink-0 text-purple-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {mode === "create"
                ? "How to add a Twitch channel"
                : "Editing Twitch Channel"}
            </h3>
            <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
              <ul className="list-disc space-y-1 pl-5">
                {mode === "create" ? (
                  <>
                    <li>Visit the Twitch channel page you want to track</li>
                    <li>Copy the full URL from your browser&rsquo;s address bar</li>
                    <li>
                      Paste it in the field above (e.g.,
                      https://www.twitch.tv/username)
                    </li>
                    <li>
                      The username will be automatically extracted from the URL
                    </li>
                  </>
                ) : (
                  <>
                    <li>Update the URL if the channel username has changed</li>
                    <li>
                      Toggle <strong>Active</strong> to enable/disable stream
                      tracking
                    </li>
                    <li>
                      All changes will be saved when you click Update Channel
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
