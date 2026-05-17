"use client";

import { Checkbox } from "@heroui/react";
import { useState } from "react";

import { TagPicker } from "@/components/TagPicker";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Textarea } from "@/components/UI/Textarea";

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
  | { kind: "date"; key: string; label: string; required?: boolean }
  | { kind: "checkbox"; key: string; label: string };

export type FormValues = Record<string, string | boolean>;

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
    for (const f of fields) {
      const provided = initial?.[f.key];
      if (f.kind === "checkbox") {
        start[f.key] = typeof provided === "boolean" ? provided : false;
      } else {
        start[f.key] = typeof provided === "string" ? provided : "";
      }
    }
    return start;
  });
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds ?? []);

  const valid = fields.every((f) => {
    if (!("required" in f) || !f.required) return true;
    const v = values[f.key];
    return typeof v === "string" && v.trim() !== "";
  });

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const cleaned: FormValues = {};
        for (const f of fields) {
          const v = values[f.key];
          cleaned[f.key] = typeof v === "string" ? v.trim() : v;
        }
        await onSubmit(cleaned, tagIds);
      }}
    >
      {fields.map((field) => {
        const id = `field-${field.key}`;
        if (field.kind === "checkbox") {
          const checked = values[field.key] === true;
          return (
            <Checkbox
              key={field.key}
              isSelected={checked}
              onChange={(next: boolean) =>
                setValues((v) => ({ ...v, [field.key]: next }))
              }
            >
              {field.label}
            </Checkbox>
          );
        }
        const labelText = field.required ? `${field.label} *` : field.label;
        const stringValue =
          typeof values[field.key] === "string"
            ? (values[field.key] as string)
            : "";
        if (field.kind === "textarea") {
          return (
            <Textarea
              key={field.key}
              id={id}
              label={labelText}
              placeholder={field.placeholder}
              value={stringValue}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
              className="min-h-[100px]"
              fullWidth
            />
          );
        }
        return (
          <Input
            key={field.key}
            id={id}
            label={labelText}
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
            value={stringValue}
            onChange={(e) =>
              setValues((v) => ({ ...v, [field.key]: e.target.value }))
            }
            fullWidth
          />
        );
      })}
      {withTags ? <TagPicker value={tagIds} onChange={setTagIds} /> : null}
      {error ? (
        <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!valid || isPending}
          loading={isPending}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
