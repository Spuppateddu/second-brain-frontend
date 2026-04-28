import type {
  GraphEntity,
  GraphLink,
  GraphNodeKind,
  TagConnection,
} from "@/types/graph";
import type { Tag } from "@/types/entities";

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    kind: GraphNodeKind;
    label: string;
    color: string;
    tag?: Tag;
    elementCount?: number;
    typeBreakdown?: Array<{ type: string; count: number }>;
    entity?: GraphEntity;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const H_GAP = 180;
const V_GAP = 170;
const COMPONENT_GAP = 160;
const MAX_ROW_WIDTH = 3800;
const SINGLETON_GAP = 170;
const SINGLETON_ROW_TOP_MARGIN = 120;

export function pickHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
): { sourceHandle: string; targetHandle: string } {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;

  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy >= 0
      ? { sourceHandle: "bottom-source", targetHandle: "top" }
      : { sourceHandle: "top-source", targetHandle: "bottom" };
  }
  return dx >= 0
    ? { sourceHandle: "right-source", targetHandle: "left" }
    : { sourceHandle: "left-source", targetHandle: "right" };
}

export function recomputeEdgeHandles(
  edges: GraphEdge[],
  nodes: Array<{ id: string; position: { x: number; y: number } }>,
): GraphEdge[] {
  const posById = new Map<string, { x: number; y: number }>();
  for (const n of nodes) posById.set(n.id, n.position);

  let mutated = false;
  const next = edges.map((edge) => {
    const s = posById.get(edge.source);
    const t = posById.get(edge.target);
    if (!s || !t) return edge;
    const h = pickHandles(s, t);
    if (
      edge.sourceHandle === h.sourceHandle &&
      edge.targetHandle === h.targetHandle
    ) {
      return edge;
    }
    mutated = true;
    return {
      ...edge,
      sourceHandle: h.sourceHandle,
      targetHandle: h.targetHandle,
    };
  });
  return mutated ? next : edges;
}

export function nodeKey(kind: GraphNodeKind | string, id: number): string {
  return `${kind}:${id}`;
}

export function parseNodeKey(
  key: string,
): { kind: GraphNodeKind; id: number } | null {
  const idx = key.indexOf(":");
  if (idx < 0) return null;
  const kind = key.slice(0, idx) as GraphNodeKind;
  const id = parseInt(key.slice(idx + 1), 10);
  if (Number.isNaN(id)) return null;
  return { kind, id };
}

interface TreeLayout {
  rootKey: string;
  nodeKeys: string[];
  parent: Map<string, string | null>;
  children: Map<string, string[]>;
  depth: Map<string, number>;
  relPos: Map<string, { x: number; y: number }>;
  widthPx: number;
  heightPx: number;
}

function buildAdjacency(
  nodeKeys: string[],
  connections: Array<{ a: string; b: string }>,
): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodeKeys.forEach((k) => adj.set(k, []));
  connections.forEach(({ a, b }) => {
    if (!adj.has(a) || !adj.has(b)) return;
    adj.get(a)!.push(b);
    adj.get(b)!.push(a);
  });
  for (const [k, v] of adj) {
    adj.set(k, Array.from(new Set(v)));
  }
  return adj;
}

function findComponents(
  nodeKeys: string[],
  adj: Map<string, string[]>,
): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const start of nodeKeys) {
    if (seen.has(start)) continue;
    const comp: string[] = [];
    const queue: string[] = [start];
    seen.add(start);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      comp.push(cur);
      for (const n of adj.get(cur) ?? []) {
        if (!seen.has(n)) {
          seen.add(n);
          queue.push(n);
        }
      }
    }
    components.push(comp);
  }
  return components;
}

