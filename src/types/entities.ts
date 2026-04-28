// Lightweight types for the entity list pages. Where the backend returns
// arbitrary extra columns we type the known ones and use `& Record<string, unknown>`
// rather than fighting Eloquent's wide JSON.

export type Tag = {
  id: number;
  name: string;
  color: string;
  description?: string | null;
  is_searchable?: boolean;
  order: number;
  position_x?: number | null;
  position_y?: number | null;
  bookmarks_count?: number;
  notes_count?: number;
  recipes_count?: number;
  wishlist_items_count?: number;
  places_count?: number;
  persons_count?: number;
  bags_count?: number;
  hardware_count?: number;
  software_count?: number;
  mega_files_count?: number;
  trips_count?: number;
};

export type Place = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  url: string | null;
  order: number;
  tags: Tag[];
  deleted_at: string | null;
};

export type Person = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  birth_date: string | null;
  order: number;
  tags: Tag[];
  deleted_at: string | null;
};

export type Pill = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  schedule_type: "daily" | "daily_interval";
  interval_days: number | null;
  taking_time: string;
  reminder_interval_seconds: number;
  show_before_minutes: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
};

export type AutoTaskRule = {
  id: number;
  user_id: number;
  name: string;
  content: string;
  rule_type:
    | "daily"
    | "weekly"
    | "monthly_date"
    | "monthly_interval"
    | "daily_interval"
    | "yearly";
  day_of_week?: number | null;
  day_of_month?: number | null;
  month?: number | null;
  interval_days?: number | null;
  interval_months?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_work: boolean;
  is_active: boolean;
  use_last_execution: boolean;
  description?: string | null;
  last_execution?: string | null;
  subTasks?: AutoTaskSubTask[];
  linkedBookmarks?: { id: number; title?: string; name?: string }[];
  linkedNotes?: { id: number; title?: string; name?: string }[];
  linkedPersons?: { id: number; title?: string; name?: string }[];
  linkedPlaces?: { id: number; title?: string; name?: string }[];
  linkedBags?: { id: number; title?: string; name?: string }[];
  linkedHardware?: { id: number; title?: string; name?: string }[];
  linkedSoftware?: { id: number; title?: string; name?: string }[];
  linkedRecipes?: { id: number; title?: string; name?: string }[];
  linkedWishlistItems?: { id: number; title?: string; name?: string }[];
  linkedTrips?: { id: number; title?: string; name?: string }[];
  taskCategories?: { id: number; name: string; color: string }[];
};

export type AutoTaskSubTask = {
  id: number;
  auto_task_rule_id: number;
  content: string;
  order: number;
};

export type EventTask = {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  month: number;
  day: number;
  is_active: boolean;
};

export type MediaTask = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  is_done: boolean;
  is_watchlist: boolean;
  review_id?: number | null;
  review_category_id?: number | null;
  review_category?: { id: number; name: string; color?: string } | null;
  review?: { id: number; title: string } | null;
};

export type ReviewCategory = {
  id: number;
  name: string;
  color: string;
};

export type ReviewCategoryWithCount = ReviewCategory & {
  reviews_count: number;
};

export type Review = {
  id: number;
  user_id: number;
  title: string;
  rating: number | null;
  content: string | null;
  completion_date: string | null;
  review_category_id: number | null;
  review_category?: ReviewCategory | null;
  reviewCategory?: ReviewCategory | null;
  created_at: string;
  updated_at: string;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

// Items that the app stores under SecondBrain. `name` and `title` are
// alternative display fields depending on the entity (mirrors the original
// Eloquent models).
type CommonFields = {
  id: number;
  user_id: number;
  description: string | null;
  tags: Tag[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Bag = CommonFields & { title: string };
export type Hardware = CommonFields & { title: string };
export type Software = CommonFields & { title: string };
export type Trip = CommonFields & {
  name: string;
  start_date: string | null;
  end_date: string | null;
};
export type MegaFile = CommonFields & {
  title: string;
  mega_link: string;
  file_type: string | null;
  file_size: string | null;
  is_folder: boolean;
};
export type RecipeStep = {
  id: number;
  recipe_id: number;
  step_number: number;
  description: string;
};
export type Recipe = CommonFields & {
  title: string;
  ingredients?: string | null;
  instructions?: string | null;
  difficulty?: "easy" | "medium" | "hard" | null;
  time_minutes?: number | null;
  steps: RecipeStep[];
};
export type WishlistItem = CommonFields & {
  name: string;
  link: string | null;
  notes: string | null;
  is_purchased: boolean;
};
export type Bookmark = CommonFields & {
  title: string;
  url: string;
  bookmark_category_id: number | null;
  bookmark_subcategory_id: number | null;
};
export type Note = CommonFields & {
  title: string;
  content: string;
  is_searchable: boolean;
};

export type BookmarkSubcategory = {
  id: number;
  user_id: number;
  bookmark_category_id: number;
  name: string;
  description: string | null;
  order: number;
};

export type BookmarkCategoryFull = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  order: number;
  subcategories: BookmarkSubcategory[];
};

export type NoteSubcategory = {
  id: number;
  user_id: number;
  note_category_id: number;
  name: string;
  description: string | null;
  order: number;
};

export type NoteCategoryFull = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  order: number;
};
