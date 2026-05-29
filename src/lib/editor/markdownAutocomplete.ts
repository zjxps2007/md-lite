import {
  snippetCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { EditorSelection } from "@codemirror/state";
import type { Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { AutocompleteSettings, HeadingItem } from "$lib/types";

export type MarkdownTrigger =
  | "slash"
  | "heading"
  | "list"
  | "task"
  | "quote"
  | "code"
  | "codeFenceLanguage"
  | "link"
  | "image"
  | "table"
  | "anchor"
  | "word";

const codeFenceLanguages = [
  "text",
  "bash",
  "sh",
  "powershell",
  "json",
  "yaml",
  "toml",
  "html",
  "css",
  "javascript",
  "typescript",
  "svelte",
  "rust",
  "python",
  "go",
  "java",
  "csharp",
  "sql",
  "markdown",
];

const baseSnippets: Completion[] = [
  snippetCompletion("# ${title}", {
    label: "Heading 1",
    type: "keyword",
    detail: "# title",
    info: "Insert a first-level heading.",
  }),
  snippetCompletion("## ${title}", {
    label: "Heading 2",
    type: "keyword",
    detail: "## title",
    info: "Insert a second-level heading.",
  }),
  snippetCompletion("- ${item}", {
    label: "Bullet list",
    type: "keyword",
    detail: "- item",
  }),
  snippetCompletion("- [ ] ${task}", {
    label: "Task list",
    type: "keyword",
    detail: "- [ ] task",
  }),
  snippetCompletion("> ${quote}", {
    label: "Blockquote",
    type: "keyword",
    detail: "> quote",
  }),
  snippetCompletion("[${text}](${url})", {
    label: "Link",
    type: "function",
    detail: "[text](url)",
  }),
  snippetCompletion("![${alt}](${path})", {
    label: "Image",
    type: "function",
    detail: "![alt](path)",
  }),
  snippetCompletion("```${language}\n${code}\n```", {
    label: "Code block",
    type: "class",
    detail: "fenced code",
  }),
  snippetCompletion("| ${Column 1} | ${Column 2} |\n| --- | --- |\n| ${Value 1} | ${Value 2} |", {
    label: "Table",
    type: "class",
    detail: "2-column table",
  }),
  snippetCompletion("---", {
    label: "Horizontal rule",
    type: "keyword",
    detail: "---",
  }),
];

const slashSnippets: Completion[] = [
  snippetCompletion("# ${title}", { label: "/h1", type: "keyword", detail: "Heading 1" }),
  snippetCompletion("## ${title}", { label: "/h2", type: "keyword", detail: "Heading 2" }),
  snippetCompletion("- ${item}", { label: "/list", type: "keyword", detail: "Bullet list" }),
  snippetCompletion("- [ ] ${task}", { label: "/task", type: "keyword", detail: "Task list" }),
  snippetCompletion("> ${quote}", { label: "/quote", type: "keyword", detail: "Blockquote" }),
  snippetCompletion("[${text}](${url})", { label: "/link", type: "function", detail: "Link" }),
  snippetCompletion("![${alt}](${path})", { label: "/image", type: "function", detail: "Image" }),
  snippetCompletion("```${language}\n${code}\n```", { label: "/code", type: "class", detail: "Code block" }),
  snippetCompletion("| ${Column 1} | ${Column 2} |\n| --- | --- |\n| ${Value 1} | ${Value 2} |", {
    label: "/table",
    type: "class",
    detail: "Table",
  }),
];

export function isInsideCodeFence(doc: Text, position: number): boolean {
  const before = doc.sliceString(0, position);
  const fences = before.split(/\r?\n/).filter((line) => /^\s*```/.test(line)).length;
  return fences % 2 === 1;
}

export function detectMarkdownTrigger(linePrefix: string): MarkdownTrigger | null {
  const trimmed = linePrefix.trimStart();

  if (/\/[\p{L}\p{N}_-]*$/u.test(trimmed)) return "slash";
  if (/```[\w-]*$/.test(trimmed)) return "codeFenceLanguage";
  if (/\]\(#[\p{L}\p{N}_-]*$/u.test(trimmed)) return "anchor";
  if (/^#{1,6}\s?[\p{L}\p{N}_-]*$/u.test(trimmed) || linePrefix.endsWith("#")) return "heading";
  if (/^[-*+]\s?$/.test(trimmed)) return "list";
  if (/^[-*+]\s+\[[ xX]?\]?\s?$/.test(trimmed)) return "task";
  if (/^>\s?$/.test(trimmed)) return "quote";
  if (/!\[[^\]]*$/.test(trimmed)) return "image";
  if (/\[[^\]]*$/.test(trimmed)) return "link";
  if (/`{1,3}[\w-]*$/.test(trimmed)) return "code";
  if (/table$/i.test(trimmed)) return "table";
  if (/[\p{L}\p{N}_-]{2,}$/u.test(trimmed)) return "word";

  return null;
}

function completionWord(context: CompletionContext) {
  return context.matchBefore(/[^\s]*/);
}

function filterOptions(options: Completion[], prefix: string): Completion[] {
  const normalized = prefix.toLowerCase().replace(/^\/+/, "");
  if (!normalized) return options;

  return options.filter((option) => {
    const label = option.label.toLowerCase().replace(/^\/+/, "");
    const detail = option.detail?.toLowerCase() ?? "";
    return label.includes(normalized) || detail.includes(normalized);
  });
}

function languageCompletions(context: CompletionContext, linePrefix: string, settings: AutocompleteSettings) {
  if (!settings.codeFenceLanguages) return null;

  const match = linePrefix.match(/```([\w-]*)$/);
  if (!match) return null;

  const from = context.pos - match[1].length;
  const options = codeFenceLanguages.map((language) => ({
    label: language,
    type: "keyword",
    detail: "code fence language",
    apply: language,
  }));

  return {
    from,
    options: filterOptions(options, match[1]).slice(0, settings.maxSuggestions),
    validFor: /^[\w-]*$/,
  };
}

function anchorCompletions(
  context: CompletionContext,
  linePrefix: string,
  headings: HeadingItem[],
  settings: AutocompleteSettings,
): CompletionResult | null {
  if (!settings.headingAnchors) return null;

  const match = linePrefix.match(/\]\(#([\p{L}\p{N}_-]*)$/u);
  if (!match) return null;

  const from = context.pos - match[1].length;
  const options = headings.map((heading) => ({
    label: `#${heading.slug}`,
    type: "constant",
    detail: heading.text,
    apply: heading.slug,
  }));

  return {
    from,
    options: filterOptions(options, match[1]).slice(0, settings.maxSuggestions),
    validFor: /^[\p{L}\p{N}_-]*$/u,
  };
}

export function markdownCompletionSource(
  getHeadings: () => HeadingItem[],
  getSettings: () => AutocompleteSettings,
) {
  return (context: CompletionContext): CompletionResult | null => {
    const settings = getSettings();
    if (!settings.enabled) return null;

    const line = context.state.doc.lineAt(context.pos);
    const linePrefix = line.text.slice(0, context.pos - line.from);
    const trigger = detectMarkdownTrigger(linePrefix);

    if (!context.explicit && (!settings.showOnTyping || !trigger)) return null;

    const languageResult = languageCompletions(context, linePrefix, settings);
    if (languageResult) return languageResult;

    if (isInsideCodeFence(context.state.doc, context.pos) && trigger !== "codeFenceLanguage") {
      return null;
    }

    const anchorResult = anchorCompletions(context, linePrefix, getHeadings(), settings);
    if (anchorResult) return anchorResult;

    const word = completionWord(context);
    const from = word?.from ?? context.pos;
    const prefix = context.state.sliceDoc(from, context.pos);
    const options = trigger === "slash" && settings.slashCommands ? slashSnippets : baseSnippets;
    const filtered = filterOptions(options, trigger === "word" || trigger === "slash" ? prefix : "");

    return {
      from,
      options: filtered.slice(0, settings.maxSuggestions),
      validFor: /^[^\s]*$/,
    };
  };
}

export function wrapSelection(view: EditorView, before: string, after = before): boolean {
  const transaction = view.state.changeByRange((range) => {
    const selected = view.state.sliceDoc(range.from, range.to);
    const inserted = `${before}${selected}${after}`;
    const anchor = range.from + before.length;
    const head = anchor + selected.length;

    return {
      changes: { from: range.from, to: range.to, insert: inserted },
      range: selected
        ? EditorSelection.range(anchor, head)
        : EditorSelection.cursor(anchor),
    };
  });

  view.dispatch(transaction);
  return true;
}

export function wrapSelectionAsLink(view: EditorView): boolean {
  return wrapSelection(view, "[", "](url)");
}

export function continueMarkdownBlock(view: EditorView): boolean {
  const position = view.state.selection.main.head;
  const line = view.state.doc.lineAt(position);
  const before = line.text.slice(0, position - line.from);

  if (position !== line.to) return false;

  if (/^\s*(?:[-*+]|\d+\.)\s+(?:\[[ xX]\]\s*)?$/.test(line.text)) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
    });
    return true;
  }

  const task = before.match(/^(\s*)([-*+])\s+\[[ xX]\]\s+.+/);
  if (task) {
    const nextPrefix = `${task[1]}${task[2]} [ ] `;
    view.dispatch({
      changes: { from: position, insert: `\n${nextPrefix}` },
      selection: { anchor: position + nextPrefix.length + 1 },
    });
    return true;
  }

  const unordered = before.match(/^(\s*)([-*+])\s+.+/);
  if (unordered) {
    const nextPrefix = `${unordered[1]}${unordered[2]} `;
    view.dispatch({
      changes: { from: position, insert: `\n${nextPrefix}` },
      selection: { anchor: position + nextPrefix.length + 1 },
    });
    return true;
  }

  const ordered = before.match(/^(\s*)(\d+)\.\s+.+/);
  if (ordered) {
    const nextPrefix = `${ordered[1]}${Number(ordered[2]) + 1}. `;
    view.dispatch({
      changes: { from: position, insert: `\n${nextPrefix}` },
      selection: { anchor: position + nextPrefix.length + 1 },
    });
    return true;
  }

  const quote = before.match(/^(\s*>\s?).+/);
  if (quote) {
    view.dispatch({
      changes: { from: position, insert: `\n${quote[1]}` },
      selection: { anchor: position + quote[1].length + 1 },
    });
    return true;
  }

  return false;
}
