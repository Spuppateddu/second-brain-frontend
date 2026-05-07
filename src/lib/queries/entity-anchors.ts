import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { EditableEntityType } from "@/lib/entity-fetch";

export type CalendarAnchor = {
  type: EditableEntityType;
  id: number;
  title: string;
};

const calendarAnchorsKey = ["calendar-anchors"] as const;

export function useCalendarAnchors() {
  return useQuery<CalendarAnchor[]>({
    queryKey: calendarAnchorsKey,
    queryFn: async () => {
      const { data } = await api.get<{ items: CalendarAnchor[] }>(
        "/calendar-anchors",
      );
      return data.items;
    },
  });
}

export function useToggleCalendarAnchor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: EditableEntityType;
      id: number;
      is_calendar_anchored: boolean;
    }) => {
      const { data } = await api.post<{
        type: EditableEntityType;
        id: number;
        is_calendar_anchored: boolean;
      }>("/calendar-anchors/toggle", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarAnchorsKey });
    },
  });
}
