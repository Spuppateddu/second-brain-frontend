import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  CalendarDayPayload,
  CalendarOverview,
  CalendarSubTask,
  CalendarTask,
} from "@/types/calendar";

export const calendarKeys = {
  overview: ["calendar", "overview"] as const,
  day: (date: string) => ["calendar", "day", date] as const,
};

// The Laravel backend serializes Eloquent relations using snake_case
// (`sub_tasks`, `task_categories`, `linked_bookmarks`, …). Our TS types use
// camelCase. Normalize at the query/mutation boundary so consumer code can
// keep using the camelCase names the types declare.
function normalizeSubTask(raw: Record<string, unknown>): CalendarSubTask {
  return {
    ...(raw as Partial<CalendarSubTask>),
    id: raw.id as number,
    calendar_task_id: raw.calendar_task_id as number,
    content: (raw.content as string) ?? "",
    is_done: !!raw.is_done,
    order: (raw.order as number) ?? 0,
  };
}

function pickRelation<T = Record<string, unknown>>(
  raw: Record<string, unknown>,
  snake: string,
  camel: string,
): T[] {
  const v = (raw[snake] ?? raw[camel]) as T[] | undefined;
  return Array.isArray(v) ? v : [];
}

function pickObjectRelation(
  raw: Record<string, unknown>,
  snake: string,
  camel: string,
): Record<string, unknown> | null {
  const v = raw[snake] ?? raw[camel];
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

type LinkedPlanningTaskNorm = {
  id: number;
  content: string;
  is_done: boolean;
  planningType: { id: number; name: string; slug: string } | null;
};

function normalizeLinkedPlanningTask(
  raw: Record<string, unknown> | null,
): LinkedPlanningTaskNorm | null {
  if (!raw) return null;
  const pt = pickObjectRelation(raw, "planning_type", "planningType");
  return {
    id: raw.id as number,
    content: (raw.content as string) ?? "",
    is_done: !!raw.is_done,
    planningType: pt
      ? {
          id: pt.id as number,
          name: (pt.name as string) ?? "",
          slug: (pt.slug as string) ?? "",
        }
      : null,
  };
}

function normalizeLinkedPlanningSubTask(
  raw: Record<string, unknown> | null,
): {
  id: number;
  content: string;
  is_done: boolean;
  planning_task_id: number;
  task: LinkedPlanningTaskNorm | null;
} | null {
  if (!raw) return null;
  const parent = pickObjectRelation(raw, "task", "task");
  return {
    id: raw.id as number,
    content: (raw.content as string) ?? "",
    is_done: !!raw.is_done,
    planning_task_id: raw.planning_task_id as number,
    task: normalizeLinkedPlanningTask(parent),
  };
}

function normalizeTask(raw: Record<string, unknown>): CalendarTask {
  const subTasksRaw = pickRelation<Record<string, unknown>>(
    raw,
    "sub_tasks",
    "subTasks",
  );
  return {
    ...(raw as Partial<CalendarTask>),
    id: raw.id as number,
    user_id: raw.user_id as number,
    task_date: raw.task_date as string,
    title: (raw.title as string) ?? "",
    description: (raw.description as string | null) ?? null,
    content: (raw.content as string | null) ?? null,
    is_done: !!raw.is_done,
    is_work: !!raw.is_work,
    is_cancelled: !!raw.is_cancelled,
    start_time: (raw.start_time as string | null) ?? null,
    end_time: (raw.end_time as string | null) ?? null,
    order: (raw.order as number) ?? 0,
    auto_task_rule_id: (raw.auto_task_rule_id as number | null) ?? null,
    event_task_id: (raw.event_task_id as number | null) ?? null,
    person_id: (raw.person_id as number | null) ?? null,
    subTasks: subTasksRaw.map(normalizeSubTask),
    taskCategories: pickRelation(raw, "task_categories", "taskCategories"),
    linkedBookmarks: pickRelation(raw, "linked_bookmarks", "linkedBookmarks"),
    linkedNotes: pickRelation(raw, "linked_notes", "linkedNotes"),
    linkedPersons: pickRelation(raw, "linked_persons", "linkedPersons"),
    linkedPlaces: pickRelation(raw, "linked_places", "linkedPlaces"),
    linkedBags: pickRelation(raw, "linked_bags", "linkedBags"),
    linkedHardware: pickRelation(raw, "linked_hardware", "linkedHardware"),
    linkedSoftware: pickRelation(raw, "linked_software", "linkedSoftware"),
    linkedRecipes: pickRelation(raw, "linked_recipes", "linkedRecipes"),
    linkedWishlistItems: pickRelation(
      raw,
      "linked_wishlist_items",
      "linkedWishlistItems",
    ),
    linkedTrips: pickRelation(raw, "linked_trips", "linkedTrips"),
    linked_planning_task_id:
      (raw.linked_planning_task_id as number | null) ?? null,
    linked_planning_sub_task_id:
      (raw.linked_planning_sub_task_id as number | null) ?? null,
    linkedPlanningTask: normalizeLinkedPlanningTask(
      pickObjectRelation(raw, "linked_planning_task", "linkedPlanningTask"),
    ),
    linkedPlanningSubTask: normalizeLinkedPlanningSubTask(
      pickObjectRelation(
        raw,
        "linked_planning_sub_task",
        "linkedPlanningSubTask",
      ),
    ),
    created_at: (raw.created_at as string) ?? "",
    updated_at: (raw.updated_at as string) ?? "",
  } as CalendarTask;
}

function normalizeDayPayload(
  raw: Record<string, unknown>,
): CalendarDayPayload {
  const personal = (raw.calendarTasks as Record<string, unknown>[]) ?? [];
  const work = (raw.calendarWorkTasks as Record<string, unknown>[]) ?? [];
  return {
    calendarTasks: personal.map(normalizeTask),
    calendarWorkTasks: work.map(normalizeTask),
  };
}

export function useCalendarOverview() {
  return useQuery<CalendarOverview>({
    queryKey: calendarKeys.overview,
    queryFn: async () => {
      const { data } = await api.get<CalendarOverview>("/calendar");
      return data;
    },
  });
}

export function useCalendarDay(date: string) {
  return useQuery<CalendarDayPayload>({
    queryKey: calendarKeys.day(date),
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>(
        `/calendar-tasks/${date}`,
      );
      return normalizeDayPayload(data);
    },
    enabled: /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
}

export type LinkedEntityRef = {
  id: number;
  type: string;
  model_class: string;
};

export type CreateCalendarTaskPayload = {
  task_date: string;
  order: number;
  title: string;
  description?: string | null;
  content?: string | null;
  is_work: boolean;
  start_time?: string | null;
  end_time?: string | null;
  task_category_ids?: number[];
  linked_entities?: LinkedEntityRef[];
};

export function useCreateCalendarTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCalendarTaskPayload) => {
      const { data } = await api.post<Record<string, unknown>>(
        "/calendar-tasks",
        payload,
      );
      return normalizeTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overview });
    },
  });
}

