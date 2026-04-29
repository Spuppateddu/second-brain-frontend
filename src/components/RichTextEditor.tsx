"use client";

import { Button } from "@heroui/react";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
};

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

function Toolbar({ editor }: { editor: Editor }) {
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

  const setLink = () => {
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
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const indent = () => {
    if (editor.can().sinkListItem("listItem")) {
      editor.chain().focus().sinkListItem("listItem").run();
    } else if (editor.can().sinkListItem("taskItem")) {
      editor.chain().focus().sinkListItem("taskItem").run();
    }
  };

  const outdent = () => {
    if (editor.can().liftListItem("listItem")) {
      editor.chain().focus().liftListItem("listItem").run();
    } else if (editor.can().liftListItem("taskItem")) {
      editor.chain().focus().liftListItem("taskItem").run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 px-2 py-1 dark:border-zinc-800">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        H3
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1. List
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("taskList")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task list"
      >
        ☐ Task
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote"
      >
        Quote
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline code"
      >
        Code
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={setLink}
        title="Link"
      >
        Link
      </ToolbarButton>
      <Divider />
      <ToolbarButton
        active={showMore}
        onClick={() => setShowMore((v) => !v)}
        title={showMore ? "Hide more options" : "Show more options"}
      >
        ⋯ More
      </ToolbarButton>
      <span className="ml-auto" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        Undo
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        Redo
      </ToolbarButton>

      {showMore && (
        <div className="flex w-full flex-wrap items-center gap-1 border-t border-zinc-200 pt-1 dark:border-zinc-800">
          <div className="relative" ref={popoverRef}>
            <ToolbarButton
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
                editor.chain().focus().setColor(c).run();
                setShowTextColor(false);
              }}
              onReset={() => {
                editor.chain().focus().unsetColor().run();
                setShowTextColor(false);
              }}
              onClose={() => setShowTextColor(false)}
            />
          </div>
          <div className="relative">
            <ToolbarButton
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
                editor.chain().focus().toggleHighlight({ color: c }).run();
                setShowHighlight(false);
              }}
              onReset={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowHighlight(false);
              }}
              onClose={() => setShowHighlight(false)}
            />
          </div>
          <Divider />
          <ToolbarButton
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            title="Align left"
          >
            ⬅
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            title="Align center"
          >
            ↔
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            title="Align right"
          >
            ➡
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            title="Justify"
          >
            ⬌
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={outdent}
            disabled={
              !editor.can().liftListItem("listItem") &&
              !editor.can().liftListItem("taskItem")
            }
            title="Outdent"
          >
            ←
          </ToolbarButton>
          <ToolbarButton
            onClick={indent}
            disabled={
              !editor.can().sinkListItem("listItem") &&
              !editor.can().sinkListItem("taskItem")
            }
            title="Indent"
          >
            →
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code block"
          >
            {"{ }"}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            ―
          </ToolbarButton>
          <Divider />
          <ToolbarButton onClick={insertTable} title="Insert table">
            Table
          </ToolbarButton>
          {editor.isActive("table") && (
            <>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Add column before"
              >
                +Col←
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add column after"
              >
                +Col→
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete column"
              >
                −Col
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="Add row before"
              >
                +Row↑
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add row after"
              >
                +Row↓
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete row"
              >
                −Row
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete table"
                className="text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900"
              >
                Delete table
              </ToolbarButton>
            </>
          )}
          <Divider />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
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

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  editable = true,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {editable ? <Toolbar editor={editor} /> : null}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 dark:prose-invert focus:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-zinc-300 [&_.ProseMirror_th]:bg-zinc-50 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-zinc-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_.selectedCell]:bg-primary-100/40 dark:[&_.ProseMirror_th]:border-zinc-700 dark:[&_.ProseMirror_th]:bg-zinc-800 dark:[&_.ProseMirror_td]:border-zinc-700"
      />
    </div>
  );
}

export { Button };
