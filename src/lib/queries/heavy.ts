import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { SecondBrainPayload } from "@/types/graph";
import type {
  CashflowFilterPayload,
  CashflowFilters,
  CashflowPayload,
  CashflowTrendsPoint,
  OutOfPlanNote,
  PaymentLookup,
  PlanningSummary,
  PlanningTaskUnlinked,
  RssFeedView,
  RssNewsItem,
  TwitchChannelView,
  TwitchLiveStream,
  TwitchStreamView,
  YoutubeChannelsResponse,
  YoutubeVideo,
  YoutubeVideosForDateResponse,
} from "@/types/heavy";

export type TwitchChannelInput = {
  url: string;
  description?: string | null;
  is_active: boolean;
  push_notifications_enabled: boolean;
};

export const heavyKeys = {
  planning: ["planning"] as const,
  planningUnlinked: ["planning", "unlinked"] as const,
  outOfPlan: ["out-of-plan"] as const,
  cashflow: ["cashflow"] as const,
  youtubeChannels: ["youtube-channels"] as const,
  youtubeVideosByDate: ["youtube-videos", "by-date"] as const,
  youtubeWatchlist: ["youtube-videos", "watchlist"] as const,
  twitchChannels: ["twitch-channels"] as const,
  twitchChannel: (id: number) => ["twitch-channels", id] as const,
  twitchLive: ["twitch-streams", "live-for-calendar"] as const,
  rssFeeds: ["rss-feeds"] as const,
  rssNews: ["rss-news"] as const,
  secondBrain: ["second-brain"] as const,
};

export function useSecondBrain() {
  return useQuery<SecondBrainPayload>({
    queryKey: heavyKeys.secondBrain,
    queryFn: async () =>
      (await api.get<SecondBrainPayload>("/second-brain")).data,
  });
}

export type UntaggedPayload = {
  places: { id: number; name: string }[];
  persons: { id: number; name: string }[];
  bookmarks: { id: number; title: string; url?: string }[];
  notes: { id: number; title: string }[];
  recipes: { id: number; title: string }[];
  wishlist_items: { id: number; name: string }[];
  bags: { id: number; title: string }[];
  hardware: { id: number; title: string }[];
  software: { id: number; title: string }[];
  mega_files: { id: number; title: string }[];
  trips: { id: number; name: string }[];
};

export function useUntagged() {
  return useQuery<UntaggedPayload>({
    queryKey: ["second-brain", "untagged"] as const,
    queryFn: async () =>
      (await api.get<UntaggedPayload>("/second-brain/untagged")).data,
  });
}

export function useCreatePlanningTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      start_date: string;
      end_date: string;
      planning_type_id: number;
      content: string;
      is_work?: boolean;
    }) => {
      await api.post("/planning-tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function useUpdatePlanningTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: {
        content?: string;
        description?: string | null;
        is_done?: boolean;
        is_cancelled?: boolean;
        is_work?: boolean;
      };
    }) => {
      await api.patch(`/planning-tasks/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function useDeletePlanningTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/planning-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function useCopyPlanningToCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      taskDate,
      startTime,
      endTime,
      includeChildren,
    }: {
      taskId: number;
      taskDate: string;
      startTime?: string | null;
      endTime?: string | null;
      includeChildren?: boolean;
    }) => {
      await api.post(`/planning-tasks/${taskId}/copy-to-calendar`, {
        task_date: taskDate,
        start_time: startTime || null,
        end_time: endTime || null,
        include_children: includeChildren ?? true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
      queryClient.invalidateQueries({ queryKey: heavyKeys.planningUnlinked });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useCreatePlanningSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      planning_task_id: number;
      content: string;
    }) => {
      await api.post("/planning-sub-tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function useUpdatePlanningSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: { content: string; is_done?: boolean };
    }) => {
      await api.patch(`/planning-sub-tasks/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function useDeletePlanningSubTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/planning-sub-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.planning });
    },
  });
}

export function usePlanning(period?: { month?: string; year?: string }) {
  const params = new URLSearchParams();
  if (period?.month) params.set("month", period.month);
  if (period?.year) params.set("year", period.year);
  const qs = params.toString();
  return useQuery<PlanningSummary>({
    queryKey: [...heavyKeys.planning, qs] as const,
    queryFn: async () =>
      (await api.get<PlanningSummary>(`/planning${qs ? `?${qs}` : ""}`)).data,
  });
}

export function useOutOfPlan() {
  return useQuery({
    queryKey: heavyKeys.outOfPlan,
    queryFn: async () => {
      const { data } = await api.get<{
        outOfPlanNotes: OutOfPlanNote[];
      }>("/out-of-plan");
      return data;
    },
  });
}

