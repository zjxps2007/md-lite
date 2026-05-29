import { writable } from "svelte/store";
import { DEFAULT_MARKDOWN, DEFAULT_SETTINGS } from "$lib/defaults";
import type {
  CursorPosition,
  DocumentId,
  FileOpenResult,
  FileSaveResult,
  MarkdownDocument,
  MdLiteEditorState,
  RecentFile,
  ViewMode,
} from "$lib/types";

function createId(): DocumentId {
  return globalThis.crypto?.randomUUID?.() ?? `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createUntitledDocument(content = DEFAULT_MARKDOWN): MarkdownDocument {
  const now = Date.now();

  return {
    id: createId(),
    path: null,
    fileName: "Untitled.md",
    content,
    originalContent: content,
    encoding: "utf-8",
    lineEnding: "lf",
    modified: false,
    readonly: false,
    fileStat: null,
    lastLoadedAt: now,
    lastSavedAt: null,
  };
}

export function documentFromOpenResult(result: FileOpenResult): MarkdownDocument {
  const now = Date.now();

  return {
    id: createId(),
    path: result.path,
    fileName: result.fileName,
    content: result.content,
    originalContent: result.content,
    encoding: "utf-8",
    lineEnding: result.lineEnding,
    modified: false,
    readonly: result.readonly,
    fileStat: result.fileStat,
    lastLoadedAt: now,
    lastSavedAt: null,
  };
}

export function getActiveDocument(state: MdLiteEditorState): MarkdownDocument | null {
  return state.activeDocumentId ? state.documents[state.activeDocumentId] ?? null : null;
}

export function upsertRecentFile(
  files: RecentFile[],
  file: Pick<RecentFile, "path" | "name">,
  limit = DEFAULT_SETTINGS.recentFilesLimit,
): RecentFile[] {
  return [
    {
      ...file,
      exists: true,
      lastOpenedAt: Date.now(),
    },
    ...files.filter((recent) => recent.path !== file.path),
  ].slice(0, limit);
}

function createDocumentStore() {
  const initialDocument = createUntitledDocument();
  const { subscribe, update, set } = writable<MdLiteEditorState>({
    activeDocumentId: initialDocument.id,
    documents: {
      [initialDocument.id]: initialDocument,
    },
    viewMode: DEFAULT_SETTINGS.defaultViewMode,
    wordWrap: true,
    showLineNumbers: true,
    currentCursor: { line: 1, column: 1 },
    scrollSync: true,
  });

  return {
    subscribe,
    reset() {
      const document = createUntitledDocument();
      set({
        activeDocumentId: document.id,
        documents: { [document.id]: document },
        viewMode: DEFAULT_SETTINGS.defaultViewMode,
        wordWrap: true,
        showLineNumbers: true,
        currentCursor: { line: 1, column: 1 },
        scrollSync: true,
      });
    },
    newDocument() {
      const document = createUntitledDocument("");
      update((state) => ({
        ...state,
        activeDocumentId: document.id,
        documents: {
          ...state.documents,
          [document.id]: document,
        },
        currentCursor: { line: 1, column: 1 },
      }));
    },
    openDocument(result: FileOpenResult) {
      const document = documentFromOpenResult(result);
      update((state) => ({
        ...state,
        activeDocumentId: document.id,
        documents: {
          ...state.documents,
          [document.id]: document,
        },
        currentCursor: { line: 1, column: 1 },
      }));
      return document;
    },
    updateContent(content: string) {
      update((state) => {
        const active = getActiveDocument(state);
        if (!active) return state;

        return {
          ...state,
          documents: {
            ...state.documents,
            [active.id]: {
              ...active,
              content,
              modified: content !== active.originalContent,
            },
          },
        };
      });
    },
    markSaved(result: FileSaveResult) {
      update((state) => {
        const active = getActiveDocument(state);
        if (!active) return state;

        return {
          ...state,
          documents: {
            ...state.documents,
            [active.id]: {
              ...active,
              path: result.path,
              fileName: result.fileName,
              originalContent: active.content,
              modified: false,
              readonly: false,
              fileStat: result.fileStat,
              lastSavedAt: Date.now(),
            },
          },
        };
      });
    },
    setCursor(cursor: CursorPosition) {
      update((state) => ({
        ...state,
        currentCursor: cursor,
      }));
    },
    setViewMode(viewMode: ViewMode) {
      update((state) => ({
        ...state,
        viewMode,
      }));
    },
    toggleWordWrap() {
      update((state) => ({
        ...state,
        wordWrap: !state.wordWrap,
      }));
    },
    toggleLineNumbers() {
      update((state) => ({
        ...state,
        showLineNumbers: !state.showLineNumbers,
      }));
    },
    setActiveDocument(id: DocumentId) {
      update((state) => ({
        ...state,
        activeDocumentId: id,
      }));
    },
    closeDocument(id: DocumentId) {
      update((state) => {
        const nextDocs = { ...state.documents };
        delete nextDocs[id];
        const docIds = Object.keys(nextDocs) as DocumentId[];
        let nextActiveId = state.activeDocumentId;
        if (nextActiveId === id) {
          nextActiveId = docIds[docIds.length - 1] ?? null;
        }
        if (!nextActiveId) {
          const untitled = createUntitledDocument();
          return {
            ...state,
            activeDocumentId: untitled.id,
            documents: { [untitled.id]: untitled },
            currentCursor: { line: 1, column: 1 },
          };
        }
        return {
          ...state,
          activeDocumentId: nextActiveId,
          documents: nextDocs,
          currentCursor: { line: 1, column: 1 },
        };
      });
    },
  };
}

export const editorState = createDocumentStore();
export const recentFilesStore = writable<RecentFile[]>([]);
