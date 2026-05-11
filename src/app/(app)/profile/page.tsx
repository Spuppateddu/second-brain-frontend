"use client";

import { useState } from "react";

import { PushNotificationPanel } from "@/components/PushNotificationPanel";
import { Button } from "@/components/UI/Button";
import { FormSection } from "@/components/UI/FormSection";
import { Input } from "@/components/UI/Input";
import { Select } from "@/components/UI/Select";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; msg: string }
  | { kind: "err"; msg: string };

function Banner({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  return (
    <p
      className={[
        "text-sm",
        status.kind === "ok"
          ? "text-success-600 dark:text-success-400"
          : "text-danger-600 dark:text-danger-400",
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
    <FormSection title="Profile" description="Your name and email.">
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          label="Name"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <Input
          label="Email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <div className="flex items-center justify-between gap-3">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending}
            loading={pending}
          >
            Save
          </Button>
        </div>
      </form>
    </FormSection>
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
    <FormSection
      title="Password"
      description="Use a long, random password. We hash it server-side."
    >
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          label="Current password"
          type="password"
          placeholder="Current password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          fullWidth
        />
        <Input
          label="New password"
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          fullWidth
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          fullWidth
        />
        <div className="flex items-center justify-between gap-3">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending}
            loading={pending}
          >
            Update password
          </Button>
        </div>
      </form>
    </FormSection>
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
    <FormSection
      title="Inactivity lock"
      description="Lock the app after a period of inactivity. Unlock with this code or by signing in again."
    >
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          label="Timeout (minutes)"
          type="number"
          min={1}
          value={String(timeoutMin)}
          onChange={(e) => setTimeoutMin(Number(e.target.value))}
          className="w-32"
        />
        <Input
          label="New unlock code"
          type="password"
          placeholder="At least 4 characters"
          autoComplete="new-password"
          helperText="Leave blank to keep the current one."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
        />
        <div className="flex items-center justify-between gap-3">
          <Banner status={status} />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending}
            loading={pending}
          >
            Save
          </Button>
        </div>
      </form>
    </FormSection>
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
    <FormSection title="Theme">
      <div className="flex gap-2">
        {(["light", "dark", "system"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={theme === value ? "primary" : "secondary"}
            disabled={pending}
            onClick={() => save(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <Banner status={status} />
    </FormSection>
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
    <FormSection title="Timezone">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={onSubmit}
      >
        <Select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="sm:w-72"
        >
          {zones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={pending}
          loading={pending}
        >
          Save
        </Button>
      </form>
      <Banner status={status} />
    </FormSection>
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
    <FormSection title="Calendar preferences">
      <Select
        label="Slot duration (minutes)"
        value={slot}
        onChange={(e) => setSlot(Number(e.target.value))}
        className="w-32"
      >
        {[15, 30, 60].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
      <Select
        label="Default view"
        value={view}
        onChange={(e) => setView(e.target.value)}
        className="w-32"
      >
        <option value="calendar">calendar</option>
        <option value="task">task</option>
      </Select>
      <Input
        label="Water target (glasses/day)"
        type="number"
        min={1}
        max={20}
        value={String(water)}
        onChange={(e) => setWater(Number(e.target.value))}
        className="w-32"
      />
      <div className="flex items-center justify-between gap-3">
        <Banner status={status} />
        <Button
          variant="primary"
          size="sm"
          disabled={pending}
          loading={pending}
          onClick={saveAll}
        >
          Save
        </Button>
      </div>
    </FormSection>
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
    <FormSection title="Notifications">
      <div className="flex flex-col gap-2">
        {(Object.keys(prefs) as Array<keyof typeof prefs>).map((key) => (
          <label
            key={key}
            className="flex items-center gap-2 text-sm text-secondary-700 dark:text-secondary-300"
          >
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, [key]: e.target.checked }))
              }
              className="h-4 w-4 rounded border-secondary-300 accent-primary-600 dark:border-secondary-700"
            />
            <span>{labels[key]}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Banner status={status} />
        <Button
          variant="primary"
          size="sm"
          disabled={pending}
          loading={pending}
          onClick={save}
        >
          Save
        </Button>
      </div>
    </FormSection>
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
    <FormSection
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
          fullWidth
        />
        <Button
          type="submit"
          variant="danger"
          size="sm"
          disabled={pending || !password}
          loading={pending}
        >
          Delete
        </Button>
      </form>
      <Banner status={status} />
    </FormSection>
  );
}

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <header>
          <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100">
            Profile
          </h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Update your account information and preferences.
          </p>
        </header>
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
    </div>
  );
}
