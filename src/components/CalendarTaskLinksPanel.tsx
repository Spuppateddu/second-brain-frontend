"use client";

import {
  TaskLinksPanel,
  asLinkedEntitiesPayload,
  collectTaskLinks,
} from "@/components/TaskLinksPanel";
import { useUpdateCalendarTask } from "@/lib/queries/calendar";
import type { CalendarTask } from "@/types/calendar";

export function CalendarTaskLinksPanel({
  task,
  date,
}: {
  task: CalendarTask;
  date: string;
}) {
  const update = useUpdateCalendarTask(date);
  const links = collectTaskLinks(task as unknown as Record<string, unknown>);

  return (
    <TaskLinksPanel
      links={links}
      isPending={update.isPending}
      onSave={async (next) => {
        await update.mutateAsync({
          id: task.id,
          patch: {
            // The backend's update endpoint expects the full linked_entities array.
            // Pass title through so the rest of the patch is idempotent.
            title: task.title,
            // @ts-expect-error linked_entities + model_class aren't on the partial type
            linked_entities: asLinkedEntitiesPayload(next),
          },
        });
      }}
    />
  );
}
