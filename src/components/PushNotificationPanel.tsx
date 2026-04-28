"use client";

import { Button } from "@heroui/react";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationPanel() {
  const { status, pending, error, enable, disable, vapidPublicKey } =
    usePushNotifications();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Push notifications</span>
          <span className="text-xs text-zinc-500">
            {status === "loading"
              ? "Checking…"
              : status === "unsupported"
                ? "Not supported in this browser."
                : status === "denied"
                  ? "Permission was denied. Enable notifications for this site in your browser settings."
                  : status === "on"
                    ? "Enabled on this device."
                    : "Off."}
          </span>
        </div>
        {status === "on" ? (
          <Button
            variant="outline"
            size="sm"
            isDisabled={pending}
            onClick={disable}
          >
            {pending ? "…" : "Disable"}
          </Button>
        ) : status === "off" ? (
          <Button
            variant="primary"
            size="sm"
            isDisabled={pending || !vapidPublicKey}
            onClick={enable}
          >
            {pending ? "Enabling…" : "Enable"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!vapidPublicKey && status !== "loading" ? (
        <p className="text-xs text-zinc-500">
          Server didn&rsquo;t return a VAPID public key — set{" "}
          <code>VAPID_PUBLIC_KEY</code> and{" "}
          <code>VAPID_PRIVATE_KEY</code> in the backend{" "}
          <code>.env</code>.
        </p>
      ) : null}
    </div>
  );
}
