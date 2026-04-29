import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  AutoTaskRule,
  Bag,
  Bookmark,
  EventTask,
  Hardware,
  MediaTask,
  MegaFile,
  Note,
  Paginated,
  Person,
  Pill,
  Place,
  Recipe,
  Review,
  ReviewCategory,
  ReviewCategoryWithCount,
  Software,
  Tag,
  Trip,
  WishlistItem,
} from "@/types/entities";

export const entityKeys = {
  tags: ["tags"] as const,
  places: ["places"] as const,
  persons: ["persons"] as const,
  pills: ["pills"] as const,
  autoTasks: ["auto-tasks"] as const,
  eventTasks: ["event-tasks"] as const,
  media: ["media"] as const,
  reviews: ["reviews"] as const,
  reviewCategories: ["review-categories"] as const,
  bags: ["bags"] as const,
  hardware: ["hardware"] as const,
  software: ["software"] as const,
  trips: ["trips"] as const,
  megaFiles: ["mega-files"] as const,
  recipes: ["recipes"] as const,
  wishlist: ["wishlist"] as const,
  bookmarks: ["bookmarks"] as const,
  notes: ["notes"] as const,
  taskCategories: ["task-categories"] as const,
};

export type TaskCategory = {
  id: number;
  user_id?: number;
  name: string;
  color: string;
  order?: number;
};

export type TaskCategoryInput = {
  name: string;
  color: string;
};

export function useTaskCategories() {
  return useQuery<TaskCategory[]>({
    queryKey: entityKeys.taskCategories,
    queryFn: async () =>
      (await api.get<TaskCategory[]>("/task-categories")).data,
  });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskCategoryInput) => {
      const { data } = await api.post<TaskCategory>(
        "/task-categories",
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.taskCategories });
    },
  });
}

export function useUpdateTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: TaskCategoryInput;
    }) => {
      const { data } = await api.patch<TaskCategory>(
        `/task-categories/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.taskCategories });
    },
  });
}

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/task-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.taskCategories });
    },
  });
}

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: entityKeys.tags,
    queryFn: async () => (await api.get<Tag[]>("/tags")).data,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      color?: string;
      description?: string;
      is_searchable?: boolean;
    }) => {
      const { data } = await api.post<Tag>("/tags", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: {
        name?: string;
        color?: string;
        description?: string;
        is_searchable?: boolean;
      };
    }) => {
      const { data } = await api.patch<Tag>(`/tags/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

export function useResetTagPositions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/tags/reset-positions");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

export function useConnectTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tag_id_1,
      tag_id_2,
    }: {
      tag_id_1: number;
      tag_id_2: number;
    }) => {
      await api.post("/tags/connect", { tag_id_1, tag_id_2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
    },
  });
}

type TaggedItemSummary = {
  id: number;
  title?: string;
  name?: string;
};

export type TagWithRelations = Tag & {
  description?: string | null;
  bookmarks: TaggedItemSummary[];
  notes: TaggedItemSummary[];
  recipes: TaggedItemSummary[];
  wishlistItems: TaggedItemSummary[];
  places: TaggedItemSummary[];
  persons: TaggedItemSummary[];
  bags: TaggedItemSummary[];
  hardware: TaggedItemSummary[];
  software: TaggedItemSummary[];
  megaFiles: TaggedItemSummary[];
  trips: TaggedItemSummary[];
  connected_tags: Tag[];
};

export function useTag(id: number | null) {
  return useQuery<TagWithRelations>({
    queryKey: [...entityKeys.tags, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<TagWithRelations>(`/tags/${id}`);
      return data;
    },
  });
}

export function useDisconnectTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tag_id_1,
      tag_id_2,
    }: {
      tag_id_1: number;
      tag_id_2: number;
    }) => {
      await api.post("/tags/disconnect", { tag_id_1, tag_id_2 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
      queryClient.invalidateQueries({ queryKey: entityKeys.tags });
    },
  });
}

