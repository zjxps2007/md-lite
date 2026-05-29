// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "$lib/defaults";
import { isSafeUrl, renderMarkdownToHtml } from "$lib/markdown/renderer";

describe("renderMarkdownToHtml", () => {
  it("removes script tags from preview html", () => {
    const html = renderMarkdownToHtml("# Safe\n<script>alert(1)</script>", DEFAULT_SETTINGS);

    expect(html).not.toContain("<script");
    expect(html).toContain("<h1");
  });

  it("blocks javascript links", () => {
    const html = renderMarkdownToHtml("[bad](javascript:alert(1))", DEFAULT_SETTINGS);

    expect(html).not.toContain('href="javascript:');
  });

  it("keeps safe external links and marks them for external opening", () => {
    const html = renderMarkdownToHtml("[OpenAI](https://openai.com)", DEFAULT_SETTINGS);

    expect(html).toContain('href="https://openai.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noreferrer");
  });
});

describe("isSafeUrl", () => {
  it("allows anchors and relative links", () => {
    expect(isSafeUrl("#intro")).toBe(true);
    expect(isSafeUrl("./guide.md")).toBe(true);
    expect(isSafeUrl("../assets/image.png")).toBe(true);
  });

  it("rejects dangerous protocols", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,boom")).toBe(false);
    expect(isSafeUrl("file:///secret")).toBe(false);
  });
});
