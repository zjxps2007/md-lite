import { describe, expect, it } from "vitest";
import { detectMarkdownTrigger } from "$lib/editor/markdownAutocomplete";

describe("detectMarkdownTrigger", () => {
  it("detects slash commands", () => {
    expect(detectMarkdownTrigger("/")).toBe("slash");
    expect(detectMarkdownTrigger("/table")).toBe("slash");
  });

  it("detects Markdown syntax entry points", () => {
    expect(detectMarkdownTrigger("#")).toBe("heading");
    expect(detectMarkdownTrigger("- ")).toBe("list");
    expect(detectMarkdownTrigger("- [ ] ")).toBe("task");
    expect(detectMarkdownTrigger("> ")).toBe("quote");
    expect(detectMarkdownTrigger("![")).toBe("image");
    expect(detectMarkdownTrigger("[")).toBe("link");
    expect(detectMarkdownTrigger("```ts")).toBe("codeFenceLanguage");
  });

  it("detects heading anchors inside links", () => {
    expect(detectMarkdownTrigger("[Jump](#intro")).toBe("anchor");
  });

  it("does not interrupt ordinary prose", () => {
    expect(detectMarkdownTrigger("a")).toBe(null);
    expect(detectMarkdownTrigger("today is a nice day ")).toBe(null);
  });
});
