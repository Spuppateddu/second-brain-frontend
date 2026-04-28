"use client";

import { Button } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactFlowInstance } from "@xyflow/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HiArrowPath, HiPlus } from "react-icons/hi2";

import ConfirmDialog from "@/components/SecondBrain/ConfirmDialog";
import EntityModalsProvider, {
  useEntityModals,
} from "@/components/SecondBrain/EntityModalsProvider";
import GraphSearchOverlay, {
  type EntitySearchResult,
} from "@/components/SecondBrain/GraphSearchOverlay";
import TagEntityCard from "@/components/SecondBrain/TagEntityCard";
import TagFormModal, {
  type TagFormValues,
} from "@/components/SecondBrain/TagFormModal";
import TagNetworkGraph from "@/components/SecondBrain/TagNetworkGraph";
import { ENTITY_ICONS, ENTITY_LABELS } from "@/constants/entityIcons";
import { UNTAGGED_TAG_ID } from "@/constants/untagged";
import { api } from "@/lib/api";
import {
  useCreateTag,
  useDeleteTag,
  useResetTagPositions,
  useUpdateTag,
} from "@/lib/queries/entities";
import { useSecondBrain } from "@/lib/queries/heavy";
import type { Tag } from "@/types/entities";
import type {
  GraphLink,
  GraphNodeKind,
  SecondBrainPayload,
} from "@/types/graph";

const CREATABLE_ENTITY_TYPES: Array<Exclude<GraphNodeKind, "tag">> = [
  "bookmark",
  "note",
  "recipe",
  "wishlist_item",
  "place",
  "person",
  "bag",
  "hardware",
  "software",
  "mega_file",
  "trip",
];

export default function SecondBrainPage() {
  // Wraps the actual page in the modal provider so any descendant (including
  // TagEntityCard) can call `useEntityModals()` to launch entity create/edit.
  return (
    <EntityModalsProvider>
      <SecondBrainPageInner />
    </EntityModalsProvider>
  );
}

