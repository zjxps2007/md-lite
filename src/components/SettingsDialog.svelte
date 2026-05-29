<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { DEFAULT_SETTINGS } from "$lib/defaults";
  import type { AppSettings } from "$lib/types";

  export let open = false;
  export let settings: AppSettings = DEFAULT_SETTINGS;

  const dispatch = createEventDispatcher<{
    close: void;
    save: { settings: AppSettings };
  }>();

  let draft: AppSettings = cloneSettings(settings);

  function cloneSettings(value: AppSettings): AppSettings {
    return JSON.parse(JSON.stringify(value)) as AppSettings;
  }

  $: if (open) {
    draft = cloneSettings(settings);
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    dispatch("save", { settings: draft });
  }
</script>

{#if open}
  <div class="dialog-backdrop" role="presentation">
    <button type="button" class="dialog-scrim" aria-label="Close settings" onclick={() => dispatch("close")}></button>
    <form class="settings-dialog" aria-label="MdLite settings" onsubmit={submit}>
      <header>
        <div>
          <p class="eyebrow">Preferences</p>
          <h2>Settings</h2>
        </div>
        <button type="button" class="icon-button" aria-label="Close settings" onclick={() => dispatch("close")}>X</button>
      </header>

      <section class="settings-grid">
        <label>
          Theme
          <select bind:value={draft.theme}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label>
          Font size
          <input type="number" min="11" max="24" bind:value={draft.fontSize} />
        </label>

        <label>
          Tab size
          <input type="number" min="2" max="8" bind:value={draft.tabSize} />
        </label>

        <label>
          Default view
          <select bind:value={draft.defaultViewMode}>
            <option value="editor">Editor</option>
            <option value="split">Split</option>
            <option value="preview">Preview</option>
          </select>
        </label>
      </section>

      <section class="settings-section">
        <h3>Markdown Preview</h3>
        <label><input type="checkbox" bind:checked={draft.markdown.html} /> Allow raw HTML</label>
        <label><input type="checkbox" bind:checked={draft.markdown.breaks} /> Soft line breaks</label>
        <label><input type="checkbox" bind:checked={draft.markdown.linkify} /> Linkify URLs</label>
        <label><input type="checkbox" bind:checked={draft.markdown.typographer} /> Typographer</label>
      </section>

      <section class="settings-section">
        <h3>Markdown Autocomplete</h3>
        <label><input type="checkbox" bind:checked={draft.autocomplete.enabled} /> Enable autocomplete</label>
        <label><input type="checkbox" bind:checked={draft.autocomplete.showOnTyping} /> Show while typing</label>
        <label><input type="checkbox" bind:checked={draft.autocomplete.slashCommands} /> Slash commands</label>
        <label><input type="checkbox" bind:checked={draft.autocomplete.codeFenceLanguages} /> Code fence languages</label>
        <label><input type="checkbox" bind:checked={draft.autocomplete.headingAnchors} /> Heading anchors</label>
        <label><input type="checkbox" bind:checked={draft.autocomplete.acceptWithTab} /> Accept with Tab</label>
      </section>

      <footer>
        <button type="button" class="ghost-button" onclick={() => dispatch("close")}>Cancel</button>
        <button type="submit" class="primary-button">Save settings</button>
      </footer>
    </form>
  </div>
{/if}
