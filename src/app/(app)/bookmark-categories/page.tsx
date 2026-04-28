"use client";

import { CategoryRow, NewCategoryForm } from "@/components/CategoryRow";
import { EntityListShell } from "@/components/EntityListShell";
import {
  useBookmarkCategories,
  useCreateBookmarkCategory,
  useCreateBookmarkSubcategory,
  useDeleteBookmarkCategory,
  useDeleteBookmarkSubcategory,
  useUpdateBookmarkCategory,
  useUpdateBookmarkSubcategory,
} from "@/lib/queries/entities";
import type {
  BookmarkCategoryFull,
  BookmarkSubcategory,
} from "@/types/entities";

function SubRow({
  sub,
}: {
  sub: BookmarkSubcategory;
}) {
  const update = useUpdateBookmarkSubcategory();
  const remove = useDeleteBookmarkSubcategory();
  return (
    <div className="ml-6">
      <CategoryRow
        item={sub}
        isSaving={update.isPending}
        isDeleting={remove.isPending}
        onSave={async (payload) => {
          await update.mutateAsync({
            id: sub.id,
            payload: {
              ...payload,
              bookmark_category_id: sub.bookmark_category_id,
            },
          });
        }}
        onDelete={async () => {
          await remove.mutateAsync(sub.id);
        }}
      />
    </div>
  );
}

function CategoryBlock({
  category,
}: {
  category: BookmarkCategoryFull;
}) {
  const update = useUpdateBookmarkCategory();
  const remove = useDeleteBookmarkCategory();
  const createSub = useCreateBookmarkSubcategory();
  const subs = (category.subcategories ?? []).slice().sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name),
  );

  return (
    <div className="flex flex-col gap-2">
      <CategoryRow
        item={category}
        childCount={subs.length}
        isSaving={update.isPending}
        isDeleting={remove.isPending}
        onSave={async (payload) => {
          await update.mutateAsync({ id: category.id, payload });
        }}
        onDelete={async () => {
          await remove.mutateAsync(category.id);
        }}
      >
        <div className="mt-2 flex flex-col gap-2">
          {subs.map((sub) => (
            <SubRow key={sub.id} sub={sub} />
          ))}
          <div className="ml-6">
            <NewCategoryForm
              placeholder="+ Add subcategory…"
              isPending={createSub.isPending}
              onCreate={async (payload) => {
                await createSub.mutateAsync({
                  ...payload,
                  bookmark_category_id: category.id,
                });
              }}
            />
          </div>
        </div>
      </CategoryRow>
    </div>
  );
}

export default function BookmarkCategoriesPage() {
  const { data, isLoading, error } = useBookmarkCategories();
  const create = useCreateBookmarkCategory();
  const categories = (data ?? [])
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return (
    <EntityListShell
      title="Bookmark categories"
      description="Group your bookmarks. Subcategories nest under each category."
      isLoading={isLoading}
      error={error}
    >
      <div className="flex flex-col gap-3">
        <NewCategoryForm
          placeholder="+ New category…"
          isPending={create.isPending}
          onCreate={async (payload) => {
            await create.mutateAsync(payload);
          }}
        />
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">No categories yet.</p>
        ) : (
          categories.map((cat) => <CategoryBlock key={cat.id} category={cat} />)
        )}
      </div>
    </EntityListShell>
  );
}
