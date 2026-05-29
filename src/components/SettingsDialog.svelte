<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { DEFAULT_SETTINGS } from "$lib/defaults";
  import type { AppSettings } from "$lib/types";
  import { getTranslator } from "$lib/services/i18n";

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

  $: t = getTranslator(draft.language);

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
          <p class="eyebrow">{t("preferences")}</p>
          <h2>{t("settings")}</h2>
        </div>
        <button type="button" class="icon-button" aria-label="Close settings" onclick={() => dispatch("close")}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <section class="settings-grid">
        <label>
          <span class="setting-label">{t("theme")}</span>
          <select bind:value={draft.theme}>
            <option value="system">{t("themeSystem")}</option>
            <option value="light">{t("themeLight")}</option>
            <option value="dark">{t("themeDark")}</option>
          </select>
        </label>

        <label>
          <span class="setting-label">{t("language")}</span>
          <select bind:value={draft.language}>
            <option value="ko">한국어 (Korean)</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          <span class="setting-label">{t("fontSize")}</span>
          <input type="number" min="11" max="24" bind:value={draft.fontSize} />
        </label>

        <label>
          <span class="setting-label">{t("tabSize")}</span>
          <input type="number" min="2" max="8" bind:value={draft.tabSize} />
        </label>

        <label>
          <span class="setting-label">{t("defaultView")}</span>
          <select bind:value={draft.defaultViewMode}>
            <option value="editor">{t("viewEditor")}</option>
            <option value="split">{t("viewSplit")}</option>
            <option value="preview">{t("viewPreview")}</option>
          </select>
        </label>
      </section>

      <section class="settings-section">
        <h3>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          {t("markdownPreview")}
        </h3>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.markdown.html} />
            <span class="toggle-slider"></span>
          </span>
          {t("allowHtml")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.markdown.breaks} />
            <span class="toggle-slider"></span>
          </span>
          {t("softBreaks")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.markdown.linkify} />
            <span class="toggle-slider"></span>
          </span>
          {t("linkify")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.markdown.typographer} />
            <span class="toggle-slider"></span>
          </span>
          {t("typographer")}
        </label>
      </section>

      <section class="settings-section">
        <h3>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          {t("markdownAutocomplete")}
        </h3>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.enabled} />
            <span class="toggle-slider"></span>
          </span>
          {t("enableAutocomplete")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.showOnTyping} />
            <span class="toggle-slider"></span>
          </span>
          {t("showOnTyping")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.slashCommands} />
            <span class="toggle-slider"></span>
          </span>
          {t("slashCommands")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.codeFenceLanguages} />
            <span class="toggle-slider"></span>
          </span>
          {t("codeFenceLanguages")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.headingAnchors} />
            <span class="toggle-slider"></span>
          </span>
          {t("headingAnchors")}
        </label>
        <label class="toggle-label">
          <span class="toggle-switch">
            <input type="checkbox" bind:checked={draft.autocomplete.acceptWithTab} />
            <span class="toggle-slider"></span>
          </span>
          {t("acceptWithTab")}
        </label>
      </section>

      <footer>
        <button type="button" class="ghost-button" onclick={() => dispatch("close")}>{t("cancel")}</button>
        <button type="submit" class="primary-button">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          {t("saveSettings")}
        </button>
      </footer>
    </form>
  </div>
{/if}
