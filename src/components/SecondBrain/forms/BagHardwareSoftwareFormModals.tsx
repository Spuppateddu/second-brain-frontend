"use client";

import SimpleEntityFormModal from "@/components/SecondBrain/forms/SimpleEntityFormModal";
import {
  useCreateBag,
  useCreateHardware,
  useCreateSoftware,
  useUpdateBag,
  useUpdateHardware,
  useUpdateSoftware,
} from "@/lib/queries/entities";
import type { Bag, Hardware, Software } from "@/types/entities";

interface CommonProps<T> {
  isOpen: boolean;
  initial?: T | null;
  prefillTagId?: number;
  onClose: () => void;
  onSaved?: () => void;
}

export function BagFormModal(props: CommonProps<Bag>) {
  return (
    <SimpleEntityFormModal
      {...props}
      entityLabel="Bag"
      titleField="title"
      createMutation={useCreateBag()}
      updateMutation={useUpdateBag(props.initial?.id ?? 0)}
    />
  );
}

export function HardwareFormModal(props: CommonProps<Hardware>) {
  return (
    <SimpleEntityFormModal
      {...props}
      entityLabel="Hardware"
      titleField="title"
      createMutation={useCreateHardware()}
      updateMutation={useUpdateHardware(props.initial?.id ?? 0)}
    />
  );
}

export function SoftwareFormModal(props: CommonProps<Software>) {
  return (
    <SimpleEntityFormModal
      {...props}
      entityLabel="Software"
      titleField="title"
      createMutation={useCreateSoftware()}
      updateMutation={useUpdateSoftware(props.initial?.id ?? 0)}
    />
  );
}
