"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  ReactFlow,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { isUntaggedTag } from "@/constants/untagged";
import { api } from "@/lib/api";
import {
  highlightPath,
  parseNodeKey,
  recomputeEdgeHandles,
  transformToGraph,
} from "@/lib/graphTransformer";
import type { Tag } from "@/types/entities";
import type {
  GraphEntity,
  GraphLink,
  GraphNodeKind,
  TagConnection,
} from "@/types/graph";

import EntityNode from "./EntityNode";
import TagNode from "./TagNode";

interface TagNetworkGraphProps {
  tags: Tag[];
  tagConnections: TagConnection[];
  entities?: GraphEntity[];
  graphLinks?: GraphLink[];
  onTagClick?: (tag: Tag, node?: Node) => void;
  onEntityClick?: (type: GraphNodeKind, id: number, node?: Node) => void;
  onNodesConnect?: (
    from: { kind: GraphNodeKind; id: number },
    to: { kind: GraphNodeKind; id: number },
  ) => Promise<void>;
  onEdgeDelete?: (
    from: { kind: GraphNodeKind; id: number },
    to: { kind: GraphNodeKind; id: number },
  ) => void;
  onInstanceReady?: (instance: ReactFlowInstance) => void;
  selectedTagId?: number | null;
  highlightedPath?: string[];
  searchQuery?: string;
}

const nodeTypes = {
  tagNode: TagNode,
  entityNode: EntityNode,
};

