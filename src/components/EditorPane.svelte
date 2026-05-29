<script lang="ts">
  import { autocompletion, completionKeymap, startCompletion } from "@codemirror/autocomplete";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown } from "@codemirror/lang-markdown";
  import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { openSearchPanel, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
  import { EditorState } from "@codemirror/state";
  import { drawSelection, dropCursor, EditorView, keymap, lineNumbers } from "@codemirror/view";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { DEFAULT_SETTINGS } from "$lib/defaults";
  import {
    continueMarkdownBlock,
    markdownCompletionSource,
    wrapSelection,
    wrapSelectionAsLink,
  } from "$lib/editor/markdownAutocomplete";
  import type { AppSettings, HeadingItem } from "$lib/types";

  export let content = "";
  export let settings: AppSettings = DEFAULT_SETTINGS;
  export let headings: HeadingItem[] = [];
  export let wordWrap = true;
  export let showLineNumbers = true;

  const dispatch = createEventDispatcher<{
    change: { content: string };
    cursor: { line: number; column: number };
    save: void;
    open: void;
    find: void;
    togglePreview: void;
  }>();

  let editorHost: HTMLDivElement;
  let view: EditorView | null = null;
  let applyingExternalContent = false;

  function emitCursorPosition(currentView: EditorView) {
    const head = currentView.state.selection.main.head;
    const line = currentView.state.doc.lineAt(head);
    dispatch("cursor", {
      line: line.number,
      column: head - line.from + 1,
    });
  }

  function extensions() {
    return [
      ...(showLineNumbers ? [lineNumbers()] : []),
      history(),
      drawSelection(),
      dropCursor(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown({
        completeHTMLTags: false,
      }),
      highlightSelectionMatches(),
      autocompletion({
        override: [markdownCompletionSource(() => headings, () => settings.autocomplete)],
        activateOnTyping: settings.autocomplete.showOnTyping,
      }),
      EditorState.tabSize.of(settings.tabSize),
      ...(wordWrap ? [EditorView.lineWrapping] : []),
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            dispatch("save");
            return true;
          },
        },
        {
          key: "Mod-o",
          preventDefault: true,
          run: () => {
            dispatch("open");
            return true;
          },
        },
        {
          key: "Mod-p",
          preventDefault: true,
          run: () => {
            dispatch("togglePreview");
            return true;
          },
        },
        {
          key: "Mod-Shift-p",
          preventDefault: true,
          run: (currentView) => startCompletion(currentView),
        },
        {
          key: "Mod-b",
          preventDefault: true,
          run: (currentView) => wrapSelection(currentView, "**"),
        },
        {
          key: "Mod-i",
          preventDefault: true,
          run: (currentView) => wrapSelection(currentView, "_"),
        },
        {
          key: "Mod-e",
          preventDefault: true,
          run: (currentView) => wrapSelection(currentView, "`"),
        },
        {
          key: "Mod-k",
          preventDefault: true,
          run: wrapSelectionAsLink,
        },
        {
          key: "Enter",
          run: continueMarkdownBlock,
        },
        ...completionKeymap,
        ...searchKeymap,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !applyingExternalContent) {
          dispatch("change", { content: update.state.doc.toString() });
        }

        if (update.docChanged || update.selectionSet) {
          emitCursorPosition(update.view);
        }
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          background: "transparent",
          color: "var(--editor-ink)",
          fontSize: `${settings.fontSize}px`,
        },
        ".cm-content": {
          minHeight: "100%",
          padding: "22px 24px 80px",
          fontFamily: "var(--font-mono)",
          caretColor: "var(--accent)",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "var(--ink) !important",
        },
        ".cm-scroller": {
          fontFamily: "var(--font-mono)",
        },
        ".cm-gutters": {
          background: "var(--panel)",
          color: "var(--ink-muted)",
          borderRight: "1px solid var(--border)",
        },
        ".cm-activeLineGutter": {
          background: "var(--accent-soft)",
          color: "var(--accent)",
        },
        ".cm-selectionBackground": {
          background: "var(--selection) !important",
        },
        ".cm-tooltip": {
          background: "var(--surface-strong)",
          color: "var(--ink)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        },
        ".cm-tooltip-autocomplete > ul": {
          fontFamily: "var(--font-sans)",
          maxHeight: "280px",
          background: "var(--surface-strong)",
          color: "var(--ink)",
        },
        ".cm-tooltip-autocomplete ul li": {
          padding: "6px 12px",
          color: "var(--ink)",
        },
        ".cm-tooltip-autocomplete ul li[aria-selected]": {
          background: "var(--accent) !important",
          color: "white !important",
        },
        ".cm-search": {
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "10px",
        },
        ".cm-search input": {
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "6px 8px",
          background: "var(--surface-strong)",
          color: "var(--ink)",
        },
        ".cm-search button": {
          border: "1px solid var(--border)",
          borderRadius: "10px",
          background: "var(--panel)",
          padding: "6px 10px",
          color: "var(--ink)",
        },
      }),
    ];
  }

  export function focusEditor() {
    view?.focus();
  }

  export function openFindPanel() {
    if (view) openSearchPanel(view);
  }

  export function scrollToLine(lineNumber: number) {
    if (!view) return;
    try {
      const line = view.state.doc.line(lineNumber);
      view.dispatch({
        selection: { anchor: line.from, head: line.from },
        effects: EditorView.scrollIntoView(line.from, { y: "center" }),
      });
      view.focus();
    } catch (e) {
      console.error(e);
    }
  }

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: extensions(),
      }),
      parent: editorHost,
    });

    emitCursorPosition(view);
  });

  $: if (view && content !== view.state.doc.toString()) {
    applyingExternalContent = true;
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content,
      },
    });
    applyingExternalContent = false;
  }

  onDestroy(() => {
    view?.destroy();
    view = null;
  });
</script>

<section class="editor-pane" aria-label="Markdown editor">
  <div bind:this={editorHost} class="editor-host"></div>
</section>