// Cross-entity links (graph_links + tag_connections from the backend).
export type LinkedNode = {
  type: string;
  id: number;
  label: string;
  color: string | null;
};

const linkedKey = (type: string, id: number) =>
  ["entity-links", type, id] as const;

export function useEntityLinks(type: string, id: number | null) {
  return useQuery<LinkedNode[]>({
    queryKey: linkedKey(type, id ?? 0),
    enabled: id != null,
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        id: String(id),
      });
      const { data } = await api.get<LinkedNode[]>(
        `/entity-links?${params.toString()}`,
      );
      return data;
    },
  });
}

export function useConnectEntities(type: string, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (other: { type: string; id: number }) => {
      await api.post("/graph-nodes/connect", {
        from_type: type,
        from_id: id,
        to_type: other.type,
        to_id: other.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkedKey(type, id) });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

export function useDisconnectEntities(type: string, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (other: { type: string; id: number }) => {
      await api.post("/graph-nodes/disconnect", {
        from_type: type,
        from_id: id,
        to_type: other.type,
        to_id: other.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkedKey(type, id) });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}

// Spotlight-style search across all SecondBrain entities + tags.
export type SearchResult = {
  id: number;
  type: string;
  type_label: string;
  title: string;
  subtitle?: string | null;
};

export function useSecondBrainSearch(query: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["second-brain-search", query] as const,
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const { data } = await api.get<{ results: SearchResult[] }>(
        `/secondbrain/search?query=${encodeURIComponent(query)}`,
      );
      return data.results ?? [];
    },
    staleTime: 30_000,
  });
}

export function usePlaces() {
  return useQuery<Place[]>({
    queryKey: entityKeys.places,
    queryFn: async () => (await api.get<Place[]>("/places")).data,
  });
}

export function usePersons() {
  return useQuery<Person[]>({
    queryKey: entityKeys.persons,
    queryFn: async () => (await api.get<Person[]>("/persons")).data,
  });
}

export function usePills() {
  return useQuery<Pill[]>({
    queryKey: entityKeys.pills,
    queryFn: async () => {
      const { data } = await api.get<{ pills: Paginated<Pill> }>("/pills");
      return data.pills.data;
    },
  });
}

export function useAutoTasks() {
  return useQuery<AutoTaskRule[]>({
    queryKey: entityKeys.autoTasks,
    queryFn: async () => {
      const { data } = await api.get<{ rules: Paginated<AutoTaskRule> }>(
        "/auto-tasks",
      );
      return data.rules.data;
    },
  });
}

export function useEventTasks() {
  return useQuery<EventTask[]>({
    queryKey: entityKeys.eventTasks,
    queryFn: async () => {
      const { data } = await api.get<{ eventTasks: Paginated<EventTask> }>(
        "/event-tasks",
      );
      return data.eventTasks.data;
    },
  });
}

export type EventTaskInput = {
  name: string;
  month: number;
  day: number;
  is_active?: boolean;
};

export function useEventTask(id: number | null) {
  return useQuery<EventTask>({
    queryKey: [...entityKeys.eventTasks, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ eventTask: EventTask }>(
        `/event-tasks/${id}`,
      );
      return data.eventTask;
    },
  });
}

export function useCreateEventTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventTaskInput) => {
      await api.post("/event-tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.eventTasks });
    },
  });
}