export function useCreateOutOfPlanNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; is_work?: boolean }) => {
      await api.post("/out-of-plan-notes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useUpdateOutOfPlanNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: {
        content?: string;
        description?: string | null;
        is_done?: boolean;
        is_cancelled?: boolean;
        is_work?: boolean;
      };
    }) => {
      await api.patch(`/out-of-plan-notes/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useDeleteOutOfPlanNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/out-of-plan-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useCreateOutOfPlanSubNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      out_of_plan_note_id: number;
      content: string;
    }) => {
      await api.post("/out-of-plan-sub-notes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useUpdateOutOfPlanSubNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: { content: string; is_done?: boolean };
    }) => {
      await api.patch(`/out-of-plan-sub-notes/${id}`, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useDeleteOutOfPlanSubNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/out-of-plan-sub-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.outOfPlan });
    },
  });
}

export function useCashflow(options?: { enabled?: boolean }) {
  return useQuery<CashflowPayload>({
    queryKey: heavyKeys.cashflow,
    enabled: options?.enabled ?? true,
    queryFn: async () => (await api.get<CashflowPayload>("/cashflow")).data,
  });
}

type ChartSlice = { name: string; value: number };
export type CashflowChartData = {
  methods: ChartSlice[];
  platforms: ChartSlice[];
  types: ChartSlice[];
};

function cashflowFiltersToParams(filters: CashflowFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.amount_value && filters.amount_operator) {
    params.set("amount_operator", filters.amount_operator);
    params.set("amount_value", filters.amount_value);
  }
  if (filters.subscription_filter && filters.subscription_filter !== "any") {
    params.set("subscription_filter", filters.subscription_filter);
  }
  filters.payment_methods?.forEach((id) =>
    params.append("payment_methods[]", String(id)),
  );
  filters.payment_platforms?.forEach((id) =>
    params.append("payment_platforms[]", String(id)),
  );
  filters.payment_types?.forEach((id) =>
    params.append("payment_types[]", String(id)),
  );
  return params;
}

export function useCashflowFiltered(filters: CashflowFilters) {
  const params = cashflowFiltersToParams(filters);
  const qs = params.toString();
  return useQuery<CashflowFilterPayload>({
    queryKey: [...heavyKeys.cashflow, "filter", qs] as const,
    queryFn: async () => {
      const url = `/cashflow/filter${qs ? `?${qs}` : ""}`;
      const { data } = await api.get<CashflowFilterPayload>(url);
      return data;
    },
  });
}

export function useCashflowChartData(filters?: CashflowFilters) {
  const params = filters ? cashflowFiltersToParams(filters) : new URLSearchParams();
  const qs = params.toString();
  return useQuery<CashflowChartData>({
    queryKey: [...heavyKeys.cashflow, "chart", qs] as const,
    queryFn: async () => {
      const url = `/cashflow/chart-data${qs ? `?${qs}` : ""}`;
      const { data } = await api.get<{
        methods: ChartSlice[];
        platforms: ChartSlice[];
        types: ChartSlice[];
      }>(url);
      return {
        methods: data.methods ?? [],
        platforms: data.platforms ?? [],
        types: data.types ?? [],
      };
    },
  });
}

export function useCashflowTrends(options?: { enabled?: boolean }) {
  return useQuery<CashflowTrendsPoint[]>({
    queryKey: [...heavyKeys.cashflow, "trends"] as const,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<CashflowTrendsPoint[]>(
        "/cashflow/trends",
      );
      return data ?? [];
    },
  });
}

export type PaymentInput = {
  name: string;
  amount: number;
  date: string;
  payment_method_id: number;
  payment_platform_id: number;
  payment_type_ids?: number[];
  is_subscription?: boolean;
  is_positive_cashflow?: boolean;
};

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PaymentInput) => {
      await api.post("/cashflow", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: PaymentInput;
    }) => {
      await api.put(`/cashflow/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export type PaymentMethodFull = {
  id: number;
  user_id?: number;
  name: string;
  slug: string;
};

export type PaymentPlatformFull = {
  id: number;
  user_id?: number;
  name: string;
  slug: string;
  is_digital: boolean;
};

export type PaymentTypeFull = {
  id: number;
  user_id?: number;
  name: string;
  slug: string;
};

const paymentMethodsKey = ["payment-methods"] as const;
const paymentPlatformsKey = ["payment-platforms"] as const;
const paymentTypesKey = ["payment-types"] as const;

export function usePaymentMethods() {
  return useQuery<PaymentMethodFull[]>({
    queryKey: paymentMethodsKey,
    queryFn: async () =>
      (await api.get<PaymentMethodFull[]>("/payment-methods")).data,
  });
}

export function usePaymentPlatforms() {
  return useQuery<PaymentPlatformFull[]>({
    queryKey: paymentPlatformsKey,
    queryFn: async () =>
      (await api.get<PaymentPlatformFull[]>("/payment-platforms")).data,
  });
}

export function usePaymentTypes() {
  return useQuery<PaymentTypeFull[]>({
    queryKey: paymentTypesKey,
    queryFn: async () =>
      (await api.get<PaymentTypeFull[]>("/payment-types")).data,
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post<PaymentMethodFull>(
        "/payment-methods",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await api.put<PaymentMethodFull>(
        `/payment-methods/${id}`,
        { name },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useCreatePaymentPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; is_digital: boolean }) => {
      const { data } = await api.post<PaymentPlatformFull>(
        "/payment-platforms",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentPlatformsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useUpdatePaymentPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      is_digital,
    }: {
      id: number;
      name: string;
      is_digital: boolean;
    }) => {
      const { data } = await api.put<PaymentPlatformFull>(
        `/payment-platforms/${id}`,
        { name, is_digital },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentPlatformsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useDeletePaymentPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/payment-platforms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentPlatformsKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useCreatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post<PaymentTypeFull>(
        "/payment-types",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTypesKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useUpdatePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await api.put<PaymentTypeFull>(
        `/payment-types/${id}`,
        { name },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTypesKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useDeletePaymentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/payment-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentTypesKey });
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export type BudgetType = "daily" | "weekly" | "monthly" | "yearly";

export type Budget = {
  id: number;
  user_id?: number;
  name: string;
  description: string | null;
  type: BudgetType;
  amount: number;
  start_date: string;
  end_date: string;
  include_subscription_payments: boolean;
  is_active: boolean;
  paymentMethods?: PaymentLookup[];
  paymentPlatforms?: PaymentLookup[];
  paymentTypes?: PaymentLookup[];
};

export type BudgetIndexResponse = {
  budgets: Budget[];
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
  budgetTypes: BudgetType[];
};

export type BudgetInput = {
  name: string;
  description?: string | null;
  type: BudgetType;
  amount: number;
  start_date: string;
  end_date?: string | null;
  include_subscription_payments: boolean;
  payment_method_ids?: number[];
  payment_platform_ids?: number[];
  payment_type_ids?: number[];
};

const budgetsKey = ["budgets"] as const;

export function useBudgets() {
  return useQuery<BudgetIndexResponse>({
    queryKey: budgetsKey,
    queryFn: async () =>
      (await api.get<BudgetIndexResponse>("/budgets")).data,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BudgetInput) => {
      await api.post("/budgets", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsKey });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: BudgetInput }) => {
      await api.put(`/budgets/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsKey });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsKey });
    },
  });
}

export function useToggleBudgetActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/budgets/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetsKey });
    },
  });
}

export type SubscriptionFrequency = "monthly" | "3_months" | "6_months" | "annual";

export type Subscription = {
  id: number;
  user_id?: number;
  name: string;
  description: string | null;
  amount: number;
  start_date: string;
  end_date: string | null;
  payment_day: number;
  payment_frequency: SubscriptionFrequency;
  is_active: boolean;
  payment_method_id: number;
  payment_platform_id: number;
  paymentMethod?: PaymentLookup | null;
  paymentPlatform?: PaymentLookup | null;
  paymentTypes?: PaymentLookup[];
};

export type SubscriptionIndexResponse = {
  subscriptions: Subscription[];
  paymentMethods: PaymentLookup[];
  paymentPlatforms: PaymentLookup[];
  paymentTypes: PaymentLookup[];
};

export type SubscriptionInput = {
  name: string;
  description?: string | null;
  amount: number;
  start_date: string;
  end_date?: string | null;
  payment_day: number;
  payment_frequency: SubscriptionFrequency;
  payment_method_id: number;
  payment_platform_id: number;
  payment_type_ids: number[];
};

const subscriptionsKey = ["subscriptions"] as const;

export function useSubscriptions() {
  return useQuery<SubscriptionIndexResponse>({
    queryKey: subscriptionsKey,
    queryFn: async () =>
      (await api.get<SubscriptionIndexResponse>("/subscriptions")).data,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubscriptionInput) => {
      await api.post("/subscriptions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: SubscriptionInput;
    }) => {
      await api.put(`/subscriptions/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}

export function useToggleSubscriptionActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/subscriptions/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionsKey });
    },
  });
}

export function useGenerateSubscriptionPayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{
        ok: boolean;
        success?: string;
        error?: string;
      }>("/subscriptions/generate-payments");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.cashflow });
    },
  });
}

