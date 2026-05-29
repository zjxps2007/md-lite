import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, FileOpenResult, FileSaveResult, LineEnding, TauriCommandError } from "$lib/types";

const localSettingsKey = "mdlite.settings";

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function normalizeCommandError(error: unknown): TauriCommandError {
  if (typeof error === "string") return { message: error };
  if (typeof error === "object" && error !== null) return error as TauriCommandError;
  return { message: "The desktop command failed." };
}

export function toUserMessage(error: unknown): string {
  const normalized = normalizeCommandError(error);

  switch (normalized.code) {
    case "FileNotFound":
      return "File not found.";
    case "PermissionDenied":
      return "Permission denied.";
    case "InvalidPath":
      return "Invalid file path.";
    case "UnsupportedEncoding":
      return "Only UTF-8 Markdown files are supported.";
    case "FileTooLarge":
      return "This file is too large for the current MVP policy.";
    case "ExternalModification":
      return "The file changed on disk after it was opened.";
    default:
      return normalized.message ?? "The operation could not be completed.";
  }
}

export async function openMarkdownFile(path?: string | null): Promise<FileOpenResult | null> {
  if (!isTauriRuntime()) {
    throw { message: "File dialogs are available in the Tauri desktop app." };
  }

  return invoke<FileOpenResult | null>("open_markdown_file", { path: path ?? null });
}

export async function saveMarkdownFile(
  path: string,
  content: string,
  expectedModifiedAt: number | null,
  lineEnding: LineEnding,
): Promise<FileSaveResult> {
  if (!isTauriRuntime()) {
    throw { message: "Saving files is available in the Tauri desktop app." };
  }

  return invoke<FileSaveResult>("save_markdown_file", {
    path,
    content,
    expectedModifiedAt,
    lineEnding,
  });
}

export async function saveMarkdownFileAs(content: string, lineEnding: LineEnding): Promise<FileSaveResult | null> {
  if (!isTauriRuntime()) {
    throw { message: "Save As is available in the Tauri desktop app." };
  }

  return invoke<FileSaveResult | null>("save_markdown_file_as", { content, lineEnding });
}

export async function loadSettingsFromBackend(): Promise<Partial<AppSettings>> {
  if (!isTauriRuntime()) {
    return JSON.parse(localStorage.getItem(localSettingsKey) ?? "{}") as Partial<AppSettings>;
  }

  return invoke<Partial<AppSettings>>("load_settings");
}

export async function saveSettingsToBackend(settings: AppSettings): Promise<void> {
  if (!isTauriRuntime()) {
    localStorage.setItem(localSettingsKey, JSON.stringify(settings));
    return;
  }

  await invoke("save_settings", { settings });
}