export function useUpdateEventTask(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventTaskInput) => {
      await api.patch(`/event-tasks/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.eventTasks });
      queryClient.invalidateQueries({
        queryKey: [...entityKeys.eventTasks, "one", id],
      });
    },
  });
}

export function useDeleteEventTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/event-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.eventTasks });
    },
  });
}

export type AutoTaskRuleInput = {
  name: string;
  content: string;
  rule_type: AutoTaskRule["rule_type"];
  day_of_week?: number | null;
  day_of_month?: number | null;
  month?: number | null;
  interval_days?: number | null;
  interval_months?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_work?: boolean;
  is_active?: boolean;
  use_last_execution?: boolean;
  sub_tasks?: { content: string }[];
  linked_entities?: { id: number; type: string; model_class: string }[];
  task_category_ids?: number[];
};

export function useAutoTaskRule(id: number | null) {
  return useQuery<AutoTaskRule>({
    queryKey: [...entityKeys.autoTasks, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ rule: AutoTaskRule }>(
        `/auto-tasks/${id}`,
      );
      return data.rule;
    },
  });
}

export function useCreateAutoTaskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AutoTaskRuleInput) => {
      await api.post("/auto-tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.autoTasks });
    },
  });
}

export function useUpdateAutoTaskRule(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AutoTaskRuleInput) => {
      await api.patch(`/auto-tasks/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.autoTasks });
      queryClient.invalidateQueries({
        queryKey: [...entityKeys.autoTasks, "one", id],
      });
    },
  });
}

export function useDeleteAutoTaskRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/auto-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.autoTasks });
    },
  });
}

export function useToggleAutoTaskActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/auto-tasks/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.autoTasks });
    },
  });
}

export function useMedia() {
  return useQuery({
    queryKey: entityKeys.media,
    queryFn: async () => {
      const { data } = await api.get<{
        nearFuture: MediaTask[];
        watchlist: MediaTask[];
        reviewCategories: ReviewCategory[];
      }>("/media");
      return data;
    },
  });
}

export type MediaTaskInput = {
  title: string;
  description?: string | null;
  is_watchlist: boolean;
  review_category_id?: number | null;
};

export function useCreateMediaTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MediaTaskInput) => {
      const { data } = await api.post("/media", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.media });
    },
  });
}

export function useUpdateMediaTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: MediaTaskInput;
    }) => {
      const { data } = await api.patch(`/media/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.media });
    },
  });
}

export function useDeleteMediaTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.media });
    },
  });
}

export function useToggleMediaWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/media/${id}/toggle-watchlist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.media });
    },
  });
}

export function useMarkMediaUndone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/media/${id}/mark-undone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.media });
    },
  });
}

export type ReviewsPayload = {
  reviews: Review[];
  categories: ReviewCategoryWithCount[];
  selectedCategory: number | null;
};

export function useReviews(categoryId?: number | null) {
  const qs = categoryId != null ? `?category=${categoryId}` : "";
  return useQuery<ReviewsPayload>({
    queryKey: [...entityKeys.reviews, "list", categoryId ?? null] as const,
    queryFn: async () => {
      const { data } = await api.get<ReviewsPayload>(`/reviews${qs}`);
      return data;
    },
  });
}

export function useReview(id: number | null) {
  return useQuery<Review>({
    queryKey: [...entityKeys.reviews, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ review: Review }>(`/reviews/${id}`);
      return data.review;
    },
  });
}

export type ReviewInput = {
  review_category_id: number | null;
  title: string;
  rating: number;
  content?: string | null;
  completion_date?: string | null;
};

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewInput) => {
      await api.post("/reviews", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
    },
  });
}

export function useUpdateReview(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewInput) => {
      await api.put(`/reviews/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
    },
  });
}

export function useReviewCategories() {
  return useQuery<ReviewCategoryWithCount[]>({
    queryKey: entityKeys.reviewCategories,
    queryFn: async () => {
      const { data } = await api.get<{ categories: ReviewCategoryWithCount[] }>(
        "/review-categories",
      );
      return data.categories;
    },
  });
}

export type ReviewCategoryInput = {
  name: string;
  color: string;
};

export function useCreateReviewCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewCategoryInput) => {
      await api.post("/review-categories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
    },
  });
}

