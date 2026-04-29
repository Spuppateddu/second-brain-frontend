"use client";

import { Button } from "@heroui/react";
import { useMemo, useState } from "react";
import {
  HiBookmark,
  HiCheck,
  HiMagnifyingGlass,
  HiOutlineBookmark,
  HiPlus,
  HiXMark,
} from "react-icons/hi2";

import { MediaReviewModal } from "@/components/media/MediaReviewModal";
import { MediaTaskModal } from "@/components/media/MediaTaskModal";
import { Input } from "@/components/UI/Input";
import {
  type MediaTaskInput,
  useCreateMediaTask,
  useDeleteMediaTask,
  useMarkMediaUndone,
  useMedia,
  useToggleMediaWatchlist,
  useUpdateMediaTask,
} from "@/lib/queries/entities";
import type { MediaTask } from "@/types/entities";

type CategoryFilter = "all" | "none" | number;

export default function MediaPage() {
  const { data, isLoading, error } = useMedia();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MediaTask | null>(null);
  const [defaultIsWatchlist, setDefaultIsWatchlist] = useState(false);

  const [reviewTask, setReviewTask] = useState<MediaTask | null>(null);

  const create = useCreateMediaTask();
  const update = useUpdateMediaTask();
  const remove = useDeleteMediaTask();
  const toggleWatchlist = useToggleMediaWatchlist();
  const markUndone = useMarkMediaUndone();

  const reviewCategories = useMemo(
    () => data?.reviewCategories ?? [],
    [data?.reviewCategories],
  );
  const nearFuture = useMemo(() => data?.nearFuture ?? [], [data?.nearFuture]);
  const watchlist = useMemo(() => data?.watchlist ?? [], [data?.watchlist]);

  const filteredNearFuture = useMemo(
    () => applyFilters(nearFuture, searchQuery, categoryFilter),
    [nearFuture, searchQuery, categoryFilter],
  );
  const filteredWatchlist = useMemo(
    () => applyFilters(watchlist, searchQuery, categoryFilter),
    [watchlist, searchQuery, categoryFilter],
  );

  const openCreate = (forWatchlist: boolean) => {
    setEditingTask(null);
    setDefaultIsWatchlist(forWatchlist);
    setModalOpen(true);
  };

  const openEdit = (task: MediaTask) => {
    setEditingTask(task);
    setDefaultIsWatchlist(task.is_watchlist);
    setModalOpen(true);
  };

  const handleSave = async (payload: MediaTaskInput) => {
    if (editingTask) {
      await update.mutateAsync({ id: editingTask.id, payload });
    } else {
      await create.mutateAsync(payload);
    }
  };

  const handleToggleDone = (task: MediaTask) => {
    if (task.is_done) {
      markUndone.mutate(task.id);
      return;
    }
    setReviewTask(task);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Media</h1>
      </header>

      {error ? (
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the media. Try refreshing.
        </p>
      ) : (
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description or category..."
                leftIcon={<HiMagnifyingGlass className="h-5 w-5" />}
                fullWidth
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <HiXMark className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <select
              value={
                categoryFilter === "all" || categoryFilter === "none"
                  ? categoryFilter
                  : String(categoryFilter)
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all" || v === "none") {
                  setCategoryFilter(v);
                } else {
                  setCategoryFilter(Number(v));
                }
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-56"
            >
              <option value="all">All types</option>
              <option value="none">No category</option>
              {reviewCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <MediaSection
            title="Watchlist"
            emptyLabel={
              searchQuery ? "No matches in Watchlist." : "Watchlist is empty."
            }
            isLoading={isLoading}
            items={filteredWatchlist}
            onAdd={() => openCreate(true)}
            onEdit={openEdit}
            onToggleWatchlist={(t) => toggleWatchlist.mutate(t.id)}
            onToggleDone={handleToggleDone}
            inWatchlistSection
          />

          <MediaSection
            title="Near Future"
            emptyLabel={
              searchQuery
                ? "No matches in Near Future."
                : "Nothing planned — add something to watch or read soon."
            }
            isLoading={isLoading}
            items={filteredNearFuture}
            onAdd={() => openCreate(false)}
            onEdit={openEdit}
            onToggleWatchlist={(t) => toggleWatchlist.mutate(t.id)}
            onToggleDone={handleToggleDone}
            inWatchlistSection={false}
          />
        </div>
      )}

      <MediaTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTask={editingTask}
        defaultIsWatchlist={defaultIsWatchlist}
        reviewCategories={reviewCategories}
        onSave={handleSave}
        onDelete={
          editingTask ? async (id: number) => remove.mutateAsync(id) : undefined
        }
        isSaving={create.isPending || update.isPending}
        isDeleting={remove.isPending}
      />

      <MediaReviewModal
        open={reviewTask !== null}
        onClose={() => setReviewTask(null)}
        task={reviewTask}
        reviewCategories={reviewCategories}
      />
    </div>
  );
}

function applyFilters(
  items: MediaTask[],
  searchQuery: string,
  categoryFilter: CategoryFilter,
) {
  const query = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryFilter === "none") {
      if ((item.review_category_id ?? null) !== null) return false;
    } else if (categoryFilter !== "all") {
      if (item.review_category_id !== categoryFilter) return false;
    }
    if (!query) return true;
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.description?.toLowerCase().includes(query)) return true;
    if (item.review_category?.name.toLowerCase().includes(query)) return true;
    return false;
  });
}

