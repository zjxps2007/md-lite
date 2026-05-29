import type { TextStats } from "$lib/types";

export function computeTextStats(content: string): TextStats {
  const normalized = content.replace(/\r\n/g, "\n");
  const words = normalized.match(/[\p{L}\p{N}_]+/gu)?.length ?? 0;

  return {
    words,
    characters: Array.from(normalized).length,
    lines: normalized.length === 0 ? 1 : normalized.split("\n").length,
  };
}
