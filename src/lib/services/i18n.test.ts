import { describe, expect, it } from "vitest";
import { getTranslator, translations } from "./i18n";
import { mergeSettings } from "$lib/stores/settingsStore";
import { DEFAULT_SETTINGS } from "$lib/defaults";

describe("i18n translations and settings merge", () => {
  it("translates ko and en keys correctly", () => {
    const tKo = getTranslator("ko");
    const tEn = getTranslator("en");

    expect(tKo("preferences")).toBe("환경설정");
    expect(tEn("preferences")).toBe("Preferences");
  });

  it("falls back to Korean translation for missing or invalid language keys", () => {
    // Cast to any to test fallback behavior
    const tFallback = getTranslator("invalid" as any);
    expect(tFallback("preferences")).toBe("환경설정");
  });

  it("has matching translation keys in both ko and en maps", () => {
    const koKeys = Object.keys(translations.ko);
    const enKeys = Object.keys(translations.en);

    expect(koKeys.sort()).toEqual(enKeys.sort());
  });

  it("correctly merges settings with language preferences", () => {
    const mergedKo = mergeSettings({ language: "ko" });
    const mergedEn = mergeSettings({ language: "en" });

    expect(mergedKo.language).toBe("ko");
    expect(mergedEn.language).toBe("en");
    expect(DEFAULT_SETTINGS.language).toBe("en");
  });
});
