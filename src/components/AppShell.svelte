<script lang="ts">
  import type { ThemePreference } from "$lib/types";

  export let theme: ThemePreference = "system";
</script>

<div class="app-shell" data-theme-preference={theme}>
  <slot />
</div>
