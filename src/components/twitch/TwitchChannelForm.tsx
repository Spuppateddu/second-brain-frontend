"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { HiArrowLongLeft, HiInformationCircle } from "react-icons/hi2";

import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { Input } from "@/components/UI/Input";
import { Textarea } from "@/components/UI/Textarea";
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
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <header>
          <Link href="/twitch">
            <Button variant="ghost" size="xs" leftIcon={<HiArrowLongLeft />}>
              Back to Twitch
            </Button>
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            {mode === "create" ? "Add Twitch channel" : "Edit Twitch channel"}
          </h1>
        </header>

        <FormSection title="Channel">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="url"
              type="url"
              label="Twitch channel URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.twitch.tv/username"
              error={errors.url}
              helperText={
                errors.url ? undefined : "Full URL to the Twitch channel"
              }
              required
              fullWidth
            />

            <Textarea
              id="description"
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description or notes about this channel"
              fullWidth
            />

            <div className="space-y-3">
              <div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
                  />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Active (automatically track streams from this channel)
                  </span>
                </label>
                {mode === "edit" ? (
                  <p className="mt-1 pl-6 text-xs text-secondary-500 dark:text-secondary-400">
                    Uncheck this to temporarily stop tracking this channel
                    without deleting it
                  </p>
                ) : null}
              </div>

              <div>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
                  />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Send push notification when this channel goes live
                  </span>
                </label>
                {mode === "edit" ? (
                  <p className="mt-1 pl-6 text-xs text-secondary-500 dark:text-secondary-400">
                    Uncheck to stop receiving push notifications for this
                    channel only
                  </p>
                ) : null}
              </div>
            </div>

            {mode === "edit" && channel ? (
              <div className="border-t border-secondary-200 pt-4 dark:border-secondary-800">
                <h3 className="mb-3 text-sm font-medium text-secondary-700 dark:text-secondary-200">
                  Channel information
                </h3>
                <div className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
                  {channel.last_live_at ? (
                    <InfoRow
                      label="Last live"
                      value={new Date(channel.last_live_at).toLocaleString()}
                    />
                  ) : null}
                  {channel.last_checked_at ? (
                    <InfoRow
                      label="Last checked"
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
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {generalError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => router.push("/twitch")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isPending}
                loading={isPending}
              >
                {mode === "create" ? "Add channel" : "Update channel"}
              </Button>
            </div>
          </form>
        </FormSection>

        <div className="rounded-[var(--radius-card)] border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20">
          <div className="flex items-start gap-3">
            <HiInformationCircle className="h-5 w-5 shrink-0 text-info-500" />
            <div>
              <h3 className="text-sm font-medium text-info-800 dark:text-info-200">
                {mode === "create"
                  ? "How to add a Twitch channel"
                  : "Editing Twitch channel"}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-info-700 dark:text-info-300">
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
                      All changes will be saved when you click Update channel
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
    <div className="flex justify-between gap-4">
      <span className="font-medium text-secondary-700 dark:text-secondary-300">
        {label}:
      </span>
      <span className="text-secondary-600 dark:text-secondary-400">
        {value}
      </span>
    </div>
  );
}
