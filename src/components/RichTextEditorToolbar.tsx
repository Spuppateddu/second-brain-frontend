"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

const TEXT_COLORS = [
  "#000000",
  "#FF0000",
  "#00A000",
  "#0066CC",
  "#FFA500",
  "#800080",
  "#9C9C9C",
];

const HIGHLIGHT_COLORS = [
  "#FFFF00",
  "#A4F4A4",
  "#A4E8FF",
  "#FFB0FF",
  "#FFD68A",
  "#FFB6C1",
];

function ToolbarButton({
  active,
  onClick,
  children,
  disabled,
  title,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "rounded px-2 py-1 text-xs",
        active
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
        "disabled:opacity-40",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />;
}

function ColorPopover({
  label,
  colors,
  open,
  onPick,
  onReset,
  onClose,
}: {
  label: string;
  colors: string[];
  open: boolean;
  onPick: (color: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            className="h-6 w-6 rounded border border-zinc-300 hover:scale-110 dark:border-zinc-600"
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded bg-primary-500 px-2 py-1 text-xs text-white hover:bg-primary-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

type ToolbarProps = {
  editor: Editor | null;
  className?: string;
};

export function RichTextToolbar({ editor, className }: ToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowTextColor(false);
        setShowHighlight(false);
      }
    }
    if (showTextColor || showHighlight) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showTextColor, showHighlight]);

  const disabled = !editor;

  function isActive(name: string, attrs?: Record<string, unknown>): boolean;
  function isActive(attrs: Record<string, unknown>): boolean;
  function isActive(
    a: string | Record<string, unknown>,
    b?: Record<string, unknown>,
  ): boolean {
    if (!editor) return false;
    if (typeof a === "string") {
      return editor.isActive(a, b);
    }
    return editor.isActive(a);
  }

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const indent = () => {
    if (!editor) return;
    if (editor.can().sinkListItem("listItem")) {
      editor.chain().focus().sinkListItem("listItem").run();
    } else if (editor.can().sinkListItem("taskItem")) {
      editor.chain().focus().sinkListItem("taskItem").run();
    }
  };

  const outdent = () => {
    if (!editor) return;
    if (editor.can().liftListItem("listItem")) {
      editor.chain().focus().liftListItem("listItem").run();
    } else if (editor.can().liftListItem("taskItem")) {
      editor.chain().focus().liftListItem("taskItem").run();
    }
  };

  const canUndo = !!editor && editor.can().undo();
  const canRedo = !!editor && editor.can().redo();
  const canIndent =
    !!editor &&
    (editor.can().sinkListItem("listItem") ||
      editor.can().sinkListItem("taskItem"));
  const canOutdent =
    !!editor &&
    (editor.can().liftListItem("listItem") ||
      editor.can().liftListItem("taskItem"));

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-950",
        className ?? "",
      ].join(" ")}
    >
      <ToolbarButton
        active={isActive("bold")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={isActive("italic")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={isActive("underline")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        active={isActive("strike")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={isActive("heading", { level: 1 })}
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run()
        }
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        }
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() =>
          editor?.chain().focus().toggleHeading({ level: 3 }).run()
        }
        title="Heading 3"
      >
        H3
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={isActive("bulletList")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        active={isActive("orderedList")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        active={isActive("taskList")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
        title="Task list"
      >
        ☐ Task
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={isActive("blockquote")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        active={isActive("code")}
        disabled={disabled}
        onClick={() => editor?.chain().focus().toggleCode().run()}
        title="Inline code"
      >
        Code
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={isActive("link")}
        disabled={disabled}
        onClick={setLink}
        title="Link"
      >
        Link
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={showMore}
        disabled={disabled}
        onClick={() => setShowMore((v) => !v)}
        title={showMore ? "Hide more options" : "Show more options"}
      >
        ⋯ More
      </ToolbarButton>
      <span className="ml-auto" />
      <ToolbarButton
        onClick={() => editor?.chain().focus().undo().run()}
        disabled={!canUndo}
        title="Undo"
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor?.chain().focus().redo().run()}
        disabled={!canRedo}
        title="Redo"
      >
        Redo
      </ToolbarButton>

      {showMore && (
        <div className="flex w-full flex-wrap items-center gap-1 border-t border-zinc-200 pt-1 dark:border-zinc-800">
          <div className="relative" ref={popoverRef}>
            <ToolbarButton
              disabled={disabled}
              onClick={() => {
                setShowTextColor((v) => !v);
                setShowHighlight(false);
              }}
              title="Text color"
              active={showTextColor}
            >
              <span className="font-semibold">A</span>
              <span className="ml-1 inline-block h-2 w-2 rounded-sm bg-red-500 align-middle" />
            </ToolbarButton>
            <ColorPopover
              label="Text color"
              colors={TEXT_COLORS}
              open={showTextColor}
              onPick={(c) => {
                editor?.chain().focus().setColor(c).run();
                setShowTextColor(false);
              }}
              onReset={() => {
                editor?.chain().focus().unsetColor().run();
                setShowTextColor(false);
              }}
              onClose={() => setShowTextColor(false)}
            />
          </div>
          <div className="relative">
            <ToolbarButton
              disabled={disabled}
              onClick={() => {
                setShowHighlight((v) => !v);
                setShowTextColor(false);
              }}
              title="Highlight"
              active={showHighlight}
            >
              <span className="rounded bg-yellow-200 px-1 font-semibold dark:bg-yellow-700">
                H
              </span>
            </ToolbarButton>
            <ColorPopover
              label="Highlight"
              colors={HIGHLIGHT_COLORS}
              open={showHighlight}
              onPick={(c) => {
                editor?.chain().focus().toggleHighlight({ color: c }).run();
                setShowHighlight(false);
              }}
              onReset={() => {
                editor?.chain().focus().unsetHighlight().run();
                setShowHighlight(false);
              }}
              onClose={() => setShowHighlight(false)}
            />
          </div>
          <Divider />
          <ToolbarButton
            active={isActive({ textAlign: "left" })}
            disabled={disabled}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            title="Align left"
          >
            ⬅
          </ToolbarButton>
          <ToolbarButton
            active={isActive({ textAlign: "center" })}
            disabled={disabled}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            title="Align center"
          >
            ↔
          </ToolbarButton>
          <ToolbarButton
            active={isActive({ textAlign: "right" })}
            disabled={disabled}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            title="Align right"
          >
            ➡
          </ToolbarButton>
          <ToolbarButton
            active={isActive({ textAlign: "justify" })}
            disabled={disabled}
            onClick={() =>
              editor?.chain().focus().setTextAlign("justify").run()
            }
            title="Justify"
          >
            ⬌
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={outdent} disabled={!canOutdent} title="Outdent">
            ←
          </ToolbarButton>
          <ToolbarButton onClick={indent} disabled={!canIndent} title="Indent">
            →
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            active={isActive("codeBlock")}
            disabled={disabled}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            title="Code block"
          >
            {"{ }"}
          </ToolbarButton>
          <ToolbarButton
            disabled={disabled}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            ―
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={insertTable} disabled={disabled} title="Insert table">
            Table
          </ToolbarButton>
          {isActive("table") && (
            <>
              <ToolbarButton
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                title="Add column before"
              >
                +Col←
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                title="Add column after"
              >
                +Col→
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                title="Delete column"
              >
                −Col
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                title="Add row before"
              >
                +Row↑
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                title="Add row after"
              >
                +Row↓
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().deleteRow().run()}
                title="Delete row"
              >
                −Row
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor?.chain().focus().deleteTable().run()}
                title="Delete table"
                className="text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900"
              >
                Delete table
              </ToolbarButton>
            </>
          )}
          <Divider />
          <ToolbarButton
            disabled={disabled}
            onClick={() =>
              editor?.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Clear formatting"
          >
            ✖ Clear
          </ToolbarButton>
        </div>
      )}
    </div>
  );
}
