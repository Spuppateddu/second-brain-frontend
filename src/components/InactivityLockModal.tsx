"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useInactivity } from "@/contexts/InactivityContext";

export function InactivityLockModal() {
  const { isLocked } = useInactivity();
  if (!isLocked) return null;
  return <LockedDialog />;
}

function LockedDialog() {
  const { unlock } = useInactivity();
  const { logout } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code || submitting) return;
    setError("");
    setSubmitting(true);
    const ok = await unlock(code);
    if (ok) return; // component unmounts when isLocked flips to false
    setSubmitting(false);
    setError("Invalid code. Try again or use your account password.");
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  async function onUseAccountPassword() {
    await logout();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-lock-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2
            id="inactivity-lock-title"
            className="text-base font-semibold"
          >
            Session locked for inactivity
          </h2>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your session was locked after a period of inactivity. Enter your
            inactivity code to continue, or use your account password.
          </p>
          <div>
            <label
              htmlFor="inactivity-code"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              Inactivity code
            </label>
            <input
              id="inactivity-code"
              ref={inputRef}
              type="password"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {error ? (
              <p className="mt-1 text-sm text-danger">{error}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isDisabled={submitting || !code}
              className="flex-1"
            >
              {submitting ? "Verifying…" : "Unlock"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onUseAccountPassword}
              className="flex-1"
            >
              Use account password
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            If you forgot the code, click &ldquo;Use account password&rdquo; to
            log in again.
          </p>
        </form>
      </div>
    </div>
  );
}