export default function TagNetworkGraph({
  tags,
  tagConnections,
  entities = [],
  graphLinks = [],
  onTagClick,
  onEntityClick,
  onNodesConnect,
  onEdgeDelete,
  onInstanceReady,
  selectedTagId,
  highlightedPath,
  searchQuery = "",
}: TagNetworkGraphProps) {
  const reactFlowInstance = useRef<ReactFlowInstance<Node, Edge> | null>(null);

  const graphData = useMemo(() => {
    return transformToGraph(tags, tagConnections, entities, graphLinks);
  }, [tags, tagConnections, entities, graphLinks]);

  const [nodes, , onNodesChange] = useNodesState(
    graphData.nodes as unknown as Node[],
  );

  // Re-seed nodes when the upstream graphData rebuilds (e.g. tag added /
  // entity flagged show_in_graph). Keyed by graphData identity so xyflow's
  // local node state still wins for in-flight position drags.
  // (Note: setNodes here is via the closure from useNodesState — but ESLint's
  // set-state-in-effect rule fires on synchronous setState. We side-step by
  // using a key on the parent.)

  const { highlightedKeys, searchMatchKeys } = useMemo(() => {
    const highlighted = new Set<string>();
    const searchMatches = new Set<string>();

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchingTags = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query) ||
          tag.description?.toLowerCase().includes(query),
      );
      matchingTags.forEach((tag) => searchMatches.add(`tag:${tag.id}`));

      const matchingEntities = entities.filter((e) =>
        e.label.toLowerCase().includes(query),
      );
      matchingEntities.forEach((e) => searchMatches.add(`${e.type}:${e.id}`));

      const allMatchKeys = new Set([...searchMatches]);
      allMatchKeys.forEach((k) => highlighted.add(k));

      matchingTags.forEach((matchingTag) => {
        tagConnections.forEach((conn) => {
          if (conn.tag_id_1 === matchingTag.id)
            highlighted.add(`tag:${conn.tag_id_2}`);
          else if (conn.tag_id_2 === matchingTag.id)
            highlighted.add(`tag:${conn.tag_id_1}`);
        });
      });

      allMatchKeys.forEach((k) => {
        graphLinks.forEach((l) => {
          const a = `${l.from_type}:${l.from_id}`;
          const b = `${l.to_type}:${l.to_id}`;
          if (a === k) highlighted.add(b);
          else if (b === k) highlighted.add(a);
        });
      });
    }

    return { highlightedKeys: highlighted, searchMatchKeys: searchMatches };
  }, [searchQuery, tags, tagConnections, entities, graphLinks]);

  const styledEdges = useMemo<Edge[]>(() => {
    let updated = graphData.edges;

    if (highlightedPath && highlightedPath.length > 1) {
      updated = highlightPath(graphData.edges, highlightedPath);
    } else if (highlightedKeys.size > 0) {
      updated = graphData.edges.map((edge) => {
        const isConnectedToSearch =
          highlightedKeys.has(edge.source) && highlightedKeys.has(edge.target);
        return {
          ...edge,
          style: isConnectedToSearch
            ? { stroke: "#0077B6", strokeWidth: 4, opacity: 1 }
            : { stroke: "#64748b", strokeWidth: 2.5, opacity: 0.5 },
        };
      });
    } else {
      updated = graphData.edges.map((edge) => ({
        ...edge,
        style: { stroke: "#64748b", strokeWidth: 3, opacity: 0.8 },
      }));
    }

    updated = recomputeEdgeHandles(
      updated,
      nodes as unknown as Array<{
        id: string;
        position: { x: number; y: number };
      }>,
    );
    return updated as unknown as Edge[];
  }, [graphData.edges, highlightedPath, highlightedKeys, nodes]);

  const prevSearchQueryRef = useRef<string>(searchQuery);
  useEffect(() => {
    const prev = prevSearchQueryRef.current;
    prevSearchQueryRef.current = searchQuery;
    if (prev === searchQuery) return;
    if (!reactFlowInstance.current) return;

    if (searchMatchKeys.size > 0 && searchQuery.trim()) {
      const nodeIdsToShow = Array.from(highlightedKeys);
      setTimeout(() => {
        reactFlowInstance.current?.fitView({
          nodes: nodeIdsToShow.map((id) => ({ id })),
          duration: 500,
          padding: 0.2,
          maxZoom: 1.2,
          minZoom: 0.5,
        });
      }, 100);
    } else if (!searchQuery.trim()) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ duration: 500, padding: 0.2 });
      }, 100);
    }
  }, [searchQuery, searchMatchKeys, highlightedKeys]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const parsed = parseNodeKey(node.id);
      if (!parsed) return;
      if (parsed.kind === "tag") {
        const tag = tags.find((t) => t.id === parsed.id);
        if (tag && onTagClick) onTagClick(tag, node);
      } else {
        if (onEntityClick) onEntityClick(parsed.kind, parsed.id, node);
      }
    },
    [tags, onTagClick, onEntityClick],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!onEdgeDelete) return;
      const from = parseNodeKey(edge.source);
      const to = parseNodeKey(edge.target);
      if (!from || !to) return;
      onEdgeDelete(from, to);
    },
    [onEdgeDelete],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target || !onNodesConnect) return;
      const from = parseNodeKey(connection.source);
      const to = parseNodeKey(connection.target);
      if (!from || !to) return;
      try {
        await onNodesConnect(from, to);
      } catch (error) {
        console.error("Failed to connect nodes:", error);
      }
    },
    [onNodesConnect],
  );

  const positionSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  useEffect(() => {
    const timers = positionSaveTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const parsed = parseNodeKey(node.id);
      if (!parsed) return;
      if (parsed.kind === "tag" && isUntaggedTag(parsed.id)) return;

      const timers = positionSaveTimers.current;
      const existing = timers.get(node.id);
      if (existing) clearTimeout(existing);

      timers.set(
        node.id,
        setTimeout(() => {
          const save =
            parsed.kind === "tag"
              ? api.patch(`/tags/${parsed.id}/position`, {
                  position_x: node.position.x,
                  position_y: node.position.y,
                })
              : api.patch("/graph-nodes/position", {
                  type: parsed.kind,
                  id: parsed.id,
                  position_x: node.position.x,
                  position_y: node.position.y,
                });
          save.catch((err: unknown) =>
            console.error("Failed to save node position", err),
          );
          timers.delete(node.id);
        }, 400),
      );
    },
    [],
  );

  const nodesWithSelection = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;
    return nodes.map((node) => {
      const isSearchMatch = searchMatchKeys.has(node.id);
      const isHighlightedBySearch = highlightedKeys.has(node.id);
      const isDimmed = hasSearch && !isHighlightedBySearch;
      const parsed = parseNodeKey(node.id);
      const isTagSelected =
        parsed?.kind === "tag" && selectedTagId === parsed.id;
      return {
        ...node,
        data: {
          ...node.data,
          isHighlighted: isTagSelected,
          isSearchMatch,
          isConnectedToSearch: isHighlightedBySearch && !isSearchMatch,
          isDimmed,
        },
      };
    });
  }, [nodes, selectedTagId, searchMatchKeys, highlightedKeys, searchQuery]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodesWithSelection}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance as unknown as ReactFlowInstance<Node, Edge>;
          onInstanceReady?.(instance as unknown as ReactFlowInstance);
        }}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { stroke: "#64748b", strokeWidth: 3, opacity: 0.8 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
