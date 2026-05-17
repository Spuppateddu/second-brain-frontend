import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { EditableEntityType } from "@/lib/entity-fetch";

const graphVisibilityKey = (type: EditableEntityType, id: number) =>
  ["graph-visibility", type, id] as const;

export function useGraphVisibility(
  type: EditableEntityType | undefined,
  id: number | undefined,
) {
  return useQuery<{ show_in_graph: boolean }>({
    queryKey: type && id ? graphVisibilityKey(type, id) : ["graph-visibility"],
    queryFn: async () => {
      const { data } = await api.get<{ show_in_graph: boolean }>(
        "/graph-nodes/state",
        { params: { type, id } },
      );
      return data;
    },
    enabled: Boolean(type && id),
  });
}

export function useToggleGraphVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      type: EditableEntityType;
      id: number;
      show_in_graph: boolean;
    }) => {
      const { data } = await api.post<{
        type: EditableEntityType;
        id: number;
        show_in_graph: boolean;
      }>("/graph-nodes/toggle", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(graphVisibilityKey(data.type, data.id), {
        show_in_graph: data.show_in_graph,
      });
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
  });
}
