"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { api, setLockedHandler } from "@/lib/api";

const ACTIVITY_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

type InactivityContextValue = {
  isLocked: boolean;
  unlock: (code: string) => Promise<boolean>;
};

const InactivityContext = createContext<InactivityContextValue | null>(null);

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const queryClient = useQueryClient();
  const authenticated = status === "authenticated";
  const [isLockedRaw, setIsLockedRaw] = useState(false);
  // Hide the lock modal whenever there's no authenticated session — avoids a
  // stale `true` flag bleeding across logout/login.
  const isLocked = isLockedRaw && authenticated;
  const lastActivityRef = useRef<number>(0);
  const lastPingRef = useRef(0);

  useEffect(() => {
    if (lastActivityRef.current === 0) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLockedRaw(false);
    }
  }, [authenticated]);

  // Wire the api interceptor to flip the lock flag on any 423 response.
  useEffect(() => {
    if (!authenticated) {
      setLockedHandler(null);
      return;
    }
    setLockedHandler(() => setIsLockedRaw(true));
    return () => setLockedHandler(null);
  }, [authenticated]);

  // Track user activity locally and ping the server (throttled) so the
  // backend can keep `last_activity_at` accurate for the inactivity check.
  useEffect(() => {
    if (!authenticated || isLocked) return;

    const handler = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastPingRef.current > ACTIVITY_THROTTLE_MS) {
        lastPingRef.current = now;
        api.post("/activity").catch(() => {});
      }
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      document.addEventListener(evt, handler, true),
    );
    return () =>
      ACTIVITY_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, handler, true),
      );
  }, [authenticated, isLocked]);

  // Client-side timer: lock the UI as soon as the configured timeout elapses,
  // even before the next API call would surface the 423.
  useEffect(() => {
    if (!authenticated || isLocked) return;
    const timeoutMin = user?.inactivity_timeout ?? 720;
    const timeoutMs = Math.max(1, timeoutMin) * 60 * 1000;

    const id = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        setIsLockedRaw(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [authenticated, isLocked, user?.inactivity_timeout]);

  // Probe the lock status on auth so we surface the modal even if the user
  // landed on a page that doesn't immediately fetch a locked-protected route.
  useEffect(() => {
    if (!authenticated) return;
    api.get("/ping").catch(() => {
      // Interceptor handles the 423 → setIsLockedRaw(true). 401s are handled by
      // AuthContext. Any other failure is a transient network issue we ignore.
    });
  }, [authenticated]);

  const unlock = useCallback(
    async (code: string) => {
      try {
        const { data } = await api.post<{ valid: boolean }>(
          "/verify-inactivity-code",
          { code },
        );
        if (data?.valid) {
          setIsLockedRaw(false);
          lastActivityRef.current = Date.now();
          lastPingRef.current = 0;
          // Refetch any data that failed while we were locked.
          queryClient.invalidateQueries();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [queryClient],
  );

  return (
    <InactivityContext.Provider value={{ isLocked, unlock }}>
      {children}
    </InactivityContext.Provider>
  );
}

export function useInactivity(): InactivityContextValue {
  const ctx = useContext(InactivityContext);
  if (!ctx) {
    throw new Error("useInactivity must be used within an InactivityProvider");
  }
  return ctx;
}