export function useUpdateReviewCategory(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewCategoryInput) => {
      await api.put(`/review-categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
    },
  });
}

export function useDeleteReviewCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/review-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.reviewCategories });
      queryClient.invalidateQueries({ queryKey: entityKeys.reviews });
    },
  });
}

// Re-export for convenience
export type { ReviewCategory };

export function useBags() {
  return useQuery<Bag[]>({
    queryKey: entityKeys.bags,
    queryFn: async () => (await api.get<Bag[]>("/bags")).data,
  });
}

export function useHardware() {
  return useQuery<Hardware[]>({
    queryKey: entityKeys.hardware,
    queryFn: async () => (await api.get<Hardware[]>("/hardware")).data,
  });
}

export function useSoftware() {
  return useQuery<Software[]>({
    queryKey: entityKeys.software,
    queryFn: async () => (await api.get<Software[]>("/software")).data,
  });
}

export function useTrips() {
  return useQuery<Trip[]>({
    queryKey: entityKeys.trips,
    queryFn: async () => (await api.get<Trip[]>("/trips")).data,
  });
}

export function useMegaFiles() {
  return useQuery<MegaFile[]>({
    queryKey: entityKeys.megaFiles,
    queryFn: async () => (await api.get<MegaFile[]>("/mega-files")).data,
  });
}

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: entityKeys.recipes,
    queryFn: async () => (await api.get<Recipe[]>("/recipes")).data,
  });
}

export function useWishlist() {
  return useQuery<WishlistItem[]>({
    queryKey: entityKeys.wishlist,
    queryFn: async () => (await api.get<WishlistItem[]>("/wishlist")).data,
  });
}

export function useToggleWishlistPurchased() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/wishlist/${id}/toggle-purchased`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.wishlist });
    },
  });
}

export function useBookmarks() {
  return useQuery<Bookmark[]>({
    queryKey: entityKeys.bookmarks,
    queryFn: async () => (await api.get<Bookmark[]>("/bookmarks")).data,
  });
}

export function useBookmark(id: number | null) {
  return useQuery<Bookmark>({
    queryKey: ["bookmark", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ bookmark: Bookmark }>(
        `/bookmarks/${id}`,
      );
      return data.bookmark;
    },
  });
}

export type BookmarkInput = {
  title: string;
  url: string;
  description?: string | null;
  tag_ids?: number[];
};

export function useCreateBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BookmarkInput) => {
      const { data } = await api.post<{ bookmark: Bookmark }>(
        "/bookmarks",
        payload,
      );
      return data.bookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.bookmarks });
    },
  });
}

export function useUpdateBookmark(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BookmarkInput) => {
      const { data } = await api.patch<{ bookmark: Bookmark }>(
        `/bookmarks/${id}`,
        payload,
      );
      return data.bookmark;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.bookmarks });
      queryClient.invalidateQueries({ queryKey: ["bookmark", id] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.bookmarks });
    },
  });
}

// Generic CRUD wrappers used by the simpler entity forms (bags / hardware /
// software / places / persons). Each backend `show` route returns the entity
// nested under a single key (`{bag: ...}`, `{place: ...}`, etc.); the
// `wrapKey` arg pulls that out so the caller deals with a flat resource.
type CrudShape = {
  resource: string;
  wrapKey: string;
  queryKey: readonly unknown[];
};

function makeOne<T>({ resource, wrapKey, queryKey }: CrudShape) {
  return (id: number | null) =>
    useQuery<T>({
      queryKey: [...queryKey, "one", id] as const,
      enabled: id != null,
      queryFn: async () => {
        const { data } = await api.get<Record<string, T>>(`/${resource}/${id}`);
        return data[wrapKey];
      },
    });
}

function makeCreate<TInput, TOut>({
  resource,
  wrapKey,
  queryKey,
}: CrudShape) {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (payload: TInput) => {
        const { data } = await api.post<Record<string, TOut>>(
          `/${resource}`,
          payload,
        );
        return data[wrapKey];
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  };
}

