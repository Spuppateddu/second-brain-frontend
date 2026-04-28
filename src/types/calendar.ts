export type CategoryCount = {
  category_id: number;
  category_name: string;
  category_color: string;
  count: number;
};

export type CalendarDay = {
  date: string;
  total_notes: number;
  done_notes: number;
  personal_pending_notes: number;
  work_pending_notes: number;
  auto_pending_notes: number;
  event_pending_notes: number;
  birthday_pending_notes: number;
  category_counts: CategoryCount[];
};

export type AvailablePlanning = {
  name: string;
  type: "month" | "year";
  start_date: string;
  end_date: string;
  planning_type_id: number;
};

export type CalendarOverview = {
  calendarDays: CalendarDay[];
  availablePlannings: AvailablePlanning[];
};

export type TaskCategory = {
  id: number;
  name: string;
  color: string;
};

export type CalendarSubTask = {
  id: number;
  calendar_task_id: number;
  content: string;
  is_done: boolean;
  order: number;
};

type LinkableSummary = { id: number; title?: string; name?: string };

export type LinkedPlanningTaskSummary = {
  id: number;
  content: string;
  is_done: boolean;
  planningType?: { id: number; name: string; slug: string } | null;
};

export type LinkedPlanningSubTaskSummary = {
  id: number;
  content: string;
  is_done: boolean;
  planning_task_id: number;
  task?: LinkedPlanningTaskSummary | null;
};

export type CalendarTask = {
  id: number;
  user_id: number;
  task_date: string;
  title: string;
  description: string | null;
  content: string | null;
  is_done: boolean;
  is_work: boolean;
  is_cancelled: boolean;
  start_time: string | null;
  end_time: string | null;
  order: number;
  auto_task_rule_id: number | null;
  event_task_id: number | null;
  person_id: number | null;
  linked_planning_task_id?: number | null;
  linked_planning_sub_task_id?: number | null;
  linkedPlanningTask?: LinkedPlanningTaskSummary | null;
  linkedPlanningSubTask?: LinkedPlanningSubTaskSummary | null;
  subTasks: CalendarSubTask[];
  taskCategories: TaskCategory[];
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
  created_at: string;
  updated_at: string;
};

export type CalendarDayPayload = {
  calendarTasks: CalendarTask[];
  calendarWorkTasks: CalendarTask[];
};