function SecondBrainPageInner() {
  const queryClient = useQueryClient();
  const modals = useEntityModals();
  const { data, isLoading, error } = useSecondBrain();

  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const resetPositions = useResetTagPositions();

  const realTags = useMemo(() => data?.tags ?? [], [data?.tags]);
  const tagConnections = useMemo(
    () => data?.tagConnections ?? [],
    [data?.tagConnections],
  );
  const initialEntities = data?.graphEntities ?? [];
  const graphLinks = useMemo(() => data?.graphLinks ?? [], [data?.graphLinks]);

  const tags = useMemo<Tag[]>(() => {
    const untagged: Tag = {
      id: UNTAGGED_TAG_ID,
      name: "Untagged",
      color: "#9CA3AF",
      description: "Elements without any tag",
      order: -1,
      is_searchable: false,
    };
    return [untagged, ...realTags];
  }, [realTags]);

  // Optimistic mutation of the second-brain query cache. Lets connect /
  // disconnect feel instant — the server invalidation right after just
  // reconciles whatever the optimistic update missed.
  const optimisticMutate = useCallback(
    (mutator: (prev: SecondBrainPayload) => SecondBrainPayload) => {
      queryClient.setQueryData<SecondBrainPayload>(
        ["second-brain"],
        (prev) => (prev ? mutator(prev) : prev),
      );
    },
    [queryClient],
  );

  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [cardScreenPos, setCardScreenPos] = useState<
    { x: number; y: number } | null
  >(null);
  const [highlightEntity, setHighlightEntity] = useState<
    { type: string; id: number } | null
  >(null);

  const [pendingDelete, setPendingDelete] = useState<
    | {
        from: { kind: GraphNodeKind; id: number };
        to: { kind: GraphNodeKind; id: number };
      }
    | null
  >(null);
  const [pendingTagDelete, setPendingTagDelete] = useState<Tag | null>(null);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagModalError, setTagModalError] = useState<string | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const rfInstance = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (!connectError) return;
    const t = setTimeout(() => setConnectError(null), 4500);
    return () => clearTimeout(t);
  }, [connectError]);

  const positionCardForTag = useCallback((tagId: number) => {
    const inst = rfInstance.current;
    if (!inst) {
      setCardScreenPos(null);
      return;
    }
    const node = inst.getNode(`tag:${tagId}`);
    if (!node) {
      setCardScreenPos(null);
      return;
    }
    const pos = inst.flowToScreenPosition?.(node.position) ?? null;
    setCardScreenPos((prev) => {
      if (!pos) return null;
      if (prev && prev.x === pos.x && prev.y === pos.y) return prev;
      return pos;
    });
  }, []);

  const handleTagClick = useCallback(
    (tag: Tag) => {
      setSelectedTag(tag);
      requestAnimationFrame(() => positionCardForTag(tag.id));
    },
    [positionCardForTag],
  );

  // Click on an entity node → fetch its full record so the modal can prefill
  // every field, then open the matching modal.
  const handleEntityClick = useCallback(
    async (kind: GraphNodeKind, id: number) => {
      if (kind === "tag") return;
      try {
        const { data: payload } = await api.get<{
          entity?: Record<string, unknown>;
        }>("/secondbrain/entity", {
          params: { type: kind, id },
        });
        const full = payload?.entity;
        if (full && typeof full === "object" && "id" in full) {
          modals.openEdit(
            kind as Exclude<GraphNodeKind, "tag">,
            full as Parameters<typeof modals.openEdit>[1],
          );
        }
      } catch (e) {
        console.error("Failed to load entity", e);
      }
    },
    [modals],
  );

  const handleConnect = useCallback(
    async (
      from: { kind: GraphNodeKind; id: number },
      to: { kind: GraphNodeKind; id: number },
    ) => {
      if (from.kind === "tag" && from.id === UNTAGGED_TAG_ID) {
        setConnectError(
          "The Untagged bucket can't be connected to other nodes.",
        );
        return;
      }
      if (to.kind === "tag" && to.id === UNTAGGED_TAG_ID) {
        setConnectError(
          "The Untagged bucket can't be connected to other nodes.",
        );
        return;
      }

      if (from.kind === "tag" && to.kind === "tag") {
        try {
          await api.post("/tags/connect", {
            tag_id_1: from.id,
            tag_id_2: to.id,
          });
          const smaller = Math.min(from.id, to.id);
          const larger = Math.max(from.id, to.id);
          optimisticMutate((prev) => {
            if (
              prev.tagConnections.some(
                (c) => c.tag_id_1 === smaller && c.tag_id_2 === larger,
              )
            )
              return prev;
            return {
              ...prev,
              tagConnections: [
                ...prev.tagConnections,
                { tag_id_1: smaller, tag_id_2: larger },
              ],
            };
          });
          queryClient.invalidateQueries({ queryKey: ["second-brain"] });
        } catch (e: unknown) {
          const err = e as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          const msg =
            err?.response?.data?.message ?? err?.message ?? "Unknown error";
          setConnectError(`Couldn't connect tags: ${msg}`);
        }
        return;
      }

      try {
        await api.post("/graph-nodes/connect", {
          from_type: from.kind,
          from_id: from.id,
          to_type: to.kind,
          to_id: to.id,
        });
        let a = from;
        let b = to;
        if (from.kind === to.kind) {
          if (from.id > to.id) [a, b] = [to, from];
        } else if (from.kind > to.kind) {
          [a, b] = [to, from];
        }
        const newLink: GraphLink = {
          from_type: a.kind,
          from_id: a.id,
          to_type: b.kind,
          to_id: b.id,
        };
        optimisticMutate((prev) => {
          if (
            prev.graphLinks.some(
              (l) =>
                l.from_type === newLink.from_type &&
                l.from_id === newLink.from_id &&
                l.to_type === newLink.to_type &&
                l.to_id === newLink.to_id,
            )
          ) {
            return prev;
          }
          return { ...prev, graphLinks: [...prev.graphLinks, newLink] };
        });
      } catch (e: unknown) {
        const err = e as {
          response?: { status?: number; data?: { message?: string; error?: string } };
          message?: string;
        };
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          err?.message ??
          "Unknown error";
        if (status === 409) {
          setConnectError("These two nodes are already linked.");
        } else if (status === 404) {
          setConnectError("Link endpoint not found.");
        } else {
          setConnectError(`Couldn't link nodes: ${msg}`);
        }
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    },
    [queryClient, optimisticMutate],
  );

  const handleEdgeDelete = useCallback(
    (
      from: { kind: GraphNodeKind; id: number },
      to: { kind: GraphNodeKind; id: number },
    ) => {
      if (from.kind === "tag" && from.id === UNTAGGED_TAG_ID) return;
      if (to.kind === "tag" && to.id === UNTAGGED_TAG_ID) return;
      setPendingDelete({ from, to });
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const { from, to } = pendingDelete;
    try {
      if (from.kind === "tag" && to.kind === "tag") {
        await api.post("/tags/disconnect", {
          tag_id_1: from.id,
          tag_id_2: to.id,
        });
        const smaller = Math.min(from.id, to.id);
        const larger = Math.max(from.id, to.id);
        optimisticMutate((prev) => ({
          ...prev,
          tagConnections: prev.tagConnections.filter(
            (c) => !(c.tag_id_1 === smaller && c.tag_id_2 === larger),
          ),
        }));
      } else {
        await api.post("/graph-nodes/disconnect", {
          from_type: from.kind,
          from_id: from.id,
          to_type: to.kind,
          to_id: to.id,
        });
        optimisticMutate((prev) => ({
          ...prev,
          graphLinks: prev.graphLinks.filter(
            (l) =>
              !(
                (l.from_type === from.kind &&
                  l.from_id === from.id &&
                  l.to_type === to.kind &&
                  l.to_id === to.id) ||
                (l.from_type === to.kind &&
                  l.from_id === to.id &&
                  l.to_type === from.kind &&
                  l.to_id === from.id)
              ),
          ),
        }));
      }
      queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        err?.response?.data?.message ?? err?.message ?? "Unknown error";
      setConnectError(`Couldn't remove link: ${msg}`);
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, queryClient, optimisticMutate]);

  const handleEditTag = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setTagModalError(null);
    setTagModalOpen(true);
  }, []);

  const handleNewTag = useCallback(() => {
    setEditingTag(null);
    setTagModalError(null);
    setTagModalOpen(true);
    setShowCreateMenu(false);
  }, []);

  const handleTagSubmit = useCallback(
    async (values: TagFormValues) => {
      setTagModalError(null);
      try {
        if (editingTag) {
          await updateTag.mutateAsync({
            id: editingTag.id,
            patch: values,
          });
        } else {
          await createTag.mutateAsync(values);
        }
        setTagModalOpen(false);
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setTagModalError(
          err?.response?.data?.message ??
            err?.message ??
            "Failed to save tag.",
        );
      }
    },
    [createTag, updateTag, editingTag],
  );

  const handleTagDelete = useCallback((tag: Tag) => {
    if (tag.id === UNTAGGED_TAG_ID) return;
    setPendingTagDelete(tag);
  }, []);

  const confirmTagDelete = useCallback(async () => {
    if (!pendingTagDelete) return;
    const tagId = pendingTagDelete.id;
    try {
      await deleteTag.mutateAsync(tagId);
      setSelectedTag((cur) => (cur?.id === tagId ? null : cur));
    } catch (e) {
      console.error("Failed to delete tag", e);
    } finally {
      setPendingTagDelete(null);
    }
  }, [pendingTagDelete, deleteTag]);

  const handleResetLayout = useCallback(async () => {
    if (resetPositions.isPending) return;
    try {
      await resetPositions.mutateAsync();
    } catch (e) {
      console.error("Failed to reset positions", e);
    }
  }, [resetPositions]);

  const zoomAndOpenTag = useCallback(
    (tag: Tag) => {
      const inst = rfInstance.current;
      if (inst) {
        inst.fitView({
          nodes: [{ id: `tag:${tag.id}` }],
          duration: 500,
          padding: 0.4,
          maxZoom: 1.6,
          minZoom: 0.6,
        });
      }
      setSelectedTag(tag);
      setTimeout(() => positionCardForTag(tag.id), 550);
    },
    [positionCardForTag],
  );

  const handleSearchPick = useCallback(
    (tag: Tag) => {
      setHighlightEntity(null);
      zoomAndOpenTag(tag);
    },
    [zoomAndOpenTag],
  );

  const handleSearchPickEntity = useCallback(
    async (entity: EntitySearchResult) => {
      try {
        const { data: payload } = await api.get<{
          entity?: { tags?: Array<{ id: number }> };
        }>("/secondbrain/entity", {
          params: { type: entity.type, id: entity.id },
        });
        const entityTags = payload?.entity?.tags ?? [];
        if (entityTags.length === 0) {
          const untagged = tags.find((t) => t.id === UNTAGGED_TAG_ID);
          if (untagged) {
            setHighlightEntity({ type: entity.type, id: entity.id });
            zoomAndOpenTag(untagged);
          }
          return;
        }
        const firstTag = tags.find((t) => t.id === entityTags[0].id);
        if (firstTag) {
          setHighlightEntity({ type: entity.type, id: entity.id });
          zoomAndOpenTag(firstTag);
        }
      } catch (e) {
        console.error("Failed to resolve entity", e);
      }
    },
    [tags, zoomAndOpenTag],
  );

  // Re-position the floating card while the user pans/zooms the graph
  useEffect(() => {
    if (!selectedTag) return;
    const inst = rfInstance.current;
    if (!inst) return;
    const id = setInterval(() => positionCardForTag(selectedTag.id), 150);
    return () => clearInterval(id);
  }, [selectedTag, positionCardForTag]);

  const deleteMessage = useMemo(() => {
    if (!pendingDelete) return "";
    const { from, to } = pendingDelete;
    if (from.kind === "tag" && to.kind === "tag") {
      return "Remove the connection between these two tags?";
    }
    return "Remove this graph connection?";
  }, [pendingDelete]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-danger">
          Couldn&rsquo;t load the Second Brain. Try refreshing.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetLayout}
          isDisabled={resetPositions.isPending}
        >
          <HiArrowPath className="h-4 w-4" />
          Reset layout
        </Button>

        <div className="relative">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCreateMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showCreateMenu}
          >
            <HiPlus className="h-4 w-4" />
            New
          </Button>
          {showCreateMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowCreateMenu(false)}
              />
              <div
                role="menu"
                className="absolute right-0 z-40 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
              >
                <button
                  type="button"
                  onClick={handleNewTag}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: "#3B82F6" }}
                  />
                  New tag
                </button>
                <div className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
                {CREATABLE_ENTITY_TYPES.map((kind) => {
                  const Icon = ENTITY_ICONS[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => {
                        setShowCreateMenu(false);
                        modals.openCreate(kind);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      New {ENTITY_LABELS[kind].toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <GraphSearchOverlay
        tags={tags}
        onPickTag={handleSearchPick}
        onPickEntity={handleSearchPickEntity}
      />

      <div className="absolute inset-0">
        <TagNetworkGraph
          tags={tags}
          tagConnections={tagConnections}
          entities={initialEntities}
          graphLinks={graphLinks}
          onTagClick={handleTagClick}
          onEntityClick={handleEntityClick}
          onNodesConnect={handleConnect}
          onEdgeDelete={handleEdgeDelete}
          onInstanceReady={(inst) => {
            rfInstance.current = inst;
          }}
          selectedTagId={selectedTag?.id ?? null}
        />
      </div>

      {selectedTag && (
        <TagEntityCard
          key={`${selectedTag.id}`}
          tag={selectedTag}
          screenPosition={cardScreenPos}
          highlightEntity={highlightEntity}
          onClose={() => {
            setSelectedTag(null);
            setHighlightEntity(null);
          }}
          onEditTag={handleEditTag}
          onDeleteTag={handleTagDelete}
        />
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Unlink nodes"
        message={deleteMessage}
        confirmText="Unlink"
        variant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        isOpen={!!pendingTagDelete}
        title="Delete tag"
        message={
          pendingTagDelete
            ? `Delete the tag "${pendingTagDelete.name}"? All its connections will be removed. Tagged elements will not be deleted.`
            : ""
        }
        confirmText="Delete"
        variant="danger"
        isProcessing={deleteTag.isPending}
        onClose={() =>
          !deleteTag.isPending && setPendingTagDelete(null)
        }
        onConfirm={confirmTagDelete}
      />

      <TagFormModal
        isOpen={tagModalOpen}
        initial={editingTag}
        isPending={createTag.isPending || updateTag.isPending}
        error={tagModalError}
        onClose={() => setTagModalOpen(false)}
        onSubmit={handleTagSubmit}
      />

      {connectError && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg dark:border-red-700 dark:bg-red-900/40 dark:text-red-200"
        >
          <span className="flex-1">{connectError}</span>
          <button
            type="button"
            onClick={() => setConnectError(null)}
            className="shrink-0 text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
