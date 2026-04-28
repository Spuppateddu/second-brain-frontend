"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";

export type FieldDef =
  | {
      kind: "text" | "url";
      key: string;
      label: string;
      required?: boolean;
      placeholder?: string;
    }
  | {
      kind: "textarea";
      key: string;
      label: string;
      required?: boolean;
      placeholder?: string;
    }
  | { kind: "date"; key: string; label: string; required?: boolean };

export type FormValues = Record<string, string>;

type Props = {
  fields: FieldDef[];
  initial?: FormValues;
  initialTagIds?: number[];
  withTags?: boolean;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: FormValues, tagIds: number[]) => Promise<void>;
};

export function SimpleEntityForm({
  fields,
  initial,
  initialTagIds,
  withTags = false,
  submitLabel,
  isPending,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<FormValues>(() => {
    const start: FormValues = {};
    for (const f of fields) start[f.key] = initial?.[f.key] ?? "";
    return start;
  });
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds ?? []);

  const valid = fields.every((f) => !f.required || values[f.key].trim() !== "");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const cleaned: FormValues = {};
        for (const f of fields) {
          cleaned[f.key] = values[f.key].trim();
        }
        await onSubmit(cleaned, tagIds);
      }}
    >
      {fields.map((field) => {
        const id = `field-${field.key}`;
        return (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              {field.label}
              {field.required ? <span className="ml-1 text-danger">*</span> : null}
            </span>
            {field.kind === "textarea" ? (
              <textarea
                id={id}
                className="min-h-[100px] rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                id={id}
                type={
                  field.kind === "url"
                    ? "url"
                    : field.kind === "date"
                      ? "date"
                      : "text"
                }
                placeholder={
                  field.kind === "url"
                    ? "https://…"
                    : "placeholder" in field
                      ? field.placeholder
                      : undefined
                }
                value={values[field.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
              />
            )}
          </label>
        );
      })}
      {withTags ? (
        <TagPicker value={tagIds} onChange={setTagIds} />
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isDisabled={!valid || isPending}
        >
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
