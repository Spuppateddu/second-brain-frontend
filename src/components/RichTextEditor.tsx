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
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { useEditorGroup } from "@/components/RichTextEditorGroup";
import { RichTextToolbar } from "@/components/RichTextEditorToolbar";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing…",
  editable = true,
}: Props) {
  const group = useEditorGroup();

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

  // Register with the surrounding editor group (if any) so a shared toolbar
  // can target this editor while it has focus. The toolbar hides when no
  // editor is focused; toolbar buttons use mousedown.preventDefault so they
  // don't blur the editor.
  useEffect(() => {
    if (!editor || !group || !editable) return;
    const unregister = group.registerEditor(editor);
    const onFocus = () => group.setActive(editor);
    const onBlur = () => {
      group.setActive(null);
    };
    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
      unregister();
    };
  }, [editor, group, editable]);

  if (!editor) return null;

  const showInternalToolbar = editable && !group;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {showInternalToolbar ? (
        <div className="sticky top-0 z-20 rounded-t-lg">
          <RichTextToolbar editor={editor} />
        </div>
      ) : null}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 dark:prose-invert focus:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-zinc-300 [&_.ProseMirror_th]:bg-zinc-50 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-zinc-300 [&_.ProseMirror_td]:p-2 [&_.ProseMirror_.selectedCell]:bg-primary-100/40 dark:[&_.ProseMirror_th]:border-zinc-700 dark:[&_.ProseMirror_th]:bg-zinc-800 dark:[&_.ProseMirror_td]:border-zinc-700"
      />
    </div>
  );
}

export { Button };
