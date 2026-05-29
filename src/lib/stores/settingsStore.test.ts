import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "$lib/defaults";
import { mergeSettings } from "$lib/stores/settingsStore";

describe("mergeSettings", () => {
  it("keeps defaults when config is missing", () => {
    expect(mergeSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("deep merges nested markdown and autocomplete settings", () => {
    const merged = mergeSettings({
      theme: "dark",
      markdown: { breaks: true },
      autocomplete: { enabled: false },
    });

    expect(merged.theme).toBe("dark");
    expect(merged.markdown.breaks).toBe(true);
    expect(merged.markdown.html).toBe(DEFAULT_SETTINGS.markdown.html);
    expect(merged.autocomplete.enabled).toBe(false);
    expect(merged.autocomplete.slashCommands).toBe(DEFAULT_SETTINGS.autocomplete.slashCommands);
  });

  it("falls back to defaults for invalid config", () => {
    const merged = mergeSettings({
      fontSize: 1000,
    });

    expect(merged).toEqual(DEFAULT_SETTINGS);
  });
});
