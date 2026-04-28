"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export type PushStatus = "loading" | "unsupported" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getOrRegisterServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export function usePushNotifications() {
  const { vapidPublicKey } = useAuth();
  const [status, setStatus] = useState<PushStatus>("loading");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await getOrRegisterServiceWorker();
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setPending(true);
    setError(null);
    try {
      if (!vapidPublicKey) {
        setError("VAPID key not configured on the server.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await getOrRegisterServiceWorker();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          .buffer as ArrayBuffer,
      });
      const json = sub.toJSON();
      await api.post("/push-subscriptions", {
        endpoint: json.endpoint,
        keys: json.keys,
      });
      setStatus("on");
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to enable push notifications.";
      setError(m);
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setError(null);
    try {
      const reg = await getOrRegisterServiceWorker();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete("/push-subscriptions", {
          data: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err) {
      const m =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to disable.";
      setError(m);
    } finally {
      setPending(false);
    }
  }

  return {
    status,
    pending,
    error,
    enable,
    disable,
    vapidPublicKey,
  };
}
