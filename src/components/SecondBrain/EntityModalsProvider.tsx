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

import {
  BagFormModal,
  HardwareFormModal,
  SoftwareFormModal,
} from "@/components/SecondBrain/forms/BagHardwareSoftwareFormModals";
import BookmarkFormModal from "@/components/SecondBrain/forms/BookmarkFormModal";
import MegaFileFormModal from "@/components/SecondBrain/forms/MegaFileFormModal";
import NoteFormModal from "@/components/SecondBrain/forms/NoteFormModal";
import PersonFormModal from "@/components/SecondBrain/forms/PersonFormModal";
import PlaceFormModal from "@/components/SecondBrain/forms/PlaceFormModal";
import RecipeFormModal from "@/components/SecondBrain/forms/RecipeFormModal";
import TripFormModal from "@/components/SecondBrain/forms/TripFormModal";
import WishlistFormModal from "@/components/SecondBrain/forms/WishlistFormModal";
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

  // After any save, the second-brain payload may now have new
  // tags/entities/links — refetch so the graph + tag-card stay in sync.
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
      <BookmarkFormModal
        isOpen={state?.kind === "bookmark"}
        initial={
          state?.kind === "bookmark" ? (state.entity as Bookmark) : undefined
        }
        prefillTagId={state?.kind === "bookmark" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <NoteFormModal
        isOpen={state?.kind === "note"}
        initial={state?.kind === "note" ? (state.entity as Note) : undefined}
        prefillTagId={state?.kind === "note" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <PlaceFormModal
        isOpen={state?.kind === "place"}
        initial={state?.kind === "place" ? (state.entity as Place) : undefined}
        prefillTagId={state?.kind === "place" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <PersonFormModal
        isOpen={state?.kind === "person"}
        initial={
          state?.kind === "person" ? (state.entity as Person) : undefined
        }
        prefillTagId={state?.kind === "person" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <WishlistFormModal
        isOpen={state?.kind === "wishlist_item"}
        initial={
          state?.kind === "wishlist_item"
            ? (state.entity as WishlistItem)
            : undefined
        }
        prefillTagId={
          state?.kind === "wishlist_item" ? state.prefillTagId : undefined
        }
        onClose={close}
        onSaved={handleSaved}
      />
      <RecipeFormModal
        isOpen={state?.kind === "recipe"}
        initial={
          state?.kind === "recipe" ? (state.entity as Recipe) : undefined
        }
        prefillTagId={state?.kind === "recipe" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <TripFormModal
        isOpen={state?.kind === "trip"}
        initial={state?.kind === "trip" ? (state.entity as Trip) : undefined}
        prefillTagId={state?.kind === "trip" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <BagFormModal
        isOpen={state?.kind === "bag"}
        initial={state?.kind === "bag" ? (state.entity as Bag) : undefined}
        prefillTagId={state?.kind === "bag" ? state.prefillTagId : undefined}
        onClose={close}
        onSaved={handleSaved}
      />
      <HardwareFormModal
        isOpen={state?.kind === "hardware"}
        initial={
          state?.kind === "hardware" ? (state.entity as Hardware) : undefined
        }
        prefillTagId={
          state?.kind === "hardware" ? state.prefillTagId : undefined
        }
        onClose={close}
        onSaved={handleSaved}
      />
      <SoftwareFormModal
        isOpen={state?.kind === "software"}
        initial={
          state?.kind === "software" ? (state.entity as Software) : undefined
        }
        prefillTagId={
          state?.kind === "software" ? state.prefillTagId : undefined
        }
        onClose={close}
        onSaved={handleSaved}
      />
      <MegaFileFormModal
        isOpen={state?.kind === "mega_file"}
        initial={
          state?.kind === "mega_file" ? (state.entity as MegaFile) : undefined
        }
        prefillTagId={
          state?.kind === "mega_file" ? state.prefillTagId : undefined
        }
        onClose={close}
        onSaved={handleSaved}
      />
    </EntityModalsContext.Provider>
  );
}