function pickRoot(
  componentKeys: string[],
  adj: Map<string, string[]>,
  tieBreaker: Map<string, number>,
): string {
  let bestKey = componentKeys[0];
  let bestDegree = (adj.get(bestKey) ?? []).length;
  let bestTie = tieBreaker.get(bestKey) ?? 0;
  for (const key of componentKeys) {
    const degree = (adj.get(key) ?? []).length;
    const tie = tieBreaker.get(key) ?? 0;
    if (
      degree > bestDegree ||
      (degree === bestDegree && tie > bestTie) ||
      (degree === bestDegree && tie === bestTie && key < bestKey)
    ) {
      bestKey = key;
      bestDegree = degree;
      bestTie = tie;
    }
  }
  return bestKey;
}

function layoutTree(rootKey: string, adj: Map<string, string[]>): TreeLayout {
  const parent = new Map<string, string | null>();
  const depth = new Map<string, number>();
  const children = new Map<string, string[]>();
  const order: string[] = [];
  const visited = new Set<string>();

  parent.set(rootKey, null);
  depth.set(rootKey, 0);
  children.set(rootKey, []);
  visited.add(rootKey);
  order.push(rootKey);

  const queue: string[] = [rootKey];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const neighbors = adj.get(cur) ?? [];
    for (const n of neighbors) {
      if (visited.has(n)) continue;
      visited.add(n);
      parent.set(n, cur);
      depth.set(n, depth.get(cur)! + 1);
      children.set(n, []);
      children.get(cur)!.push(n);
      order.push(n);
      queue.push(n);
    }
  }

  const subtreeSize = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const c = children.get(id) ?? [];
    let total = 1;
    for (const cid of c) total += subtreeSize.get(cid) ?? 1;
    subtreeSize.set(id, total);
  }
  for (const [, c] of children) {
    c.sort((a, b) => (subtreeSize.get(b) ?? 1) - (subtreeSize.get(a) ?? 1));
  }

  const leafWidth = new Map<string, number>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const c = children.get(id) ?? [];
    if (c.length === 0) {
      leafWidth.set(id, 1);
    } else {
      let sum = 0;
      for (const cid of c) sum += leafWidth.get(cid)!;
      leafWidth.set(id, sum);
    }
  }

  const xLeafUnits = new Map<string, number>();
  xLeafUnits.set(rootKey, 0);
  for (const id of order) {
    const c = children.get(id) ?? [];
    if (c.length === 0) continue;
    const parentX = xLeafUnits.get(id)!;
    const totalWidth = leafWidth.get(id)!;
    let cursor = parentX - totalWidth / 2;
    for (const cid of c) {
      const cw = leafWidth.get(cid)!;
      xLeafUnits.set(cid, cursor + cw / 2);
      cursor += cw;
    }
  }

  let minX = Infinity;
  let maxX = -Infinity;
  for (const v of xLeafUnits.values()) {
    if (v < minX) minX = v;
    if (v > maxX) maxX = v;
  }
  const maxDepth = Math.max(...Array.from(depth.values()));
  const relPos = new Map<string, { x: number; y: number }>();
  for (const id of order) {
    const lx = xLeafUnits.get(id)! - minX;
    relPos.set(id, {
      x: lx * H_GAP,
      y: (depth.get(id) ?? 0) * V_GAP,
    });
  }

  const widthPx = (maxX - minX) * H_GAP + H_GAP;
  const heightPx = maxDepth * V_GAP + V_GAP;

  return {
    rootKey,
    nodeKeys: order,
    parent,
    children,
    depth,
    relPos,
    widthPx,
    heightPx,
  };
}

