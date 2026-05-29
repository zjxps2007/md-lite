import { describe, expect, it, vi } from "vitest";
import { upsertRecentFile } from "$lib/stores/documentStore";

describe("upsertRecentFile", () => {
  it("deduplicates by path and moves the latest file to the top", () => {
    vi.spyOn(Date, "now").mockReturnValue(42);

    const files = upsertRecentFile(
      [
        { path: "a.md", name: "a.md", lastOpenedAt: 1, exists: true },
        { path: "b.md", name: "b.md", lastOpenedAt: 2, exists: true },
      ],
      { path: "b.md", name: "b.md" },
      10,
    );

    expect(files).toEqual([
      { path: "b.md", name: "b.md", lastOpenedAt: 42, exists: true },
      { path: "a.md", name: "a.md", lastOpenedAt: 1, exists: true },
    ]);

    vi.restoreAllMocks();
  });

  it("applies the recent files limit", () => {
    const files = upsertRecentFile(
      [
        { path: "a.md", name: "a.md", lastOpenedAt: 1, exists: true },
        { path: "b.md", name: "b.md", lastOpenedAt: 2, exists: true },
      ],
      { path: "c.md", name: "c.md" },
      2,
    );

    expect(files).toHaveLength(2);
    expect(files[0].path).toBe("c.md");
  });
});
