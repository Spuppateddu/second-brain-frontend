export const ENTITY_COLORS = {
  bookmark: { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" },
  note: { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
  person: { bg: "#DCFCE7", text: "#166534", border: "#10B981" },
  place: { bg: "#FCE7F3", text: "#9F1239", border: "#EC4899" },
  bag: { bg: "#E0E7FF", text: "#3730A3", border: "#6366F1" },
  hardware: { bg: "#F3E8FF", text: "#6B21A8", border: "#A855F7" },
  software: { bg: "#E0F2FE", text: "#075985", border: "#0EA5E9" },
  recipe: { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
  wishlist_item: { bg: "#FDF4FF", text: "#86198F", border: "#D946EF" },
  trip: { bg: "#ECFDF5", text: "#065F46", border: "#34D399" },
} as const;

export type EntityType = keyof typeof ENTITY_COLORS;
