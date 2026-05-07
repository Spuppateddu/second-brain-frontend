import { api } from "@/lib/api";
import type { GraphNodeKind } from "@/types/graph";

export type EditableEntityType = Exclude<GraphNodeKind, "tag">;

type FetchConfig = { url: (id: number) => string; key?: string };

const FETCH_BY_TYPE: Record<EditableEntityType, FetchConfig> = {
  bookmark: { url: (id) => `/bookmarks/${id}`, key: "bookmark" },
  note: { url: (id) => `/notes/${id}`, key: "note" },
  recipe: { url: (id) => `/recipes/${id}`, key: "recipe" },
  wishlist_item: { url: (id) => `/wishlist/${id}`, key: "item" },
  place: { url: (id) => `/places/${id}`, key: "place" },
  person: { url: (id) => `/persons/${id}`, key: "person" },
  bag: { url: (id) => `/bags/${id}`, key: "bag" },
  hardware: { url: (id) => `/hardware/${id}`, key: "hardware" },
  software: { url: (id) => `/software/${id}`, key: "software" },
  trip: { url: (id) => `/trips/${id}`, key: "trip" },
  mega_file: { url: (id) => `/mega-files/${id}`, key: "mega_file" },
};

export function entityFetchConfig(type: string): FetchConfig | undefined {
  return (FETCH_BY_TYPE as Record<string, FetchConfig | undefined>)[type];
}

export function isEditableEntityType(type: string): type is EditableEntityType {
  return entityFetchConfig(type) !== undefined;
}

export async function fetchEntityForEdit<T = unknown>(
  type: string,
  id: number,
): Promise<T | null> {
  const cfg = entityFetchConfig(type);
  if (!cfg) return null;
  const { data } = await api.get<Record<string, unknown>>(cfg.url(id));
  const entity = (cfg.key ? data[cfg.key] : data) as T | undefined;
  return entity ?? null;
}
