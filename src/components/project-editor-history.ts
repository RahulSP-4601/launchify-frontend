"use client";

import { useState } from "react";

import { ProjectEditorDraft } from "@/components/project-editor-draft";

const MAX_HISTORY_STEPS = 60;

type DraftHistoryState = {
  past: ProjectEditorDraft[];
  present: ProjectEditorDraft;
  future: ProjectEditorDraft[];
};

type DraftUpdater = ProjectEditorDraft | ((current: ProjectEditorDraft) => ProjectEditorDraft);

export function useProjectEditorHistory(initialDraft: ProjectEditorDraft) {
  const [history, setHistory] = useState(() => createHistoryState(initialDraft));

  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    draft: history.present,
    redo: () => setHistory((current) => redoHistory(current)),
    replaceDraft: (draft: ProjectEditorDraft, trackHistory = true) =>
      setHistory((current) => replaceHistoryDraft(current, draft, trackHistory)),
    syncDraft: (updater: DraftUpdater) =>
      setHistory((current) => replaceHistoryDraft(current, resolveDraftUpdate(current.present, updater), false)),
    setDraft: (updater: DraftUpdater) =>
      setHistory((current) => applyHistoryUpdate(current, updater)),
    undo: () => setHistory((current) => undoHistory(current)),
  };
}

function createHistoryState(initialDraft: ProjectEditorDraft): DraftHistoryState {
  return { future: [], past: [], present: initialDraft };
}

function applyHistoryUpdate(history: DraftHistoryState, updater: DraftUpdater): DraftHistoryState {
  const nextDraft = resolveDraftUpdate(history.present, updater);
  return replaceHistoryDraft(history, nextDraft, true);
}

function resolveDraftUpdate(current: ProjectEditorDraft, updater: DraftUpdater) {
  return typeof updater === "function" ? updater(current) : updater;
}

function replaceHistoryDraft(
  history: DraftHistoryState,
  nextDraft: ProjectEditorDraft,
  trackHistory: boolean,
): DraftHistoryState {
  if (serializeDraft(history.present) === serializeDraft(nextDraft)) {
    return history;
  }
  if (!trackHistory) {
    return { ...history, future: [], present: nextDraft };
  }
  return {
    future: [],
    past: [...history.past, history.present].slice(-MAX_HISTORY_STEPS),
    present: nextDraft,
  };
}

function undoHistory(history: DraftHistoryState): DraftHistoryState {
  if (!history.past.length) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  return {
    future: [history.present, ...history.future].slice(0, MAX_HISTORY_STEPS),
    past: history.past.slice(0, -1),
    present: previous,
  };
}

function redoHistory(history: DraftHistoryState): DraftHistoryState {
  if (!history.future.length) {
    return history;
  }
  const [next, ...future] = history.future;
  return {
    future,
    past: [...history.past, history.present].slice(-MAX_HISTORY_STEPS),
    present: next,
  };
}

function serializeDraft(draft: ProjectEditorDraft) {
  return JSON.stringify(draft);
}
