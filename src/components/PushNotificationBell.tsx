"use client";

import { HiBellAlert, HiBellSlash } from "react-icons/hi2";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationBell() {
  const { status, pending, enable, disable } = usePushNotifications();

  if (status === "unsupported") return null;

  const denied = status === "denied";
  const subscribed = status === "on";
  const loading = status === "loading";

  function handleClick() {
    if (pending || denied || loading) return;
    if (subscribed) {
      void disable();
    } else {
      void enable();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending || denied || loading}
      aria-label={
        denied
          ? "Notifications blocked"
          : subscribed
            ? "Disable notifications"
            : "Enable notifications"
      }
      className={[
        "inline-flex items-center justify-center rounded-md p-2 transition focus:outline-none",
        denied
          ? "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
          : subscribed
            ? "text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
            : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300",
      ].join(" ")}
    >
      {subscribed ? (
        <HiBellAlert className="h-5 w-5" />
      ) : (
        <HiBellSlash className="h-5 w-5" />
      )}
    </button>
  );
}