export function useYoutubeChannels(
  params?: { search?: string; page?: number },
  options?: { enabled?: boolean },
) {
  const search = params?.search?.trim() ?? "";
  const page = params?.page ?? 1;
  return useQuery({
    queryKey: [...heavyKeys.youtubeChannels, { search, page }] as const,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (page > 1) qs.set("page", String(page));
      const url = `/youtube-channels${qs.toString() ? `?${qs.toString()}` : ""}`;
      const { data } = await api.get<YoutubeChannelsResponse>(url);
      return data;
    },
  });
}

export function useYoutubeVideosForDate(
  date: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...heavyKeys.youtubeVideosByDate, date] as const,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<YoutubeVideosForDateResponse>(
        `/youtube-videos?date=${encodeURIComponent(date)}`,
      );
      return data;
    },
  });
}

export function useToggleYoutubeChannelActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: number) => {
      await api.patch(`/youtube-channels/${channelId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeChannels });
    },
  });
}

export function useDeleteYoutubeChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: number) => {
      await api.delete(`/youtube-channels/${channelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeChannels });
    },
  });
}

export function useToggleYoutubeChannelVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: number) => {
      await api.patch(`/youtube-channels/${channelId}/toggle-visibility`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: heavyKeys.youtubeVideosByDate,
      });
    },
  });
}

