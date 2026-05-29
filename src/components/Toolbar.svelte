<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { MarkdownDocument, RecentFile, ViewMode } from "$lib/types";

  export let document: MarkdownDocument | null = null;
  export let viewMode: ViewMode = "split";
  export let recentFiles: RecentFile[] = [];
  export let desktopReady = false;

  const dispatch = createEventDispatcher<{
    new: void;
    open: void;
    save: void;
    saveAs: void;
    find: void;
    settings: void;
    viewMode: { mode: ViewMode };
    openRecent: { path: string };
  }>();

  const viewModes: ViewMode[] = ["editor", "split", "preview"];
</script>

<header class="toolbar">
  <div class="brand-mark" aria-label="MdLite">
    <span class="brand-glyph">M</span>
    <div>
      <strong>MdLite</strong>
      <small>Local Markdown IDE</small>
    </div>
  </div>

  <nav class="toolbar-actions" aria-label="File actions">
    <button type="button" onclick={() => dispatch("new")}>New</button>
    <button type="button" onclick={() => dispatch("open")} disabled={!desktopReady}>Open</button>
    <button type="button" onclick={() => dispatch("save")} disabled={!document}>Save</button>
    <button type="button" onclick={() => dispatch("saveAs")} disabled={!document || !desktopReady}>Save As</button>
    <button type="button" onclick={() => dispatch("find")} disabled={!document}>Find</button>
  </nav>

  <div class="view-switcher" aria-label="View mode">
    {#each viewModes as mode}
      <button
        type="button"
        class:active={viewMode === mode}
        aria-pressed={viewMode === mode}
        onclick={() => dispatch("viewMode", { mode })}
      >
        {mode}
      </button>
    {/each}
  </div>

  <div class="recent-wrap">
    <label>
      Recent
      <select
        disabled={recentFiles.length === 0 || !desktopReady}
        onchange={(event) => {
          const value = (event.currentTarget as HTMLSelectElement).value;
          if (value) dispatch("openRecent", { path: value });
          (event.currentTarget as HTMLSelectElement).value = "";
        }}
      >
        <option value="">Open recent file</option>
        {#each recentFiles as file}
          <option value={file.path}>{file.name}</option>
        {/each}
      </select>
    </label>
  </div>

  <button type="button" class="settings-button" onclick={() => dispatch("settings")}>Settings</button>
</header>
