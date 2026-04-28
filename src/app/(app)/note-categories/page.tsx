"use client";

import { CategoryRow, NewCategoryForm } from "@/components/CategoryRow";
import { EntityListShell } from "@/components/EntityListShell";
import {
  useCreateNoteCategory,
  useCreateNoteSubcategory,
  useDeleteNoteCategory,
  useDeleteNoteSubcategory,
  useNoteCategories,
  useNoteSubcategories,
  useUpdateNoteCategory,
  useUpdateNoteSubcategory,
} from "@/lib/queries/entities";
import type { NoteCategoryFull, NoteSubcategory } from "@/types/entities";

function SubRow({ sub }: { sub: NoteSubcategory }) {
  const update = useUpdateNoteSubcategory();
  const remove = useDeleteNoteSubcategory();
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
              note_category_id: sub.note_category_id,
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
  subs,
}: {
  category: NoteCategoryFull;
  subs: NoteSubcategory[];
}) {
  const update = useUpdateNoteCategory();
  const remove = useDeleteNoteCategory();
  const createSub = useCreateNoteSubcategory();

  return (
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
                note_category_id: category.id,
              });
            }}
          />
        </div>
      </div>
    </CategoryRow>
  );
}

export default function NoteCategoriesPage() {
  const cats = useNoteCategories();
  const subs = useNoteSubcategories();
  const create = useCreateNoteCategory();

  const subsByCategory = new Map<number, NoteSubcategory[]>();
  for (const sub of subs.data ?? []) {
    const list = subsByCategory.get(sub.note_category_id) ?? [];
    list.push(sub);
    subsByCategory.set(sub.note_category_id, list);
  }

  const categories = (cats.data ?? [])
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return (
    <EntityListShell
      title="Note categories"
      description="Group your notes. Subcategories nest under each category."
      isLoading={cats.isLoading || subs.isLoading}
      error={cats.error || subs.error}
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
          categories.map((cat) => {
            const list = (subsByCategory.get(cat.id) ?? [])
              .slice()
              .sort(
                (a, b) => a.order - b.order || a.name.localeCompare(b.name),
              );
            return <CategoryBlock key={cat.id} category={cat} subs={list} />;
          })
        )}
      </div>
    </EntityListShell>
  );
}
