"use client";

import { Button, Input } from "@heroui/react";
import { useState } from "react";

type Editable = {
  id: number;
  name: string;
  description: string | null;
};

export function CategoryRow({
  item,
  childCount,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  children,
}: {
  item: Editable;
  childCount?: number;
  onSave: (payload: { name: string; description?: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              await onSave({
                name: name.trim(),
                description: description.trim() || null,
              });
              setEditing(false);
            } catch {
              setError("Failed to save.");
            }
          }}
        >
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <textarea
            className="min-h-[60px] rounded-md border border-zinc-200 bg-white p-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setName(item.name);
                setDescription(item.description ?? "");
                setEditing(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isDisabled={!name.trim() || isSaving}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-medium">{item.name}</span>
              {item.description ? (
                <span className="text-xs text-zinc-500">
                  {item.description}
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {childCount !== undefined ? (
                <span className="text-zinc-500">
                  {childCount} sub
                  {childCount === 1 ? "" : "s"}
                </span>
              ) : null}
              <button
                type="button"
                className="text-zinc-500 hover:underline"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-zinc-500 hover:text-danger"
                disabled={isDeleting}
                onClick={async () => {
                  if (!confirm(`Delete "${item.name}"?`)) return;
                  try {
                    await onDelete();
                  } catch {
                    setError("Failed to delete.");
                  }
                }}
              >
                {isDeleting ? "…" : "Delete"}
              </button>
            </div>
          </div>
          {children}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      )}
    </div>
  );
}

export function NewCategoryForm({
  placeholder,
  onCreate,
  isPending,
}: {
  placeholder: string;
  onCreate: (payload: {
    name: string;
    description?: string | null;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setError(null);
        try {
          await onCreate({ name: name.trim() });
          setName("");
        } catch {
          setError("Failed to create.");
        }
      }}
    >
      <div className="flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="sm"
        isDisabled={!name.trim() || isPending}
      >
        Add
      </Button>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </form>
  );
}
