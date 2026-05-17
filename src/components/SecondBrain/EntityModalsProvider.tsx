"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import BagEditor from "@/components/SecondBrain/forms/BagEditor";
import BookmarkEditor from "@/components/SecondBrain/forms/BookmarkEditor";
import HardwareEditor from "@/components/SecondBrain/forms/HardwareEditor";
import MegaFileEditor from "@/components/SecondBrain/forms/MegaFileEditor";
import NoteEditor from "@/components/SecondBrain/forms/NoteEditor";
import PersonEditor from "@/components/SecondBrain/forms/PersonEditor";
import PlaceEditor from "@/components/SecondBrain/forms/PlaceEditor";
import RecipeEditor from "@/components/SecondBrain/forms/RecipeEditor";
import SoftwareEditor from "@/components/SecondBrain/forms/SoftwareEditor";
import TripEditor from "@/components/SecondBrain/forms/TripEditor";
import WishlistEditor from "@/components/SecondBrain/forms/WishlistEditor";
import type {
  Bag,
  Bookmark,
  Hardware,
  MegaFile,
  Note,
  Person,
  Place,
  Recipe,
  Software,
  Trip,
  WishlistItem,
} from "@/types/entities";
import type { GraphNodeKind } from "@/types/graph";

type EntityKind = Exclude<GraphNodeKind, "tag">;

type AnyEntity =
  | Bookmark
  | Note
  | Place
  | Person
  | WishlistItem
  | Recipe
  | Trip
  | Bag
  | Hardware
  | Software
  | MegaFile;

interface ModalState {
  kind: EntityKind;
  /** present when editing — undefined means create */
  entity?: AnyEntity;
  /** the tag the user invoked "+ New" from, so the form pre-selects it */
  prefillTagId?: number;
}

interface EntityModalsContextValue {
  openCreate: (kind: EntityKind, prefillTagId?: number) => void;
  openEdit: (kind: EntityKind, entity: AnyEntity) => void;
  close: () => void;
}

const EntityModalsContext = createContext<EntityModalsContextValue | null>(
  null,
);

export function useEntityModals(): EntityModalsContextValue {
  const ctx = useContext(EntityModalsContext);
  if (!ctx) {
    throw new Error(
      "useEntityModals must be used within an EntityModalsProvider",
    );
  }
  return ctx;
}

export default function EntityModalsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ModalState | null>(null);

  const openCreate = useCallback(
    (kind: EntityKind, prefillTagId?: number) => {
      setState({ kind, prefillTagId });
    },
    [],
  );
  const openEdit = useCallback((kind: EntityKind, entity: AnyEntity) => {
    setState({ kind, entity });
  }, []);
  const close = useCallback(() => setState(null), []);

  const handleSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["second-brain"] });
    queryClient.invalidateQueries({ queryKey: ["tag-card"] });
  }, [queryClient]);

  const value = useMemo<EntityModalsContextValue>(
    () => ({ openCreate, openEdit, close }),
    [openCreate, openEdit, close],
  );

  return (
    <EntityModalsContext.Provider value={value}>
      {children}
      {state?.kind === "bookmark" && (
        <BookmarkEditor
          mode="modal"
          initial={state.entity as Bookmark | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "note" && (
        <NoteEditor
          mode="modal"
          initial={state.entity as Note | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "place" && (
        <PlaceEditor
          mode="modal"
          initial={state.entity as Place | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "person" && (
        <PersonEditor
          mode="modal"
          initial={state.entity as Person | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "wishlist_item" && (
        <WishlistEditor
          mode="modal"
          initial={state.entity as WishlistItem | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "recipe" && (
        <RecipeEditor
          mode="modal"
          initial={state.entity as Recipe | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "trip" && (
        <TripEditor
          mode="modal"
          initial={state.entity as Trip | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "bag" && (
        <BagEditor
          mode="modal"
          initial={state.entity as Bag | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "hardware" && (
        <HardwareEditor
          mode="modal"
          initial={state.entity as Hardware | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "software" && (
        <SoftwareEditor
          mode="modal"
          initial={state.entity as Software | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
      {state?.kind === "mega_file" && (
        <MegaFileEditor
          mode="modal"
          initial={state.entity as MegaFile | undefined}
          prefillTagId={state.prefillTagId}
          onClose={close}
          onSaved={handleSaved}
        />
      )}
    </EntityModalsContext.Provider>
  );
}
