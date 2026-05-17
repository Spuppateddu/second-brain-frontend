"use client";

import type { Editor } from "@tiptap/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { RichTextToolbar } from "@/components/RichTextEditorToolbar";

type EditorGroupContextValue = {
  activeEditor: Editor | null;
  registerEditor: (editor: Editor) => () => void;
  setActive: (editor: Editor | null) => void;
};

const EditorGroupContext = createContext<EditorGroupContextValue | null>(null);

export function useEditorGroup(): EditorGroupContextValue | null {
  return useContext(EditorGroupContext);
}

export function EditorGroupProvider({ children }: { children: ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  const registerEditor = useCallback((editor: Editor) => {
    setActiveEditor((current) => (current ? current : editor));
    return () => {
      setActiveEditor((current) => (current === editor ? null : current));
    };
  }, []);

  const setActive = useCallback((editor: Editor | null) => {
    setActiveEditor(editor);
  }, []);

  const value = useMemo(
    () => ({ activeEditor, registerEditor, setActive }),
    [activeEditor, registerEditor, setActive],
  );

  return (
    <EditorGroupContext.Provider value={value}>
      {children}
    </EditorGroupContext.Provider>
  );
}

export function SharedEditorToolbar({ className }: { className?: string }) {
  const group = useEditorGroup();
  const [, force] = useState(0);

  // Re-render the toolbar on selection/transaction changes of the active editor
  // so that active states (e.g. bold/italic indicators) stay in sync.
  useEffect(() => {
    const editor = group?.activeEditor;
    if (!editor) return;
    const rerender = () => force((n) => n + 1);
    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);
    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("transaction", rerender);
    };
  }, [group?.activeEditor]);

  return (
    <div
      className={[
        "sticky top-0 z-20 rounded-t-lg",
        className ?? "",
      ].join(" ")}
    >
      <RichTextToolbar editor={group?.activeEditor ?? null} />
    </div>
  );
}
