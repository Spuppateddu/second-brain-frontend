import type { Tag } from "./entities";

export type GraphNodeKind =
  | "tag"
  | "bookmark"
  | "note"
  | "recipe"
  | "wishlist_item"
  | "place"
  | "person"
  | "bag"
  | "hardware"
  | "software"
  | "mega_file"
  | "trip";

export type GraphEntity = {
  id: number;
  type: string; // "note" | "place" | "bookmark" | ...
  label: string;
  color: string | null;
  position_x: number | null;
  position_y: number | null;
};

export type TagConnection = {
  tag_id_1: number;
  tag_id_2: number;
};

export type GraphLink = {
  from_type: string;
  from_id: number;
  to_type: string;
  to_id: number;
};

export type SecondBrainPayload = {
  tags: Tag[];
  tagConnections: TagConnection[];
  graphEntities: GraphEntity[];
  graphLinks: GraphLink[];
};
