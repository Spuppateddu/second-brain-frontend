import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type WaterLog = {
  id: number;
  date: string;
  count: number;
  last_logged_at: string | null;
  target: number;
};

export const waterKeys = {
  all: ["water"] as const,
  forDate: (date: string) => ["water", date] as const,
};

export function useWaterLog(date: string) {
  return useQuery<WaterLog>({
    queryKey: waterKeys.forDate(date),
    queryFn: async () =>
      (await api.get<WaterLog>(`/water/for-date/${date}`)).data,
  });
}

export function useAddGlass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) =>
      (await api.post<WaterLog>("/water/add", { date })).data,
    onSuccess: (log) => {
      qc.setQueryData(waterKeys.forDate(log.date), log);
    },
  });
}

export function useRemoveGlass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) =>
      (await api.post<WaterLog>("/water/remove", { date })).data,
    onSuccess: (log) => {
      qc.setQueryData(waterKeys.forDate(log.date), log);
    },
  });
}