function MediaSection({
  title,
  emptyLabel,
  isLoading,
  items,
  onAdd,
  onEdit,
  onToggleWatchlist,
  onToggleDone,
  inWatchlistSection,
}: {
  title: string;
  emptyLabel: string;
  isLoading: boolean;
  items: MediaTask[];
  onAdd: () => void;
  onEdit: (task: MediaTask) => void;
  onToggleWatchlist: (task: MediaTask) => void;
  onToggleDone: (task: MediaTask) => void;
  inWatchlistSection: boolean;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <HiPlus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm italic text-zinc-500 dark:text-zinc-400">
          {emptyLabel}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((task) => (
            <MediaRow
              key={task.id}
              task={task}
              onEdit={onEdit}
              onToggleWatchlist={onToggleWatchlist}
              onToggleDone={onToggleDone}
              inWatchlistSection={inWatchlistSection}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MediaRow({
  task,
  onEdit,
  onToggleWatchlist,
  onToggleDone,
  inWatchlistSection,
}: {
  task: MediaTask;
  onEdit: (task: MediaTask) => void;
  onToggleWatchlist: (task: MediaTask) => void;
  onToggleDone: (task: MediaTask) => void;
  inWatchlistSection: boolean;
}) {
  const doneClass = task.is_done
    ? "bg-green-50/60 dark:bg-green-900/20"
    : "bg-white dark:bg-zinc-950";

  return (
    <li
      className={`group flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800 ${doneClass}`}
    >
      <button
        type="button"
        onClick={() => onToggleDone(task)}
        title={task.is_done ? "Mark not done" : "Mark done (write review)"}
        className={`shrink-0 rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          task.is_done ? "text-green-600" : "text-zinc-400"
        }`}
      >
        <HiCheck className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 text-left"
      >
        <div
          className={`truncate text-sm font-medium ${
            task.is_done ? "line-through opacity-60" : ""
          }`}
          title={task.title}
        >
          {task.title}
        </div>
        {task.review_category ? (
          <div
            className="mt-0.5 inline-block text-xs font-medium"
            style={
              task.review_category.color
                ? { color: task.review_category.color }
                : undefined
            }
          >
            {task.review_category.name}
          </div>
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => onToggleWatchlist(task)}
        title={
          inWatchlistSection ? "Move to Near Future" : "Move to Watchlist"
        }
        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800"
      >
        {inWatchlistSection ? (
          <HiBookmark className="h-4 w-4" />
        ) : (
          <HiOutlineBookmark className="h-4 w-4" />
        )}
      </button>
    </li>
  );
}