export function useUpdateCalendarTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: Partial<CalendarTask>;
    }) => {
      const { data } = await api.patch<Record<string, unknown>>(
        `/calendar-tasks/${id}`,
        patch,
      );
      return normalizeTask(data);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overview });
      // Also invalidate the destination day if the task was moved.
      const newDate = (vars.patch as { task_date?: string }).task_date;
      if (newDate && newDate !== date) {
        queryClient.invalidateQueries({ queryKey: calendarKeys.day(newDate) });
      }
    },
  });
}

export function useMoveCalendarTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      task_date,
    }: {
      id: number;
      task_date: string;
    }) => {
      const { data } = await api.patch<Record<string, unknown>>(
        `/calendar-tasks/${id}`,
        { task_date },
      );
      return normalizeTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useDeleteCalendarTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/calendar-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
      queryClient.invalidateQueries({ queryKey: calendarKeys.overview });
    },
  });
}

export function useCreateCalendarSubTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      calendar_task_id: number;
      content: string;
    }) => {
      const { data } = await api.post<Record<string, unknown>>(
        "/calendar-sub-tasks",
        payload,
      );
      return normalizeSubTask(data);
    },
    onSuccess: (created, vars) => {
      // Optimistically push the new subtask into the cached day so the UI
      // updates immediately without waiting for a background refetch.
      queryClient.setQueryData<CalendarDayPayload>(
        calendarKeys.day(date),
        (prev) => {
          if (!prev) return prev;
          const insert = (tasks: CalendarTask[]) =>
            tasks.map((t) =>
              t.id === vars.calendar_task_id
                ? { ...t, subTasks: [...(t.subTasks ?? []), created] }
                : t,
            );
          return {
            calendarTasks: insert(prev.calendarTasks),
            calendarWorkTasks: insert(prev.calendarWorkTasks),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
    },
  });
}

export function useUpdateCalendarSubTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: number;
      patch: { content?: string; is_done?: boolean; order?: number };
    }) => {
      await api.patch(`/calendar-sub-tasks/${id}`, patch);
    },
    onSuccess: (_data, vars) => {
      queryClient.setQueryData<CalendarDayPayload>(
        calendarKeys.day(date),
        (prev) => {
          if (!prev) return prev;
          const apply = (tasks: CalendarTask[]) =>
            tasks.map((t) => ({
              ...t,
              subTasks: (t.subTasks ?? []).map((s) =>
                s.id === vars.id ? { ...s, ...vars.patch } : s,
              ),
            }));
          return {
            calendarTasks: apply(prev.calendarTasks),
            calendarWorkTasks: apply(prev.calendarWorkTasks),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
    },
  });
}

export function useDeleteCalendarSubTask(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/calendar-sub-tasks/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<CalendarDayPayload>(
        calendarKeys.day(date),
        (prev) => {
          if (!prev) return prev;
          const apply = (tasks: CalendarTask[]) =>
            tasks.map((t) => ({
              ...t,
              subTasks: (t.subTasks ?? []).filter((s) => s.id !== id),
            }));
          return {
            calendarTasks: apply(prev.calendarTasks),
            calendarWorkTasks: apply(prev.calendarWorkTasks),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: calendarKeys.day(date) });
    },
  });
}
