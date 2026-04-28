"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import {
  SimpleEntityForm,
  type FieldDef,
  type FormValues,
} from "@/components/SimpleEntityForm";

type ApiError = { response?: { data?: { message?: string } } };

function readError(err: unknown, fallback: string): string {
  return (err as ApiError)?.response?.data?.message ?? fallback;
}

type Mutator<TInput, TOut> = {
  isPending: boolean;
  mutateAsync: (input: TInput) => Promise<TOut>;
};

export function CreateEntityPage<T extends { id: number }, TInput>({
  title,
  fields,
  listHref,
  detailHref,
  withTags = false,
  useCreate,
}: {
  title: string;
  fields: FieldDef[];
  listHref: string;
  detailHref: (id: number) => string;
  withTags?: boolean;
  useCreate: () => Mutator<TInput, T>;
}) {
  const router = useRouter();
  const create = useCreate();
  const [error, setError] = useState<string | null>(null);

  return (
    <EntityListShell title={title}>
      <SimpleEntityForm
        fields={fields}
        withTags={withTags}
        submitLabel="Create"
        isPending={create.isPending}
        error={error}
        onCancel={() => router.push(listHref)}
        onSubmit={async (values, tagIds) => {
          setError(null);
          try {
            const payload = withTags
              ? { ...values, tag_ids: tagIds }
              : values;
            const created = await create.mutateAsync(
              payload as unknown as TInput,
            );
            router.push(detailHref(created.id));
          } catch (err) {
            setError(readError(err, "Failed to save."));
          }
        }}
      />
    </EntityListShell>
  );
}

export function GenericEditPage<T extends { id: number }, TInput>({
  id,
  title,
  fields,
  listHref,
  toFormValues,
  withTags = false,
  useOne,
  useUpdate,
  useDelete,
  renderBelow,
}: {
  id: number;
  title: string;
  fields: FieldDef[];
  listHref: string;
  toFormValues: (item: T) => FormValues;
  withTags?: boolean;
  useOne: (id: number | null) => {
    data: T | undefined;
    isLoading: boolean;
    error: unknown;
  };
  useUpdate: (id: number) => Mutator<TInput, T>;
  useDelete: () => Mutator<number, void>;
  renderBelow?: (item: T) => React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, error } = useOne(Number.isNaN(id) ? null : id);

  if (Number.isNaN(id)) {
    return (
      <main className="p-6">
        <p className="text-sm text-danger">Invalid id.</p>
      </main>
    );
  }

  return (
    <EntityListShell
      title={data ? `${title} · ${pickDisplay(data, fields)}` : title}
      isLoading={isLoading}
      error={error}
    >
      {data ? (
        <div className="flex flex-col gap-4">
          <EditCard<T, TInput>
            item={data}
            fields={fields}
            toFormValues={toFormValues}
            withTags={withTags}
            useUpdate={useUpdate}
            useDelete={useDelete}
            onDone={() => router.push(listHref)}
          />
          {renderBelow ? renderBelow(data) : null}
        </div>
      ) : null}
    </EntityListShell>
  );
}

function pickDisplay(item: unknown, fields: FieldDef[]): string {
  const labelField = fields.find((f) => f.required && f.kind !== "date");
  const key = labelField?.key ?? "name";
  const value = (item as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

type WithTags = { tags?: { id: number }[] };

function EditCard<T extends { id: number }, TInput>({
  item,
  fields,
  toFormValues,
  withTags,
  useUpdate,
  useDelete,
  onDone,
}: {
  item: T;
  fields: FieldDef[];
  toFormValues: (item: T) => FormValues;
  withTags: boolean;
  useUpdate: (id: number) => Mutator<TInput, T>;
  useDelete: () => Mutator<number, void>;
  onDone: () => void;
}) {
  const update = useUpdate(item.id);
  const remove = useDelete();
  const [error, setError] = useState<string | null>(null);

  const initialTagIds =
    (item as unknown as WithTags).tags?.map((t) => t.id) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <SimpleEntityForm
        fields={fields}
        initial={toFormValues(item)}
        initialTagIds={initialTagIds}
        withTags={withTags}
        submitLabel="Save"
        isPending={update.isPending}
        error={error}
        onCancel={onDone}
        onSubmit={async (values, tagIds) => {
          setError(null);
          try {
            const payload = withTags
              ? { ...values, tag_ids: tagIds }
              : values;
            await update.mutateAsync(payload as unknown as TInput);
            onDone();
          } catch (err) {
            setError(readError(err, "Failed to save."));
          }
        }}
      />
      <div className="flex items-center justify-end">
        <Button
          variant="danger-soft"
          size="sm"
          isDisabled={remove.isPending}
          onClick={async () => {
            if (!confirm("Delete this item?")) return;
            try {
              await remove.mutateAsync(item.id);
              onDone();
            } catch (err) {
              setError(readError(err, "Failed to delete."));
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
