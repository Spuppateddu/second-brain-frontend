"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { HiTag } from "react-icons/hi2";

import { ENTITY_LABELS, getEntityBorderColor } from "@/constants/entityIcons";
import type { Tag } from "@/types/entities";

export interface TagNodeData extends Record<string, unknown> {
  tag: Tag;
  label: string;
  color: string;
  elementCount: number;
  typeBreakdown?: Array<{ type: string; count: number }>;
  isHighlighted?: boolean;
  isSearchMatch?: boolean;
  isConnectedToSearch?: boolean;
  isDimmed?: boolean;
}

function TagNode({ data, selected }: NodeProps) {
  const {
    label,
    color,
    elementCount,
    typeBreakdown,
    isHighlighted,
    isSearchMatch,
    isConnectedToSearch,
    isDimmed,
  } = data as TagNodeData;
  const dots = (typeBreakdown ?? []).slice(0, 4);

  const baseSize = 72;
  const maxSize = 110;
  const size = Math.min(maxSize, baseSize + Math.sqrt(elementCount) * 5);
  const iconSize = Math.round(size * 0.42);
  const isActive = selected || isHighlighted;

  return (
    <div
      className="group/node relative"
      style={{ width: size, height: size }}
    >
      {(["top", "right", "bottom", "left"] as const).map((pos) => (
        <Handle
          key={`t-${pos}`}
          type="target"
          position={
            Position[
              (pos.charAt(0).toUpperCase() + pos.slice(1)) as
                | "Top"
                | "Right"
                | "Bottom"
                | "Left"
            ]
          }
          className="!h-3 !w-3 !border-2 !border-white !bg-sky-500 opacity-0 transition-opacity group-hover/node:opacity-100"
          id={pos}
        />
      ))}
      {(["top", "right", "bottom", "left"] as const).map((pos) => (
        <Handle
          key={`s-${pos}`}
          type="source"
          position={
            Position[
              (pos.charAt(0).toUpperCase() + pos.slice(1)) as
                | "Top"
                | "Right"
                | "Bottom"
                | "Left"
            ]
          }
          className="!h-3 !w-3 !border-2 !border-white !bg-sky-500 opacity-0 transition-opacity group-hover/node:opacity-100"
          id={`${pos}-source`}
        />
      ))}

      <div
        className={[
          "h-full w-full rounded-2xl",
          "flex items-center justify-center",
          "border-2 transition-all duration-200",
          "cursor-pointer hover:scale-110",
          isActive ? "shadow-lg ring-4 ring-sky-500" : "shadow-md",
          isSearchMatch
            ? "animate-pulse shadow-2xl ring-4 ring-yellow-400"
            : "",
          isConnectedToSearch ? "ring-2 ring-blue-300" : "",
          isDimmed ? "opacity-30" : "opacity-100",
        ].join(" ")}
        style={{
          backgroundColor: color || "#3B82F6",
          borderColor: isActive
            ? "#00B4D8"
            : isSearchMatch
              ? "#FBBF24"
              : "white",
        }}
      >
        <HiTag
          className="text-white drop-shadow-sm"
          style={{ width: iconSize, height: iconSize }}
        />
      </div>

      {dots.length > 0 &&
        dots.map((d, i) => {
          const angle =
            (i / Math.max(dots.length, 1)) * Math.PI * 2 - Math.PI / 2;
          const r = size / 2 + 4;
          const x = Math.cos(angle) * r + size / 2 - 5;
          const y = Math.sin(angle) * r + size / 2 - 5;
          const labelText =
            ENTITY_LABELS[d.type as keyof typeof ENTITY_LABELS] ?? d.type;
          return (
            <div
              key={d.type}
              title={`${labelText}: ${d.count}`}
              className="pointer-events-auto absolute rounded-full border border-white shadow-sm"
              style={{
                width: 10,
                height: 10,
                left: x,
                top: y,
                backgroundColor: getEntityBorderColor(d.type),
              }}
            />
          );
        })}

      {elementCount > 0 && (
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-sky-900 text-xs font-bold text-white shadow-md">
          {elementCount > 99 ? "99+" : elementCount}
        </div>
      )}

      <div
        className="pointer-events-none absolute left-1/2 mt-1 max-w-[140px] -translate-x-1/2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-zinc-700 shadow dark:bg-zinc-800/80 dark:text-zinc-200"
        style={{ top: size + 2 }}
        title={label}
      >
        {label}
      </div>
    </div>
  );
}

export default memo(TagNode);
