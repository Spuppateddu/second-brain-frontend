// Loose-typed shapes for the more complex feature pages where the
// backend returns deeply nested objects. We type the fields we render
// and let the rest stay as `unknown`-ish until each page firms up.

export type PlanningSubTaskLite = {
  id: number;
  planning_task_id: number;
  content: string;
  order: number;
  is_done: boolean;
  is_cancelled?: boolean;
  is_blocked?: boolean;
};

type PlanningTaskCategory = { id: number; name: string; color: string };
type LinkableSummary = { id: number; title?: string; name?: string };

export type PlanningTaskLite = {
  id: number;
  content: string;
  description: string | null;
  order: number;
  stars: number | null;
  is_done?: boolean;
  is_cancelled?: boolean;
  is_blocked?: boolean;
  is_work?: boolean;
  origin_month?: number | null;
  origin_year?: number | null;
  start_date?: string;
  end_date?: string;
  planning_type_id?: number;
  subTasks?: PlanningSubTaskLite[];
  sub_tasks?: PlanningSubTaskLite[];
  taskCategories?: PlanningTaskCategory[];
  task_categories?: PlanningTaskCategory[];
  linkedCalendarTasks?: { id: number; task_date?: string }[];
  linked_calendar_tasks?: { id: number; task_date?: string }[];
  linkedBookmarks?: LinkableSummary[];
  linkedNotes?: LinkableSummary[];
  linkedPersons?: LinkableSummary[];
  linkedPlaces?: LinkableSummary[];
  linkedBags?: LinkableSummary[];
  linkedHardware?: LinkableSummary[];
  linkedSoftware?: LinkableSummary[];
  linkedRecipes?: LinkableSummary[];
  linkedWishlistItems?: LinkableSummary[];
  linkedTrips?: LinkableSummary[];
};

export type PlanningPeriod = {
  id: number;
  name?: string;
  type?: "month" | "year";
  start_date: string;
  end_date: string;
  planning_type_id: number;
  tasks?: PlanningTaskLite[];
  can_be_closed?: boolean;
  can_have_retrospective?: boolean;
  retrospective?: { id: number; notes: unknown[] } | null;
};

export type PlanningSummary = {
  monthlyPlanning: PlanningPeriod | null;
  yearlyPlanning: PlanningPeriod | null;
  currentMonth: string;
  currentYear: string;
};

export type OutOfPlanSubNote = {
  id: number;
  out_of_plan_note_id: number;
  content: string;
  is_done: boolean;
  is_cancelled: boolean;
  order: number;
};

type OutOfPlanCategory = { id: number; name: string; color: string };
type OutOfPlanLinkable = { id: number; title?: string; name?: string };

export type OutOfPlanNote = {
  id: number;
  content: string;
  description: string | null;
  stars: number | null;
  is_work: boolean;
  is_done: boolean;
  is_cancelled: boolean;
  order: number;
  subNotes: OutOfPlanSubNote[];
  taskCategories?: OutOfPlanCategory[];
  task_categories?: OutOfPlanCategory[];
  linkedBookmarks?: OutOfPlanLinkable[];
  linkedNotes?: OutOfPlanLinkable[];
  linkedPersons?: OutOfPlanLinkable[];
  linkedPlaces?: OutOfPlanLinkable[];
  linkedBags?: OutOfPlanLinkable[];
  linkedHardware?: OutOfPlanLinkable[];
  linkedSoftware?: OutOfPlanLinkable[];
  linkedRecipes?: OutOfPlanLinkable[];
  linkedWishlistItems?: OutOfPlanLinkable[];
  linkedTrips?: OutOfPlanLinkable[];
};

export type PaymentLookup = {
  id: number;
  name: string;
  slug?: string;
};

export type Payment = {
  id: number;
  name: string;
  date: string;
  description?: string | null;
  amount: number;
  is_subscription: boolean;
  is_positive_cashflow: boolean;
  payment_method?: PaymentLookup | null;
  payment_platform?: PaymentLookup | null;
  payment_types?: PaymentLookup[];
};

export type CashflowSummary = {
  positive: number;
  negative: number;
  net: number;
};

