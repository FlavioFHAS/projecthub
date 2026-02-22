"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RichTextViewerProps {
  content?: object | null;
  className?: string;
  emptyText?: string;
}

export function RichTextViewer({
  content,
  className,
  emptyText = "Nenhum conteúdo",
}: RichTextViewerProps) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Color,
      TextStyle,
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: content || "",
    editable: false,
  });

  // Check if content is empty
  const isEmpty = !content || 
    (typeof content === "object" && 
     (!content.content || 
      (Array.isArray(content.content) && content.content.length === 0)));

  if (isEmpty) {
    return (
      <div className={cn("text-muted-foreground italic", className)}>
        {emptyText}
      </div>
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-headings:font-semibold",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r",
        "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg",
        "prose-img:rounded-lg prose-img:max-w-full",
        "prose-table:w-full prose-table:border-collapse",
        "prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-th:font-semibold",
        "prose-td:p-2 prose-td:border-t",
        "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
        "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
        "[&_ul[data-type=taskList]_li_input]:mt-1",
        className
      )}
    />
  );
}
