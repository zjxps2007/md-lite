import type { HeadingItem } from "$lib/types";

const headingPattern = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

export function slugifyHeading(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\](){}.!?:;"']/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "section";
}

export function extractHeadings(content: string): HeadingItem[] {
  return content.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(headingPattern);
    if (!match) return [];

    return [
      {
        level: match[1].length as HeadingItem["level"],
        text: match[2].trim(),
        line: index + 1,
        slug: slugifyHeading(match[2]),
      },
    ];
  });
}
