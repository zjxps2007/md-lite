export type DocumentId = string;
export type LineEnding = "lf" | "crlf";
export type ViewMode = "editor" | "preview" | "split";
export type ThemePreference = "system" | "light" | "dark";

export interface FileStat {
  size: number;
  modifiedAt: number;
  createdAt?: number;
}

export interface MarkdownDocument {
  id: DocumentId;
  path: string | null;
  fileName: string;
  content: string;
  originalContent: string;
  encoding: "utf-8";
  lineEnding: LineEnding;
  modified: boolean;
  readonly: boolean;
  fileStat: FileStat | null;
  lastLoadedAt: number;
  lastSavedAt: number | null;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface MdLiteEditorState {
  activeDocumentId: DocumentId | null;
  documents: Record<DocumentId, MarkdownDocument>;
  viewMode: ViewMode;
  wordWrap: boolean;
  showLineNumbers: boolean;
  currentCursor: CursorPosition;
  scrollSync: boolean;
}

export interface MarkdownSettings {
  html: boolean;
  breaks: boolean;
  linkify: boolean;
  typographer: boolean;
  gfm: boolean;
  mermaid: boolean;
}

export interface AutocompleteSettings {
  enabled: boolean;
  showOnTyping: boolean;
  slashCommands: boolean;
  codeFenceLanguages: boolean;
  headingAnchors: boolean;
  filePaths: boolean;
  frontMatter: boolean;
  mermaid: boolean;
  maxSuggestions: number;
  acceptWithEnter: boolean;
  acceptWithTab: boolean;
}

export interface AppSettings {
  theme: ThemePreference;
  fontFamily: string;
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  autoSaveDelayMs: number;
  defaultViewMode: ViewMode;
  recentFilesLimit: number;
  markdown: MarkdownSettings;
  autocomplete: AutocompleteSettings;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpenedAt: number;
  exists: boolean;
}

export type MarkdownCompletionKind =
  | "heading"
  | "list"
  | "task"
  | "quote"
  | "code"
  | "link"
  | "image"
  | "table"
  | "frontmatter"
  | "mermaid"
  | "command"
  | "path"
  | "anchor";

export interface HeadingItem {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  line: number;
  slug: string;
}

export interface TextStats {
  words: number;
  characters: number;
  lines: number;
}

export interface FileOpenResult {
  path: string;
  fileName: string;
  content: string;
  lineEnding: LineEnding;
  readonly: boolean;
  fileStat: FileStat;
}

export interface FileSaveResult {
  path: string;
  fileName: string;
  fileStat: FileStat;
}

export interface TauriCommandError {
  code?: string;
  message?: string;
}