function computeMixedLayout(
  tags: Tag[],
  entities: GraphEntity[],
  tagConnections: TagConnection[],
  graphLinks: GraphLink[],
  tieBreaker: Map<string, number>,
  labelByKey: Map<string, string>,
): {
  positions: Map<string, { x: number; y: number }>;
  treeEdges: Array<{ source: string; target: string }>;
} {
  const positions = new Map<string, { x: number; y: number }>();
  const treeEdges: Array<{ source: string; target: string }> = [];

  const tagKeys = tags.map((t) => nodeKey("tag", t.id));
  const entityKeys = entities.map((e) => nodeKey(e.type, e.id));
  const nodeKeys = [...tagKeys, ...entityKeys];
  if (nodeKeys.length === 0) return { positions, treeEdges };

  const connections: Array<{ a: string; b: string }> = [
    ...tagConnections.map((c) => ({
      a: nodeKey("tag", c.tag_id_1),
      b: nodeKey("tag", c.tag_id_2),
    })),
    ...graphLinks.map((l) => ({
      a: nodeKey(l.from_type, l.from_id),
      b: nodeKey(l.to_type, l.to_id),
    })),
  ];

  const adj = buildAdjacency(nodeKeys, connections);
  const components = findComponents(nodeKeys, adj);

  const trees: TreeLayout[] = [];
  const singletons: string[] = [];
  for (const comp of components) {
    if (comp.length === 1) {
      singletons.push(comp[0]);
    } else {
      const root = pickRoot(comp, adj, tieBreaker);
      trees.push(layoutTree(root, adj));
    }
  }

  trees.sort((a, b) => b.nodeKeys.length - a.nodeKeys.length);

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  for (const tree of trees) {
    if (cursorX > 0 && cursorX + tree.widthPx > MAX_ROW_WIDTH) {
      cursorX = 0;
      cursorY += rowHeight + COMPONENT_GAP;
      rowHeight = 0;
    }
    for (const key of tree.nodeKeys) {
      const rp = tree.relPos.get(key)!;
      positions.set(key, { x: cursorX + rp.x, y: cursorY + rp.y });
    }
    for (const key of tree.nodeKeys) {
      const p = tree.parent.get(key);
      if (p != null) treeEdges.push({ source: p, target: key });
    }
    cursorX += tree.widthPx + COMPONENT_GAP;
    if (tree.heightPx > rowHeight) rowHeight = tree.heightPx;
  }

  if (singletons.length > 0) {
    singletons.sort((a, b) => {
      const na = labelByKey.get(a) ?? "";
      const nb = labelByKey.get(b) ?? "";
      return na.localeCompare(nb);
    });
    const singletonRowY =
      cursorY + rowHeight + COMPONENT_GAP + SINGLETON_ROW_TOP_MARGIN;
    let sx = 0;
    let sy = singletonRowY;
    for (const key of singletons) {
      if (sx > MAX_ROW_WIDTH) {
        sx = 0;
        sy += SINGLETON_GAP;
      }
      positions.set(key, { x: sx, y: sy });
      sx += SINGLETON_GAP;
    }
  }

  return { positions, treeEdges };
}

