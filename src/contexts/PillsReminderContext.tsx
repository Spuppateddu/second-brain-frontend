"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  useDismissPill,
  useMarkPillTaken,
  usePillsForDate,
  type PillForDate,
} from "@/lib/queries/entities";

type Snoozes = Record<number, number>;

type Ctx = {
  date: string;
  pendingReminders: PillForDate[];
  markAsTaken: (pillId: number) => Promise<void>;
  dismissReminder: (pillId: number) => Promise<void>;
  snoozeReminder: (pillId: number, minutes?: number) => void;
};

const SNOOZE_KEY = "pillsSnoozedUntil";

const PillsReminderContext = createContext<Ctx | undefined>(undefined);

function todayString(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function loadSnoozes(): Snoozes {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Snoozes;
    const now = Date.now();
    const fresh: Snoozes = {};
    for (const [id, ts] of Object.entries(parsed)) {
      if (typeof ts === "number" && ts > now) fresh[Number(id)] = ts;
    }
    return fresh;
  } catch {
    return {};
  }
}

function saveSnoozes(snoozes: Snoozes) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
  } catch {
    // ignore
  }
}

export function PillsReminderProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const enabled = status === "authenticated";

  const [date, setDate] = useState<string>(() => todayString());
  const [snoozes, setSnoozes] = useState<Snoozes>(() => loadSnoozes());

  // Keep `date` aligned with the local day (handles app left open across midnight).
  useEffect(() => {
    const id = setInterval(() => {
      setDate((prev) => {
        const today = todayString();
        return prev === today ? prev : today;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const { data } = usePillsForDate(date, enabled);
  const markTaken = useMarkPillTaken();
  const dismiss = useDismissPill();

  const pendingReminders = useMemo(() => {
    if (!data) return [];
    return data.filter((pill) => {
      const log = pill.today_log;
      if (log && log.status !== "pending") return false;
      // `snoozes` only ever holds future timestamps — the effect below removes
      // entries as soon as they expire, so presence implies still-snoozed.
      if (snoozes[pill.id]) return false;
      return true;
    });
  }, [data, snoozes]);

  const markAsTaken = useCallback(
    async (pillId: number) => {
      await markTaken.mutateAsync({ id: pillId, date });
    },
    [markTaken, date],
  );

  const dismissReminder = useCallback(
    async (pillId: number) => {
      await dismiss.mutateAsync({ id: pillId, date });
    },
    [dismiss, date],
  );

  const snoozeReminder = useCallback((pillId: number, minutes = 5) => {
    setSnoozes((prev) => {
      const next = { ...prev, [pillId]: Date.now() + minutes * 60_000 };
      saveSnoozes(next);
      return next;
    });
  }, []);

  // Schedule one timer per snoozed pill that fires exactly when the snooze
  // expires, so the modal re-appears without polling.
  useEffect(() => {
    const ids = Object.keys(snoozes);
    if (ids.length === 0) return;
    const now = Date.now();
    const timers = ids.map((idStr) => {
      const pillId = Number(idStr);
      const expiresAt = snoozes[pillId];
      const delay = Math.max(0, expiresAt - now);
      return window.setTimeout(() => {
        setSnoozes((prev) => {
          if (!(pillId in prev)) return prev;
          const next = { ...prev };
          delete next[pillId];
          saveSnoozes(next);
          return next;
        });
      }, delay);
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [snoozes]);

  const value: Ctx = {
    date,
    pendingReminders,
    markAsTaken,
    dismissReminder,
    snoozeReminder,
  };

  return (
    <PillsReminderContext.Provider value={value}>
      {children}
    </PillsReminderContext.Provider>
  );
}

export function usePillsReminder(): Ctx {
  const ctx = useContext(PillsReminderContext);
  if (!ctx) {
    throw new Error(
      "usePillsReminder must be used within a PillsReminderProvider",
    );
  }
  return ctx;
}
