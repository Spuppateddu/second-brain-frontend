import {
  HiBookmark,
  HiCake,
  HiComputerDesktop,
  HiCpuChip,
  HiDocumentText,
  HiFolder,
  HiHeart,
  HiMapPin,
  HiPaperAirplane,
  HiShoppingBag,
  HiUser,
} from "react-icons/hi2";
import type { IconType } from "react-icons";

import { ENTITY_COLORS, type EntityType } from "./entityColors";

export const ENTITY_ICONS: Record<EntityType | "mega_file", IconType> = {
  bookmark: HiBookmark,
  note: HiDocumentText,
  person: HiUser,
  place: HiMapPin,
  bag: HiShoppingBag,
  hardware: HiCpuChip,
  software: HiComputerDesktop,
  recipe: HiCake,
  wishlist_item: HiHeart,
  trip: HiPaperAirplane,
  mega_file: HiFolder,
};

export const ENTITY_LABELS: Record<EntityType | "mega_file", string> = {
  bookmark: "Bookmark",
  note: "Note",
  person: "Person",
  place: "Place",
  bag: "Bag",
  hardware: "Hardware",
  software: "Software",
  recipe: "Recipe",
  wishlist_item: "Wishlist",
  trip: "Trip",
  mega_file: "File",
};

export function getEntityIcon(type: string): IconType {
  return ENTITY_ICONS[type as EntityType] ?? HiFolder;
}

const FALLBACK_COLORS: Record<string, string> = {
  mega_file: "#64748b",
};

export function getEntityBorderColor(type: string): string {
  const c = ENTITY_COLORS[type as EntityType];
  if (c) return c.border;
  return FALLBACK_COLORS[type] ?? "#64748b";
}