function makeUpdate<TInput, TOut>({
  resource,
  wrapKey,
  queryKey,
}: CrudShape) {
  return (id: number) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (payload: TInput) => {
        const { data } = await api.patch<Record<string, TOut>>(
          `/${resource}/${id}`,
          payload,
        );
        return data[wrapKey];
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: [...queryKey, "one", id] });
      },
    });
  };
}

function makeDelete({ resource, queryKey }: { resource: string; queryKey: readonly unknown[] }) {
  return () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: number) => {
        await api.delete(`/${resource}/${id}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  };
}

// Pill
export type PillInput = {
  name: string;
  description?: string | null;
  schedule_type: "daily" | "daily_interval";
  interval_days?: number | null;
  taking_time: string; // HH:MM
  reminder_interval_seconds?: number;
  show_before_minutes?: number;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
};

export type PillFull = Pill & {
  taking_time?: string | null;
  interval_days?: number | null;
  reminder_interval_seconds?: number | null;
  show_before_minutes?: number | null;
  start_date?: string | null;
  end_date?: string | null;
};

export function usePill(id: number | null) {
  return useQuery<PillFull>({
    queryKey: ["pill", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ pill: PillFull }>(`/pills/${id}`);
      return data.pill;
    },
  });
}

export function useCreatePill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PillInput) => {
      const { data } = await api.post<Pill>("/pills", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.pills });
    },
  });
}

export function useUpdatePill(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PillInput) => {
      const { data } = await api.patch<Pill>(`/pills/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.pills });
      queryClient.invalidateQueries({ queryKey: ["pill", id] });
    },
  });
}

export function useDeletePill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/pills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.pills });
    },
  });
}

export function useTogglePillActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/pills/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.pills });
    },
  });
}

// Bag
export type BagInput = { title: string; description?: string | null; tag_ids?: number[] };
export const useBag = makeOne<Bag>({ resource: "bags", wrapKey: "bag", queryKey: entityKeys.bags });
export const useCreateBag = makeCreate<BagInput, Bag>({ resource: "bags", wrapKey: "bag", queryKey: entityKeys.bags });
export const useUpdateBag = makeUpdate<BagInput, Bag>({ resource: "bags", wrapKey: "bag", queryKey: entityKeys.bags });
export const useDeleteBag = makeDelete({ resource: "bags", queryKey: entityKeys.bags });

// Hardware
export type HardwareInput = { title: string; description?: string | null; tag_ids?: number[] };
export const useHardwareOne = makeOne<Hardware>({ resource: "hardware", wrapKey: "hardware", queryKey: entityKeys.hardware });
export const useCreateHardware = makeCreate<HardwareInput, Hardware>({ resource: "hardware", wrapKey: "hardware", queryKey: entityKeys.hardware });
export const useUpdateHardware = makeUpdate<HardwareInput, Hardware>({ resource: "hardware", wrapKey: "hardware", queryKey: entityKeys.hardware });
export const useDeleteHardware = makeDelete({ resource: "hardware", queryKey: entityKeys.hardware });

// Software
export type SoftwareInput = { title: string; description?: string | null; tag_ids?: number[] };
export const useSoftwareOne = makeOne<Software>({ resource: "software", wrapKey: "software", queryKey: entityKeys.software });
export const useCreateSoftware = makeCreate<SoftwareInput, Software>({ resource: "software", wrapKey: "software", queryKey: entityKeys.software });
export const useUpdateSoftware = makeUpdate<SoftwareInput, Software>({ resource: "software", wrapKey: "software", queryKey: entityKeys.software });
export const useDeleteSoftware = makeDelete({ resource: "software", queryKey: entityKeys.software });