export function useToggleYoutubeVideoWatched() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: number) => {
      await api.patch(`/youtube-videos/${videoId}/toggle-watched`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: heavyKeys.youtubeVideosByDate,
      });
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeWatchlist });
    },
  });
}

export function useToggleYoutubeVideoWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: number) => {
      await api.patch(`/youtube-videos/${videoId}/toggle-watchlist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: heavyKeys.youtubeVideosByDate,
      });
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeWatchlist });
    },
  });
}

export function useTwitchChannels(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: heavyKeys.twitchChannels,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<{
        channels: TwitchChannelView[];
        liveChannelsCount: number;
      }>("/twitch-channels");
      return data;
    },
  });
}

export function useTwitchChannel(id: number | null) {
  return useQuery({
    queryKey: id != null ? heavyKeys.twitchChannel(id) : ["twitch-channels", "none"],
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{
        channel: TwitchChannelView;
        recentStreams: TwitchStreamView[];
        currentStream: TwitchStreamView | null;
      }>(`/twitch-channels/${id}`);
      return data;
    },
  });
}

export function useCreateTwitchChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TwitchChannelInput) => {
      const { data } = await api.post("/twitch-channels", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.twitchChannels });
    },
  });
}

export function useUpdateTwitchChannel(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TwitchChannelInput) => {
      const { data } = await api.patch(`/twitch-channels/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.twitchChannels });
      queryClient.invalidateQueries({ queryKey: heavyKeys.twitchChannel(id) });
    },
  });
}

export function useDeleteTwitchChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/twitch-channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.twitchChannels });
    },
  });
}

export function useRssFeeds() {
  return useQuery({
    queryKey: heavyKeys.rssFeeds,
    queryFn: async () => {
      const { data } = await api.get<{ feeds: RssFeedView[] }>("/rss-feeds");
      return data;
    },
  });
}

export function useRssNews(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: heavyKeys.rssNews,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<{ items: RssNewsItem[] }>("/rss-news");
      return data;
    },
  });
}

export function usePlanningUnlinked() {
  return useQuery({
    queryKey: heavyKeys.planningUnlinked,
    queryFn: async () => {
      const { data } = await api.get<{ tasks: PlanningTaskUnlinked[] }>(
        "/planning-tasks/unlinked",
      );
      return data;
    },
  });
}

export function useYoutubeWatchlist(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: heavyKeys.youtubeWatchlist,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<{
        videos: YoutubeVideo[];
        total_count: number;
        watched_count: number;
        unwatched_count: number;
      }>("/youtube-videos/watchlist");
      return data;
    },
  });
}

export function useTwitchLive(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: heavyKeys.twitchLive,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data } = await api.get<{
        streams: TwitchLiveStream[];
        count: number;
      }>("/twitch-streams/live-for-calendar");
      return data;
    },
  });
}

export function useToggleYoutubeWatched() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (videoId: number) => {
      await api.patch(`/youtube-videos/${videoId}/toggle-watched`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeWatchlist });
    },
  });
}

export function useAddYoutubeByUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.post<{ ok?: boolean; message?: string }>(
        "/youtube-videos/add-by-url",
        { url },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heavyKeys.youtubeWatchlist });
    },
  });
}