export function transformToGraph(
  tags: Tag[],
  tagConnections: TagConnection[],
  entities: GraphEntity[] = [],
  graphLinks: GraphLink[] = [],
): GraphData {
  const tieBreaker = new Map<string, number>();
  const labelByKey = new Map<string, string>();

  for (const t of tags) {
    const key = nodeKey("tag", t.id);
    const total =
      (t.bookmarks_count ?? 0) +
      (t.notes_count ?? 0) +
      (t.recipes_count ?? 0) +
      (t.wishlist_items_count ?? 0) +
      (t.places_count ?? 0) +
      (t.persons_count ?? 0) +
      (t.bags_count ?? 0) +
      (t.hardware_count ?? 0) +
      (t.software_count ?? 0) +
      (t.mega_files_count ?? 0) +
      (t.trips_count ?? 0);
    tieBreaker.set(key, total);
    labelByKey.set(key, t.name);
  }
  for (const e of entities) {
    const key = nodeKey(e.type, e.id);
    tieBreaker.set(key, 0);
    labelByKey.set(key, e.label);
  }

  const { positions: autoPositions, treeEdges } = computeMixedLayout(
    tags,
    entities,
    tagConnections,
    graphLinks,
    tieBreaker,
    labelByKey,
  );

  const positions = new Map<string, { x: number; y: number }>();
  for (const tag of tags) {
    const key = nodeKey("tag", tag.id);
    const auto = autoPositions.get(key) ?? { x: 0, y: 0 };
    const hasSaved =
      typeof tag.position_x === "number" &&
      typeof tag.position_y === "number" &&
      Number.isFinite(tag.position_x) &&
      Number.isFinite(tag.position_y);
    positions.set(
      key,
      hasSaved
        ? { x: tag.position_x as number, y: tag.position_y as number }
        : auto,
    );
  }
  for (const entity of entities) {
    const key = nodeKey(entity.type, entity.id);
    const auto = autoPositions.get(key) ?? { x: 0, y: 0 };
    const hasSaved =
      typeof entity.position_x === "number" &&
      typeof entity.position_y === "number" &&
      Number.isFinite(entity.position_x) &&
      Number.isFinite(entity.position_y);
    positions.set(
      key,
      hasSaved
        ? { x: entity.position_x as number, y: entity.position_y as number }
        : auto,
    );
  }

  const tagNodes: GraphNode[] = tags.map((tag) => {
    const key = nodeKey("tag", tag.id);
    const position = positions.get(key) || { x: 0, y: 0 };

    const countsByType: Array<{ type: string; count: number }> = [
      { type: "bookmark", count: tag.bookmarks_count ?? 0 },
      { type: "note", count: tag.notes_count ?? 0 },
      { type: "recipe", count: tag.recipes_count ?? 0 },
      { type: "wishlist_item", count: tag.wishlist_items_count ?? 0 },
      { type: "place", count: tag.places_count ?? 0 },
      { type: "person", count: tag.persons_count ?? 0 },
      { type: "bag", count: tag.bags_count ?? 0 },
      { type: "hardware", count: tag.hardware_count ?? 0 },
      { type: "software", count: tag.software_count ?? 0 },
      { type: "mega_file", count: tag.mega_files_count ?? 0 },
      { type: "trip", count: tag.trips_count ?? 0 },
    ];

    const elementCount = countsByType.reduce((sum, t) => sum + t.count, 0);
    const typeBreakdown = countsByType
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      id: key,
      type: "tagNode",
      position,
      data: {
        kind: "tag",
        tag,
        label: tag.name,
        color: tag.color || "#3B82F6",
        elementCount,
        typeBreakdown,
      },
    };
  });

  const entityNodes: GraphNode[] = entities.map((entity) => {
    const key = nodeKey(entity.type, entity.id);
    const position = positions.get(key) || { x: 0, y: 0 };
    return {
      id: key,
      type: "entityNode",
      position,
      data: {
        kind: entity.type as GraphNodeKind,
        entity,
        label: entity.label,
        color: entity.color || "",
      },
    };
  });

  const nodes: GraphNode[] = [...tagNodes, ...entityNodes];

  const edges: GraphEdge[] = treeEdges.map((e, index) => {
    const src = positions.get(e.source) ?? { x: 0, y: 0 };
    const tgt = positions.get(e.target) ?? { x: 0, y: 0 };
    const handles = pickHandles(src, tgt);
    return {
      id: `edge-${e.source}-${e.target}-${index}`,
      source: e.source,
      target: e.target,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: "smoothstep",
      animated: false,
    };
  });

  return { nodes, edges };
}

export function highlightPath(
  edges: GraphEdge[],
  pathKeys: string[],
): GraphEdge[] {
  if (pathKeys.length < 2) return edges;

  const pathEdgeSet = new Set<string>();
  for (let i = 0; i < pathKeys.length - 1; i++) {
    const a = pathKeys[i];
    const b = pathKeys[i + 1];
    pathEdgeSet.add(`${a}-${b}`);
    pathEdgeSet.add(`${b}-${a}`);
  }

  return edges.map((edge) => ({
    ...edge,
    animated: pathEdgeSet.has(`${edge.source}-${edge.target}`),
    style: pathEdgeSet.has(`${edge.source}-${edge.target}`)
      ? { stroke: "#0077B6", strokeWidth: 4, opacity: 1 }
      : { stroke: "#64748b", strokeWidth: 2.5, opacity: 0.5 },
  }));
}
