"use client";

import { useEffect } from "react";

import type { ProjectEditorPreviewState } from "@/components/project-editor-stage";

export function useEditorShortcuts(
  editor: {
    deleteSelectedClip: () => void;
    draft: { selectedClipId: string };
    moveSelectedClip: (deltaSeconds: number) => void;
    splitSelectedScene: (time: number) => void;
  },
  preview: ProjectEditorPreviewState,
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        editor.deleteSelectedClip();
        event.preventDefault();
        return;
      }
      if (event.key === " ") {
        preview.togglePlayback();
        event.preventDefault();
        return;
      }
      if (event.key.toLowerCase() === "s") {
        editor.splitSelectedScene(preview.currentTime);
        event.preventDefault();
        return;
      }
      if (!editor.draft.selectedClipId) return;
      if (event.key === "ArrowLeft") {
        editor.moveSelectedClip(-0.1);
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowRight") {
        editor.moveSelectedClip(0.1);
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, preview]);
}
