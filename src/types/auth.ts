export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  theme: string | null;
  timezone: string | null;
  calendar_slot_duration: number | null;
  calendar_view_mode: string | null;
  water_target: number | null;
  inactivity_timeout: number | null;
  last_activity_at: string | null;
  locked_until: string | null;
  notify_task_reminders: boolean;
  notify_pill_reminders: boolean;
  notify_water_reminders: boolean;
  notify_twitch_live: boolean;
  notify_youtube_new_videos: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Privilege = string;

export type AuthMe = {
  user: User;
  privileges: Privilege[];
  vapid_public_key?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
  device_name?: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};
