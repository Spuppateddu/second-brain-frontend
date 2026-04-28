"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { createElement, memo } from "react";

import { getEntityBorderColor, getEntityIcon } from "@/constants/entityIcons";
import type { GraphEntity, GraphNodeKind } from "@/types/graph";

export interface EntityNodeData extends Record<string, unknown> {
  kind: GraphNodeKind;
  label: string;
  color?: string;
  entity?: GraphEntity;
  isHighlighted?: boolean;
  isSearchMatch?: boolean;
  isConnectedToSearch?: boolean;
  isDimmed?: boolean;
}

function EntityNode({ data, selected }: NodeProps) {
  const {
    kind,
    label,
    color,
    isHighlighted,
    isSearchMatch,
    isConnectedToSearch,
    isDimmed,
  } = data as EntityNodeData;

  const iconElement = createElement(getEntityIcon(kind), {
    className: "h-8 w-8 text-white drop-shadow-sm",
  });

  const resolvedColor =
    color && color.trim().length > 0 ? color : getEntityBorderColor(kind);

  const size = 72;
  const isActive = selected || isHighlighted;

  return (
    <div className="group/node relative" style={{ width: size, height: size }}>
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
          backgroundColor: resolvedColor,
          borderColor: isActive
            ? "#00B4D8"
            : isSearchMatch
              ? "#FBBF24"
              : "white",
        }}
      >
        {iconElement}
      </div>

      <div
        className="pointer-events-none absolute left-1/2 mt-1 max-w-[120px] -translate-x-1/2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-medium text-zinc-700 shadow dark:bg-zinc-800/80 dark:text-zinc-200"
        style={{ top: size + 2 }}
        title={label}
      >
        {label}
      </div>
    </div>
  );
}

export default memo(EntityNode);
