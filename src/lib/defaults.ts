import type { AppSettings } from "$lib/types";

export const DEFAULT_MARKDOWN = `# Welcome to MdLite

MdLite is a lightweight local Markdown reader and editor.

## Try the MVP

- Edit this document on the left
- Preview the rendered result on the right
- Press \`Ctrl+Space\` or type \`/\` for Markdown snippets
- Use \`Ctrl+S\` to save

## Safety check

Raw HTML is disabled by default, and preview output is sanitized before it reaches the page.

\`\`\`ts
export const lightweight = true;
\`\`\`
`;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  fontFamily: "Atkinson Hyperlegible",
  fontSize: 15,
  tabSize: 2,
  autoSave: false,
  autoSaveDelayMs: 1200,
  defaultViewMode: "split",
  recentFilesLimit: 20,
  markdown: {
    html: false,
    breaks: false,
    linkify: true,
    typographer: false,
    gfm: true,
    mermaid: false,
  },
  autocomplete: {
    enabled: true,
    showOnTyping: true,
    slashCommands: true,
    codeFenceLanguages: true,
    headingAnchors: true,
    filePaths: false,
    frontMatter: false,
    mermaid: false,
    maxSuggestions: 12,
    acceptWithEnter: true,
    acceptWithTab: false,
  },
};
