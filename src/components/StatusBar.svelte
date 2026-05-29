<script lang="ts">
  import type { CursorPosition, MarkdownDocument, TextStats, ViewMode } from "$lib/types";
  import { getTranslator } from "$lib/services/i18n";
  import { settingsStore } from "$lib/stores/settingsStore";

  export let document: MarkdownDocument | null = null;
  export let cursor: CursorPosition = { line: 1, column: 1 };
  export let stats: TextStats = { words: 0, characters: 0, lines: 1 };
  export let viewMode: ViewMode = "split";
  export let message = "";

  $: t = getTranslator($settingsStore.language);

  $: viewModeLabels = {
    editor: t("viewEditor"),
    split: t("viewSplit"),
    preview: t("viewPreview"),
  };
</script>

<footer class="statusbar" aria-label="Document status">
  <div class="statusbar-left">
    <span class="status-pill" class:dirty={document?.modified}>
      <span class="status-dot"></span>
      {document?.modified ? t("modified") : t("saved")}
    </span>
    <span class="status-separator"></span>
    <span class="status-item status-filename">{document?.fileName ?? t("noDocument")}</span>
  </div>

  <div class="statusbar-center">
    {#if message}
      <span class="status-message">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        {message}
      </span>
    {/if}
  </div>

  <div class="statusbar-right">
    <span class="status-item">{t("line")} {cursor.line}, {t("col")} {cursor.column}</span>
    <span class="status-separator"></span>
    <span class="status-item">{stats.words} {t("words")}</span>
    <span class="status-separator"></span>
    <span class="status-item">{stats.characters} {t("chars")}</span>
    <span class="status-separator status-extra"></span>
    <span class="status-item status-extra">{document?.encoding.toUpperCase() ?? "UTF-8"}</span>
    <span class="status-separator status-extra"></span>
    <span class="status-item status-extra">{document?.lineEnding.toUpperCase() ?? "LF"}</span>
    <span class="status-separator status-extra"></span>
    <span class="status-item status-view-mode status-extra">{viewModeLabels[viewMode]}</span>
  </div>
</footer>