// Place
export type PlaceInput = { name: string; description?: string | null; url?: string | null; tag_ids?: number[] };
export const usePlace = makeOne<Place>({ resource: "places", wrapKey: "place", queryKey: entityKeys.places });
export const useCreatePlace = makeCreate<PlaceInput, Place>({ resource: "places", wrapKey: "place", queryKey: entityKeys.places });
export const useUpdatePlace = makeUpdate<PlaceInput, Place>({ resource: "places", wrapKey: "place", queryKey: entityKeys.places });
export const useDeletePlace = makeDelete({ resource: "places", queryKey: entityKeys.places });

// Person
export type PersonInput = { name: string; description?: string | null; birth_date?: string | null; tag_ids?: number[] };
export const usePerson = makeOne<Person>({ resource: "persons", wrapKey: "person", queryKey: entityKeys.persons });
export const useCreatePerson = makeCreate<PersonInput, Person>({ resource: "persons", wrapKey: "person", queryKey: entityKeys.persons });
export const useUpdatePerson = makeUpdate<PersonInput, Person>({ resource: "persons", wrapKey: "person", queryKey: entityKeys.persons });
export const useDeletePerson = makeDelete({ resource: "persons", queryKey: entityKeys.persons });

// Wishlist
export type WishlistInput = { name: string; link?: string | null; notes?: string | null; tag_ids?: number[] };
export const useWishlistOne = makeOne<WishlistItem>({ resource: "wishlist", wrapKey: "item", queryKey: entityKeys.wishlist });
export const useCreateWishlist = makeCreate<WishlistInput, WishlistItem>({ resource: "wishlist", wrapKey: "item", queryKey: entityKeys.wishlist });
export const useUpdateWishlist = makeUpdate<WishlistInput, WishlistItem>({ resource: "wishlist", wrapKey: "item", queryKey: entityKeys.wishlist });
export const useDeleteWishlist = makeDelete({ resource: "wishlist", queryKey: entityKeys.wishlist });

// Sharable links (per entity)
export type ShareableType =
  | "person"
  | "place"
  | "recipe"
  | "hardware"
  | "software"
  | "trip"
  | "bag"
  | "note"
  | "bookmark"
  | "mega_file"
  | "wishlist_item";

export type SharableLink = {
  id: number;
  token: string;
  expires_at: string;
  created_at: string;
  url: string;
};

const sharableLinkKey = (type: ShareableType, id: number) =>
  ["sharable-links", type, id] as const;

export function useSharableLinks(type: ShareableType, id: number | null) {
  return useQuery<SharableLink[]>({
    queryKey: sharableLinkKey(type, id ?? 0),
    enabled: id != null,
    queryFn: async () => {
      const params = new URLSearchParams({
        shareable_type: type,
        shareable_id: String(id),
      });
      const { data } = await api.get<{ links: SharableLink[] } | SharableLink[]>(
        `/sharable-links?${params.toString()}`,
      );
      return Array.isArray(data) ? data : data.links;
    },
  });
}

export function useCreateSharableLink(type: ShareableType, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expiresInHours: number) => {
      const { data } = await api.post<{ link: SharableLink } | SharableLink>(
        "/sharable-links",
        {
          shareable_type: type,
          shareable_id: id,
          expires_in_hours: expiresInHours,
        },
      );
      return "link" in data ? data.link : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharableLinkKey(type, id) });
    },
  });
}

