"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EntityListShell } from "@/components/EntityListShell";
import {
  SimpleEntityForm,
  type FieldDef,
} from "@/components/SimpleEntityForm";
import { FormSection } from "@/components/UI/FormSection";

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
    <EntityListShell title={`New ${title}`}>
      <FormSection title="Details">
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
      </FormSection>
    </EntityListShell>
  );
}
