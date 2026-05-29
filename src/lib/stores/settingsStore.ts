import { writable } from "svelte/store";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "$lib/defaults";
import type { AppSettings } from "$lib/types";

const viewModeSchema = z.enum(["editor", "preview", "split"]);

export const appSettingsSchema = z.object({
  theme: z.enum(["system", "light", "dark"]),
  language: z.enum(["ko", "en"]),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(11).max(24),
  tabSize: z.number().int().min(2).max(8),
  autoSave: z.boolean(),
  autoSaveDelayMs: z.number().int().min(300).max(10000),
  defaultViewMode: viewModeSchema,
  recentFilesLimit: z.number().int().min(1).max(50),
  markdown: z.object({
    html: z.boolean(),
    breaks: z.boolean(),
    linkify: z.boolean(),
    typographer: z.boolean(),
    gfm: z.boolean(),
    mermaid: z.boolean(),
  }),
  autocomplete: z.object({
    enabled: z.boolean(),
    showOnTyping: z.boolean(),
    slashCommands: z.boolean(),
    codeFenceLanguages: z.boolean(),
    headingAnchors: z.boolean(),
    filePaths: z.boolean(),
    frontMatter: z.boolean(),
    mermaid: z.boolean(),
    maxSuggestions: z.number().int().min(3).max(30),
    acceptWithEnter: z.boolean(),
    acceptWithTab: z.boolean(),
  }),
});

export function mergeSettings(input: unknown): AppSettings {
  const partial = typeof input === "object" && input !== null ? (input as Partial<AppSettings>) : {};

  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...partial,
    markdown: {
      ...DEFAULT_SETTINGS.markdown,
      ...(partial.markdown ?? {}),
    },
    autocomplete: {
      ...DEFAULT_SETTINGS.autocomplete,
      ...(partial.autocomplete ?? {}),
    },
  };

  const parsed = appSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export const settingsStore = writable<AppSettings>(DEFAULT_SETTINGS);