export function useDeleteSharableLink(type: ShareableType, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      await api.delete(`/sharable-links/${token}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharableLinkKey(type, id) });
    },
  });
}

export type SharedEntityResponse =
  | {
      entityType: string;
      entity: Record<string, unknown> & {
        id: number;
        tags?: Tag[];
      };
      expiresAt: string;
      error?: undefined;
    }
  | {
      error: "not_found" | "expired" | string;
      message: string;
      description?: string;
      expiredAt?: string;
    };

export function useSharedEntity(token: string | null) {
  return useQuery<SharedEntityResponse>({
    queryKey: ["share", token] as const,
    enabled: token != null && token.length > 0,
    queryFn: async () => {
      const { data } = await api.get<SharedEntityResponse>(
        `/share/${encodeURIComponent(token!)}`,
      );
      return data;
    },
    retry: false,
  });
}

// Bookmark categories + subcategories
export type CategoryInput = {
  name: string;
  description?: string | null;
};
export type SubcategoryInput = CategoryInput & {
  bookmark_category_id?: number;
  note_category_id?: number;
};

export const bookmarkCategoryKeys = ["bookmark-categories"] as const;
export const bookmarkSubcategoryKeys = ["bookmark-subcategories"] as const;
export const noteCategoryKeys = ["note-categories"] as const;
export const noteSubcategoryKeys = ["note-subcategories"] as const;

export function useBookmarkCategories() {
  return useQuery<import("@/types/entities").BookmarkCategoryFull[]>({
    queryKey: bookmarkCategoryKeys,
    queryFn: async () =>
      (
        await api.get<import("@/types/entities").BookmarkCategoryFull[]>(
          "/bookmark-categories",
        )
      ).data,
  });
}

export function useCreateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryInput) => {
      await api.post("/bookmark-categories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
    },
  });
}

export function useUpdateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: CategoryInput;
    }) => {
      await api.patch(`/bookmark-categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
    },
  });
}

export function useDeleteBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bookmark-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
    },
  });
}

export function useCreateBookmarkSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubcategoryInput) => {
      await api.post("/bookmark-subcategories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
      queryClient.invalidateQueries({ queryKey: bookmarkSubcategoryKeys });
    },
  });
}

export function useUpdateBookmarkSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: SubcategoryInput;
    }) => {
      await api.patch(`/bookmark-subcategories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
      queryClient.invalidateQueries({ queryKey: bookmarkSubcategoryKeys });
    },
  });
}

export function useDeleteBookmarkSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bookmark-subcategories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkCategoryKeys });
      queryClient.invalidateQueries({ queryKey: bookmarkSubcategoryKeys });
    },
  });
}

// Note categories + subcategories
export function useNoteCategories() {
  return useQuery<import("@/types/entities").NoteCategoryFull[]>({
    queryKey: noteCategoryKeys,
    queryFn: async () =>
      (
        await api.get<import("@/types/entities").NoteCategoryFull[]>(
          "/note-categories",
        )
      ).data,
  });
}

export function useNoteSubcategories() {
  return useQuery<import("@/types/entities").NoteSubcategory[]>({
    queryKey: noteSubcategoryKeys,
    queryFn: async () =>
      (
        await api.get<import("@/types/entities").NoteSubcategory[]>(
          "/note-subcategories",
        )
      ).data,
  });
}

export function useCreateNoteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoryInput) => {
      await api.post("/note-categories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
    },
  });
}

export function useUpdateNoteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: CategoryInput;
    }) => {
      await api.patch(`/note-categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
    },
  });
}

export function useDeleteNoteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/note-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
    },
  });
}

export function useCreateNoteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubcategoryInput) => {
      await api.post("/note-subcategories", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
      queryClient.invalidateQueries({ queryKey: noteSubcategoryKeys });
    },
  });
}

export function useUpdateNoteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: SubcategoryInput;
    }) => {
      await api.patch(`/note-subcategories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
      queryClient.invalidateQueries({ queryKey: noteSubcategoryKeys });
    },
  });
}

export function useDeleteNoteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/note-subcategories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteCategoryKeys });
      queryClient.invalidateQueries({ queryKey: noteSubcategoryKeys });
    },
  });
}

// MegaFile
export type MegaFileInput = {
  title: string;
  mega_link: string;
  file_type?: string | null;
  file_size?: string | null;
  description?: string | null;
  is_folder?: boolean;
  tag_ids?: number[];
};

export function useMegaFile(id: number | null) {
  return useQuery<MegaFile>({
    queryKey: [...entityKeys.megaFiles, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ mega_file: MegaFile }>(
        `/mega-files/${id}`,
      );
      return data.mega_file;
    },
  });
}

export function useCreateMegaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MegaFileInput) => {
      const { data } = await api.post<MegaFile>("/mega-files", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.megaFiles });
    },
  });
}

export function useUpdateMegaFile(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MegaFileInput) => {
      const { data } = await api.patch<MegaFile>(`/mega-files/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.megaFiles });
      queryClient.invalidateQueries({
        queryKey: [...entityKeys.megaFiles, "one", id],
      });
    },
  });
}

