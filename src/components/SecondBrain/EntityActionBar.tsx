"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiArrowRightOnRectangle,
  HiArrowsPointingOut,
  HiBookmark,
  HiCheck,
  HiLink,
  HiOutlineBookmark,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineShare,
  HiShare,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

import ConfirmDialog from "@/components/SecondBrain/ConfirmDialog";
import ShareLinkModal from "@/components/SecondBrain/ShareLinkModal";
import { IconButton } from "@/components/UI/IconButton";
import { entityFullPagePath, type EditableEntityType } from "@/lib/entity-fetch";
import {
  useCalendarAnchors,
  useToggleCalendarAnchor,
} from "@/lib/queries/entity-anchors";
import {
  useGraphVisibility,
  useToggleGraphVisibility,
} from "@/lib/queries/graph-visibility";

interface EntityActionBarProps {
  mode: "modal" | "page";
  kind: EditableEntityType;
  /** Undefined while creating a new entity. */
  id?: number;
  entityLabel: string;
  dirty: boolean;
  isPending: boolean;
  /** Form-controlled spotlight visibility. Persisted on the next save. */
  isSearchable?: { value: boolean; onChange: (v: boolean) => void };
  onSave: () => void | Promise<void>;
  onSaveAndExit: () => void | Promise<void>;
  /** Required for edit mode; omit for create. */
  onDelete?: () => void | Promise<void>;
  /** Modal-mode close. Pages never pass this. */
  onClose?: () => void;
}

export default function EntityActionBar({
  mode,
  kind,
  id,
  entityLabel,
  dirty,
  isPending,
  isSearchable,
  onSave,
  onSaveAndExit,
  onDelete,
  onClose,
}: EntityActionBarProps) {
  const router = useRouter();
  const isEdit = id != null;
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const graphQuery = useGraphVisibility(isEdit ? kind : undefined, id);
  const toggleGraph = useToggleGraphVisibility();
  const graphVisible = graphQuery.data?.show_in_graph ?? false;

  const anchors = useCalendarAnchors();
  const toggleAnchor = useToggleCalendarAnchor();
  const anchored = isEdit
    ? (anchors.data ?? []).some((a) => a.type === kind && a.id === id)
    : false;

  const saveDisabled = !dirty || isPending;

  const openInPage = () => {
    if (!isEdit) return;
    const path = entityFullPagePath(kind, id);
    if (!path) return;
    onClose?.();
    router.push(path);
  };

  return (
    <>
      <IconButton
        size="sm"
        variant="primary"
        label="Save"
        disabled={saveDisabled}
        loading={isPending && dirty}
        onClick={() => onSave()}
      >
        <HiCheck />
      </IconButton>

      <IconButton
        size="sm"
        variant="success"
        label={mode === "modal" ? "Save and close" : "Save and exit"}
        disabled={saveDisabled}
        onClick={() => onSaveAndExit()}
      >
        <HiArrowRightOnRectangle />
      </IconButton>

      {isEdit && (
        <IconButton
          size="sm"
          variant="secondary"
          label="Public share link"
          onClick={() => setShareOpen(true)}
        >
          <HiLink />
        </IconButton>
      )}

      {isSearchable && (
        <IconButton
          size="sm"
          variant={isSearchable.value ? "info" : "ghost"}
          label={
            isSearchable.value
              ? "Visible in spotlight — click to hide"
              : "Hidden from spotlight — click to show"
          }
          onClick={() => isSearchable.onChange(!isSearchable.value)}
        >
          {isSearchable.value ? <HiOutlineEye /> : <HiOutlineEyeSlash />}
        </IconButton>
      )}

      {isEdit && (
        <IconButton
          size="sm"
          variant={graphVisible ? "success" : "ghost"}
          label={
            graphVisible
              ? "Visible in graph — click to hide"
              : "Hidden from graph — click to show"
          }
          disabled={graphQuery.isLoading || toggleGraph.isPending}
          onClick={() =>
            toggleGraph.mutate({
              type: kind,
              id,
              show_in_graph: !graphVisible,
            })
          }
        >
          {graphVisible ? <HiShare /> : <HiOutlineShare />}
        </IconButton>
      )}

      {isEdit && (
        <IconButton
          size="sm"
          variant={anchored ? "warning" : "ghost"}
          label={
            anchored
              ? "Anchored to calendar — click to remove"
              : "Anchor to calendar"
          }
          disabled={toggleAnchor.isPending}
          onClick={() =>
            toggleAnchor.mutate({
              type: kind,
              id,
              is_calendar_anchored: !anchored,
            })
          }
        >
          {anchored ? <HiBookmark /> : <HiOutlineBookmark />}
        </IconButton>
      )}

      {isEdit && onDelete && (
        <IconButton
          size="sm"
          variant="danger"
          label="Delete"
          disabled={isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <HiTrash />
        </IconButton>
      )}

      {mode === "modal" && isEdit && (
        <IconButton
          size="sm"
          variant="ghost"
          label="Open in edit page"
          onClick={openInPage}
        >
          <HiArrowsPointingOut />
        </IconButton>
      )}

      {mode === "modal" && onClose && (
        <IconButton
          size="sm"
          variant="ghost"
          label="Close"
          disabled={isPending}
          onClick={onClose}
        >
          <HiXMark />
        </IconButton>
      )}

      {isEdit && (
        <ShareLinkModal
          isOpen={shareOpen}
          kind={kind}
          id={id}
          onClose={() => setShareOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title={`Delete ${entityLabel}?`}
        message="This cannot be undone."
        confirmText="Delete"
        variant="danger"
        isProcessing={isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!onDelete) return;
          await onDelete();
          setConfirmDelete(false);
        }}
      />
    </>
  );
}
