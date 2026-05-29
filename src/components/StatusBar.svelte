<script lang="ts">
  import type { CursorPosition, MarkdownDocument, TextStats, ViewMode } from "$lib/types";

  export let document: MarkdownDocument | null = null;
  export let cursor: CursorPosition = { line: 1, column: 1 };
  export let stats: TextStats = { words: 0, characters: 0, lines: 1 };
  export let viewMode: ViewMode = "split";
  export let message = "";
</script>

<footer class="statusbar" aria-label="Document status">
  <span class:dirty={document?.modified}>{document?.modified ? "Modified" : "Saved"}</span>
  <span>{document?.fileName ?? "No document"}</span>
  <span>Line {cursor.line}, Col {cursor.column}</span>
  <span>{stats.words} words</span>
  <span>{stats.characters} chars</span>
  <span>{document?.encoding.toUpperCase() ?? "UTF-8"}</span>
  <span>{document?.lineEnding.toUpperCase() ?? "LF"}</span>
  <span>{viewMode}</span>
  {#if message}
    <span class="status-message">{message}</span>
  {/if}
</footer>