export function useDeleteMegaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/mega-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.megaFiles });
    },
  });
}

// Recipe
export type RecipeInput = {
  title: string;
  ingredients?: string | null;
  instructions?: string | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  time_minutes?: number | null;
  steps?: { description: string }[];
  tag_ids?: number[];
};

export function useRecipe(id: number | null) {
  return useQuery<Recipe>({
    queryKey: [...entityKeys.recipes, "one", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ recipe: Recipe }>(`/recipes/${id}`);
      return data.recipe;
    },
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecipeInput) => {
      const { data } = await api.post<{ recipe: Recipe }>("/recipes", payload);
      return data.recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.recipes });
    },
  });
}

export function useUpdateRecipe(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecipeInput) => {
      const { data } = await api.patch<{ recipe: Recipe }>(
        `/recipes/${id}`,
        payload,
      );
      return data.recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.recipes });
      queryClient.invalidateQueries({
        queryKey: [...entityKeys.recipes, "one", id],
      });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/recipes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.recipes });
    },
  });
}

// Trip
export type TripInput = { name: string; description?: string | null; start_date?: string | null; end_date?: string | null; tag_ids?: number[] };
export const useTrip = makeOne<Trip>({ resource: "trips", wrapKey: "trip", queryKey: entityKeys.trips });
export const useCreateTrip = makeCreate<TripInput, Trip>({ resource: "trips", wrapKey: "trip", queryKey: entityKeys.trips });
export const useUpdateTrip = makeUpdate<TripInput, Trip>({ resource: "trips", wrapKey: "trip", queryKey: entityKeys.trips });
export const useDeleteTrip = makeDelete({ resource: "trips", queryKey: entityKeys.trips });

export function useNotes() {
  return useQuery<Note[]>({
    queryKey: entityKeys.notes,
    queryFn: async () => (await api.get<Note[]>("/notes")).data,
  });
}

export function useNote(id: number | null) {
  return useQuery<Note>({
    queryKey: ["note", id] as const,
    enabled: id != null,
    queryFn: async () => {
      const { data } = await api.get<{ note: Note }>(`/notes/${id}`);
      return data.note;
    },
  });
}

export type NoteInput = {
  title: string;
  content: string;
  is_searchable?: boolean;
  tags?: number[];
};

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoteInput) => {
      const { data } = await api.post<{ note: Note }>("/notes", payload);
      return data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.notes });
    },
  });
}

export function useUpdateNote(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoteInput) => {
      const { data } = await api.patch<{ note: Note }>(
        `/notes/${id}`,
        payload,
      );
      return data.note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.notes });
      queryClient.invalidateQueries({ queryKey: ["note", id] });
    },
  });
}

export const fastNoteKey = ["notes", "fast-note"] as const;

export function useFastNote(enabled: boolean) {
  return useQuery<Note>({
    queryKey: fastNoteKey,
    enabled,
    queryFn: async () => {
      const { data } = await api.get<{ note: Note }>("/notes/fast-note");
      return data.note;
    },
  });
}

export function useUpdateFastNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ note: Note }>(
        "/notes/fast-note",
        { content },
      );
      return data.note;
    },
    onSuccess: (note) => {
      queryClient.setQueryData(fastNoteKey, note);
      queryClient.invalidateQueries({ queryKey: entityKeys.notes });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.notes });
    },
  });
}
