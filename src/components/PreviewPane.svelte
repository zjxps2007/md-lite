<script lang="ts">
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { createEventDispatcher } from "svelte";
  import { DEFAULT_SETTINGS } from "$lib/defaults";
  import { isSafeUrl, renderMarkdownToHtml } from "$lib/markdown/renderer";
  import type { AppSettings } from "$lib/types";

  export let content = "";
  export let filePath: string | null = null;
  export let settings: AppSettings = DEFAULT_SETTINGS;

  const dispatch = createEventDispatcher<{
    unsafeLink: { href: string };
    openRelative: { href: string };
  }>();

  $: html = renderMarkdownToHtml(content, settings, { filePath });

  async function handleClick(event: MouseEvent) {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (!isSafeUrl(href)) {
      event.preventDefault();
      dispatch("unsafeLink", { href });
      return;
    }

    if (href.startsWith("#")) {
      event.preventDefault();
      document.getElementById(href.slice(1))?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }

    if (href.startsWith("./") || href.startsWith("../")) {
      event.preventDefault();
      dispatch("openRelative", { href });
      return;
    }

    if (/^(https?:|mailto:)/i.test(href)) {
      event.preventDefault();
      try {
        await openUrl(href);
      } catch {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<section class="preview-pane" aria-label="Markdown preview" onclick={handleClick}>
  <article class="markdown-body">
    {@html html}
  </article>
</section>