export type CashflowFilters = {
  search?: string;
  start_date?: string;
  end_date?: string;
  amount_operator?: "=" | ">" | "<" | ">=" | "<=";
  amount_value?: string;
  payment_methods?: number[];
  payment_platforms?: number[];
  payment_types?: number[];
  subscription_filter?: "any" | "yes" | "no";
};

export type CashflowPayload = {
  payments: Payment[];
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  summary: CashflowSummary;
  filters: CashflowFilters;
};

export type CashflowFilterPayload = {
  payments: Payment[];
  summary: CashflowSummary;
};

export type CalendarBudgetRow = {
  id: number;
  name: string;
  description: string | null;
  type: "daily" | "weekly" | "monthly" | "yearly";
  amount: number;
  total_spent: number;
  percentage: number;
  amount_left: number;
  payments_count: number;
  is_over_threshold: boolean;
};

export type CalendarBudgetsPayload = {
  budgets: CalendarBudgetRow[];
  has_over_threshold: boolean;
};

export type CashflowTrendsPoint = {
  month: string;
  income: number;
  expenses: number;
  cashflow: number;
};

export type YoutubeChannelView = {
  id: number;
  channel_id: string;
  name: string;
  url: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  hide_from_videos_page: boolean;
  push_notifications_enabled: boolean;
  last_sync_at: string | null;
  videos_count: number;
  unwatched_videos_count: number;
};

export type YoutubeChannelsResponse = {
  tab: "channels";
  channels: {
    data: YoutubeChannelView[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: { search?: string };
  totalChannelsCount: number;
};

export type YoutubeDateVideoChannel = {
  id: number;
  name: string;
  hide_from_videos_page?: boolean;
};

export type YoutubeDateVideo = {
  id: number;
  video_id: string;
  title: string;
  duration: string | null;
  duration_seconds: number | null;
  human_duration: string | null;
  published_at: string;
  published_time: string;
  created_at: string;
  thumbnail_url: string | null;
  video_url: string;
  is_watched: boolean;
  is_watchlist: boolean;
  youtube_channel: YoutubeDateVideoChannel;
};

export type YoutubeVideosForDateResponse = {
  tab: "videos";
  videos: YoutubeDateVideo[];
  date: string;
  search: string;
};

export type TwitchChannelView = {
  id: number;
  url: string;
  description: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  push_notifications_enabled: boolean;
  last_live_at: string | null;
  last_checked_at: string | null;
  created_at?: string;
  updated_at?: string;
  username: string;
  name: string;
};

export type TwitchStreamView = {
  id: number;
  twitch_channel_id: number;
  title: string | null;
  game_name: string | null;
  viewer_count: number;
  is_live: boolean;
  started_at: string;
  ended_at: string | null;
  thumbnail_url?: string | null;
};

export type RssFeedView = {
  id: number;
  is_active: boolean;
  rss_feed: {
    id: number;
    name: string;
    url: string;
    website_url: string | null;
    description: string | null;
  };
};

export type PlanningType = {
  id: number;
  name: string;
  slug: string;
};

export type PlanningTaskUnlinked = PlanningTaskLite & {
  planning_type?: PlanningType | null;
};

export type YoutubeVideoChannel = {
  id: number;
  name: string;
  url: string;
};

export type YoutubeVideo = {
  id: number;
  video_id: string;
  title: string;
  video_url: string;
  published_at: string;
  duration?: string | null;
  duration_seconds?: number | null;
  human_duration?: string | null;
  is_watched: boolean;
  is_watchlist: boolean;
  progress_seconds?: number | null;
  stars?: number | null;
  thumbnail_url?: string | null;
  youtube_channel?: YoutubeVideoChannel | null;
  // Some backend serializers use snake_case for the embedded relation.
  youtubeChannel?: YoutubeVideoChannel | null;
};

export type TwitchLiveStream = {
  id: number;
  title: string;
  channel_name: string;
  channel_username: string;
  channel_url: string;
  channel_profile_image_url: string | null;
  game_name: string;
  viewer_count: number;
  started_at: string;
  live_time: string;
};

export type RssNewsItem = {
  id: number;
  title: string;
  link: string | null;
  published_at: string | null;
  is_read: boolean;
  is_readlist: boolean;
  rss_feed?: { id: number; name: string };
};
