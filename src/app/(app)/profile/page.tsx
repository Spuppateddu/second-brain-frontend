"use client";

import { Button, Card, Input } from "@heroui/react";
import { useState } from "react";

import { PushNotificationPanel } from "@/components/PushNotificationPanel";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type Status = { kind: "idle" } | { kind: "ok"; msg: string } | { kind: "err"; msg: string };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="w-full">
      <Card.Header className="flex flex-col items-start gap-1">
        <Card.Title>{title}</Card.Title>
        {description ? (
          <Card.Description>{description}</Card.Description>
        ) : null}
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

function Banner({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  return (
    <p
      className={[
        "text-sm",
        status.kind === "ok" ? "text-success" : "text-danger",
      ].join(" ")}
    >
      {status.msg}
    </p>
  );
}

function extractError(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  };
  const errs = e?.response?.data?.errors;
  if (errs) {
    const first = Object.values(errs)[0]?.[0];
    if (first) return first;
  }
  return e?.response?.data?.message ?? fallback;
}

function ProfileInfoForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.patch("/profile", { name, email });
      await refresh();
      setStatus({ kind: "ok", msg: "Profile updated." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Profile" description="Your name and email.">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={pending}
          >
            Save
          </Button>
        </div>
      </form>
    </Section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.put("/auth/password", {
        current_password: current,
        password: next,
        password_confirmation: confirm,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ kind: "ok", msg: "Password changed." });
    } catch (err) {
      setStatus({
        kind: "err",
        msg: extractError(err, "Failed to change password."),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      title="Password"
      description="Use a long, random password. We hash it server-side."
    >
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          type="password"
          placeholder="Current password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={pending}
          >
            Update password
          </Button>
        </div>
      </form>
    </Section>
  );
}

function InactivityForm() {
  const { user, refresh } = useAuth();
  const [timeoutMin, setTimeoutMin] = useState<number>(
    user?.inactivity_timeout ?? 720,
  );
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(timeoutMin) || timeoutMin < 1) {
      setStatus({ kind: "err", msg: "Timeout must be at least 1 minute." });
      return;
    }
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.put("/profile/inactivity-timeout", {
        inactivity_timeout: Number(timeoutMin),
      });
      if (code) {
        await api.put("/profile/inactivity-code", { inactivity_code: code });
      }
      await refresh();
      setCode("");
      setStatus({ kind: "ok", msg: "Inactivity settings saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      title="Inactivity lock"
      description="Lock the app after a period of inactivity. Unlock with this code or by signing in again."
    >
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Timeout (minutes)</span>
          <Input
            type="number"
            min={1}
            value={String(timeoutMin)}
            onChange={(e) => setTimeoutMin(Number(e.target.value))}
            className="w-32"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">
            New unlock code (leave blank to keep the current one)
          </span>
          <Input
            type="password"
            placeholder="At least 4 characters"
            autoComplete="new-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <div className="flex items-center justify-between">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isDisabled={pending}
          >
            Save
          </Button>
        </div>
      </form>
    </Section>
  );
}

function ThemeForm() {
  const { user, refresh } = useAuth();
  const [theme, setTheme] = useState<string>(user?.theme ?? "system");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function save(value: string) {
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.patch("/profile/theme", { theme: value });
      setTheme(value);
      await refresh();
      setStatus({ kind: "ok", msg: "Theme saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Theme">
      <div className="flex gap-2">
        {(["light", "dark", "system"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={theme === value ? "primary" : "outline"}
            isDisabled={pending}
            onClick={() => save(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <div className="mt-2">
        <Banner status={status} />
      </div>
    </Section>
  );
}

function TimezoneForm() {
  const { user, refresh } = useAuth();
  const [timezone, setTimezone] = useState(user?.timezone ?? "UTC");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  // List from the browser if available; fallback to a small curated set.
  const zones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : ["UTC", "Europe/Rome", "Europe/London", "America/New_York"];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.patch("/profile/timezone", { timezone });
      await refresh();
      setStatus({ kind: "ok", msg: "Timezone saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Timezone">
      <form className="flex items-center gap-3" onSubmit={onSubmit}>
        <select
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {zones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={pending}
        >
          Save
        </Button>
      </form>
      <div className="mt-2">
        <Banner status={status} />
      </div>
    </Section>
  );
}

function CalendarPrefsForm() {
  const { user, refresh } = useAuth();
  const [slot, setSlot] = useState(user?.calendar_slot_duration ?? 15);
  const [view, setView] = useState(user?.calendar_view_mode ?? "calendar");
  const [water, setWater] = useState(user?.water_target ?? 8);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function saveAll() {
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await Promise.all([
        api.patch("/profile/calendar-slot", { calendar_slot_duration: slot }),
        api.patch("/profile/calendar-view-mode", { calendar_view_mode: view }),
        api.patch("/profile/water-target", { water_target: water }),
      ]);
      await refresh();
      setStatus({ kind: "ok", msg: "Preferences saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title="Calendar preferences">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Slot duration (minutes)</span>
          <select
            className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={slot}
            onChange={(e) => setSlot(Number(e.target.value))}
          >
            {[15, 30, 60].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Default view</span>
          <select
            className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={view}
            onChange={(e) => setView(e.target.value)}
          >
            <option value="calendar">calendar</option>
            <option value="task">task</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Water target (glasses/day)</span>
          <Input
            type="number"
            min={1}
            max={20}
            value={String(water)}
            onChange={(e) => setWater(Number(e.target.value))}
            className="w-32"
          />
        </label>
        <div className="flex items-center justify-between">
          <Banner status={status} />
          <Button
            variant="primary"
            size="sm"
            isDisabled={pending}
            onClick={saveAll}
          >
            Save
          </Button>
        </div>
      </div>
    </Section>
  );
}

function NotificationsForm() {
  const { user, refresh } = useAuth();
  const [prefs, setPrefs] = useState({
    notify_task_reminders: user?.notify_task_reminders ?? true,
    notify_pill_reminders: user?.notify_pill_reminders ?? true,
    notify_water_reminders: user?.notify_water_reminders ?? true,
    notify_twitch_live: user?.notify_twitch_live ?? true,
    notify_youtube_new_videos: user?.notify_youtube_new_videos ?? true,
  });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.patch("/profile/notification-preferences", prefs);
      await refresh();
      setStatus({ kind: "ok", msg: "Preferences saved." });
    } catch (err) {
      setStatus({ kind: "err", msg: extractError(err, "Failed to save.") });
    } finally {
      setPending(false);
    }
  }

  const labels: Record<keyof typeof prefs, string> = {
    notify_task_reminders: "Task reminders",
    notify_pill_reminders: "Pill reminders",
    notify_water_reminders: "Water reminders",
    notify_twitch_live: "Twitch live alerts",
    notify_youtube_new_videos: "YouTube new videos",
  };

  return (
    <Section title="Notifications">
      <div className="flex flex-col gap-2">
        {(Object.keys(prefs) as Array<keyof typeof prefs>).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, [key]: e.target.checked }))
              }
            />
            <span>{labels[key]}</span>
          </label>
        ))}
        <div className="flex items-center justify-between">
          <Banner status={status} />
          <Button
            variant="primary"
            size="sm"
            isDisabled={pending}
            onClick={save}
          >
            Save
          </Button>
        </div>
      </div>
    </Section>
  );
}

function DangerZone() {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, setPending] = useState(false);

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Delete your account permanently? This cannot be undone.")) {
      return;
    }
    setPending(true);
    setStatus({ kind: "idle" });
    try {
      await api.delete("/profile", { data: { password } });
      await logout();
    } catch (err) {
      setStatus({
        kind: "err",
        msg: extractError(err, "Failed to delete account."),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      title="Delete account"
      description="Confirm with your password. All data will be removed."
    >
      <form className="flex items-end gap-2" onSubmit={deleteAccount}>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="danger"
          size="sm"
          isDisabled={pending || !password}
        >
          Delete
        </Button>
      </form>
      <div className="mt-2">
        <Banner status={status} />
      </div>
    </Section>
  );
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-zinc-500">
          Update your account information and preferences.
        </p>
      </div>
      <ProfileInfoForm />
      <PasswordForm />
      <InactivityForm />
      <ThemeForm />
      <TimezoneForm />
      <CalendarPrefsForm />
      <NotificationsForm />
      <PushNotificationPanel />
      <DangerZone />
    </div>
  );
}
