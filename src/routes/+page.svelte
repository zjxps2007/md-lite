<script lang="ts">
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import AppShell from "../components/AppShell.svelte";
  import EditorPane from "../components/EditorPane.svelte";
  import PreviewPane from "../components/PreviewPane.svelte";
  import SettingsDialog from "../components/SettingsDialog.svelte";
  import StatusBar from "../components/StatusBar.svelte";
  import {
    editorState,
    getActiveDocument,
    recentFilesStore,
    upsertRecentFile,
  } from "$lib/stores/documentStore";
  import { mergeSettings, settingsStore } from "$lib/stores/settingsStore";
  import {
    isTauriRuntime,
    loadSettingsFromBackend,
    normalizeCommandError,
    openMarkdownFile,
    saveMarkdownFile,
    saveMarkdownFileAs,
    saveSettingsToBackend,
    toUserMessage,
  } from "$lib/services/tauri";
  import { computeTextStats } from "$lib/utils/textStats";
  import { extractHeadings } from "$lib/utils/headings";
  import type { AppSettings, RecentFile, ViewMode, HeadingItem } from "$lib/types";

  const recentFilesKey = "mdlite.recentFiles";
  const largeFileThreshold = 10 * 1024 * 1024;

  let editorRef: { openFindPanel: () => void; focusEditor: () => void; scrollToLine: (line: number) => void } | null = null;
  let settingsOpen = false;
  let desktopReady = false;
  let statusMessage = "";
  let statusTimer: ReturnType<typeof setTimeout> | null = null;
  let manualPreviewContent = "";
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  $: state = $editorState;
  $: settings = $settingsStore;
  $: activeDoc = getActiveDocument(state);
  $: headings = extractHeadings(activeDoc?.content ?? "");
  $: stats = computeTextStats(activeDoc?.content ?? "");
  $: largeFileMode = (activeDoc?.fileStat?.size ?? activeDoc?.content.length ?? 0) > largeFileThreshold;
  $: if (!largeFileMode) {
    manualPreviewContent = activeDoc?.content ?? "";
  }

  $: if (typeof document !== "undefined") {
    applyTheme(settings.theme);
  }

  $: {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }

    if (settings.autoSave && activeDoc?.modified && activeDoc.path) {
      autosaveTimer = setTimeout(() => {
        void handleSave();
      }, settings.autoSaveDelayMs);
    }
  }

  // Active heading highlighting based on cursor position
  let activeHeadingSlug = "";
  $: {
    const curLine = state.currentCursor.line;
    let found = "";
    for (const h of headings) {
      if (h.line <= curLine) {
        found = h.slug;
      } else {
        break;
      }
    }
    activeHeadingSlug = found;
  }

  function setStatus(message: string) {
    statusMessage = message;
    if (statusTimer) clearTimeout(statusTimer);
    if (message) {
      statusTimer = setTimeout(() => {
        statusMessage = "";
      }, 4200);
    }
  }

  function applyTheme(theme: AppSettings["theme"]) {
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    root.dataset.theme = resolved;
  }

  function loadRecentFiles(): RecentFile[] {
    try {
      return JSON.parse(localStorage.getItem(recentFilesKey) ?? "[]") as RecentFile[];
    } catch {
      return [];
    }
  }

  function persistRecentFiles(files: RecentFile[]) {
    localStorage.setItem(recentFilesKey, JSON.stringify(files));
  }

  function rememberRecent(path: string, name: string) {
    recentFilesStore.update((files) => {
      const next = upsertRecentFile(files, { path, name }, get(settingsStore).recentFilesLimit);
      persistRecentFiles(next);
      return next;
    });
  }

  function hasUnsavedChanges() {
    return Object.values(get(editorState).documents).some((document) => document.modified);
  }

  function confirmDiscardChanges() {
    return !hasUnsavedChanges() || window.confirm("You have unsaved changes. Continue?");
  }

  async function initialize() {
    desktopReady = isTauriRuntime();
    recentFilesStore.set(loadRecentFiles());

    try {
      const persistedSettings = await loadSettingsFromBackend();
      const merged = mergeSettings(persistedSettings);
      settingsStore.set(merged);
      editorState.setViewMode(merged.defaultViewMode);
      applyTheme(merged.theme);
    } catch {
      settingsStore.set(mergeSettings({}));
    }
  }

  function handleNew() {
    editorState.newDocument();
    editorRef?.focusEditor();
    setStatus("New Markdown document created.");
  }

  async function handleOpen(path?: string) {
    if (path) {
      const existing = Object.values(state.documents).find((doc) => doc.path === path);
      if (existing) {
        editorState.setActiveDocument(existing.id);
        setStatus(`Switched to open document: ${existing.fileName}`);
        return;
      }
    }

    try {
      const result = await openMarkdownFile(path ?? null);
      if (!result) return;

      const opened = editorState.openDocument(result);
      rememberRecent(result.path, result.fileName);
      manualPreviewContent = result.content;
      setStatus(`Opened ${opened.fileName}.`);

      if (result.fileStat.size > largeFileThreshold) {
        setStatus("Large file mode enabled. Preview refresh is manual.");
      }
    } catch (error) {
      setStatus(toUserMessage(error));
    }
  }

  async function handleSave() {
    const document = getActiveDocument(get(editorState));
    if (!document) return;

    if (!document.path) {
      await handleSaveAs();
      return;
    }

    try {
      const result = await saveMarkdownFile(
        document.path,
        document.content,
        document.fileStat?.modifiedAt ?? null,
        document.lineEnding,
      );
      editorState.markSaved(result);
      rememberRecent(result.path, result.fileName);
      setStatus(`Saved ${result.fileName}.`);
    } catch (error) {
      const normalized = normalizeCommandError(error);

      if (
        normalized.code === "ExternalModification" &&
        window.confirm("This file changed on disk. Overwrite it with the editor contents?")
      ) {
        const result = await saveMarkdownFile(document.path, document.content, null, document.lineEnding);
        editorState.markSaved(result);
        rememberRecent(result.path, result.fileName);
        setStatus(`Overwrote ${result.fileName}.`);
        return;
      }

      setStatus(toUserMessage(error));
    }
  }

  async function handleSaveAs() {
    const document = getActiveDocument(get(editorState));
    if (!document) return;

    try {
      const result = await saveMarkdownFileAs(document.content, document.lineEnding);
      if (!result) return;

      editorState.markSaved(result);
      rememberRecent(result.path, result.fileName);
      setStatus(`Saved as ${result.fileName}.`);
    } catch (error) {
      setStatus(toUserMessage(error));
    }
  }

  function handleViewMode(mode: ViewMode) {
    editorState.setViewMode(mode);
  }

  function handleContentChange(event: CustomEvent<{ content: string }>) {
    editorState.updateContent(event.detail.content);
  }

  async function handleSettingsSave(event: CustomEvent<{ settings: AppSettings }>) {
    const nextSettings = mergeSettings(event.detail.settings);
    settingsStore.set(nextSettings);
    editorState.setViewMode(nextSettings.defaultViewMode);
    await saveSettingsToBackend(nextSettings);
    settingsOpen = false;
    setStatus("Settings saved.");
  }

  function resolveRelativePath(href: string): string | null {
    if (!activeDoc?.path) return null;
    const separator = activeDoc.path.includes("\\") ? "\\" : "/";
    const base = activeDoc.path.replace(/[\\/][^\\/]*$/, "");
    return `${base}${separator}${href.replace(/\//g, separator)}`;
  }

  function handleHeadingClick(heading: HeadingItem) {
    if (editorRef) {
      editorRef.scrollToLine(heading.line);
    }
    const element = document.getElementById(heading.slug);
    if (element) {
      element.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  onMount(() => {
    void initialize();

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      if (statusTimer) clearTimeout(statusTimer);
      if (autosaveTimer) clearTimeout(autosaveTimer);
    };
  });
</script>

<AppShell theme={settings.theme}>
  <div class="main-layout">
    
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand-container">
        <div class="brand-glyph">M</div>
        <div class="brand-text">
          <span class="brand-title">MdLite</span>
          <span class="brand-subtitle">Markdown Studio</span>
        </div>
      </div>
      
      <div class="sidebar-section">
        <div class="section-header">Actions</div>
        <div class="actions-grid">
          <button type="button" class="action-btn" onclick={handleNew} title="New Document">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>New</span>
          </button>
          
          <button type="button" class="action-btn" onclick={() => handleOpen()} disabled={!desktopReady} title="Open Document">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Open</span>
          </button>
          
          <button type="button" class="action-btn" onclick={handleSave} disabled={!activeDoc} title="Save Document">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Save</span>
          </button>
          
          <button type="button" class="action-btn" onclick={handleSaveAs} disabled={!activeDoc || !desktopReady} title="Save Document As">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span>Save As</span>
          </button>
        </div>
        
        <button type="button" class="action-row-btn" onclick={() => editorRef?.openFindPanel()} disabled={!activeDoc}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Find in Document</span>
        </button>
      </div>

      {#if $recentFilesStore.length > 0}
        <div class="sidebar-section">
          <div class="section-header">Recent Files</div>
          <div class="recent-list">
            {#each $recentFilesStore.slice(0, 5) as file}
              <button type="button" class="recent-item" onclick={() => handleOpen(file.path)} title={file.path}>
                <svg class="file-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span class="file-name">{file.name}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="sidebar-section outline-section">
        <div class="section-header">Outline</div>
        <div class="outline-list">
          {#if headings.length === 0}
            <span class="empty-message">No headings in document</span>
          {:else}
            {#each headings as heading}
              <button
                type="button"
                class="outline-item outline-l{heading.level}"
                class:active={activeHeadingSlug === heading.slug}
                onclick={() => handleHeadingClick(heading)}
              >
                <span class="bullet">•</span> {heading.text}
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <div class="sidebar-footer">
        <button type="button" class="settings-trigger" onclick={() => (settingsOpen = true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Preferences</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Tabs & View Switcher Panel -->
      <div class="tabs-bar">
        <div class="tabs-container">
          {#each Object.values(state.documents) as doc (doc.id)}
            <div
              class="tab-button"
              class:active={doc.id === state.activeDocumentId}
              role="button"
              tabindex="0"
              onclick={() => editorState.setActiveDocument(doc.id)}
              onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  editorState.setActiveDocument(doc.id);
                }
              }}
            >
              <svg class="tab-file-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span class="tab-label">{doc.fileName}</span>
              {#if doc.modified}
                <span class="dirty-indicator"></span>
              {/if}
              <button
                type="button"
                class="tab-close-btn"
                aria-label="Close document"
                onclick={(e) => {
                  e.stopPropagation();
                  editorState.closeDocument(doc.id);
                }}
              >
                &times;
              </button>
            </div>
          {/each}
        </div>

        <div class="view-capsule">
          <button
            type="button"
            class="capsule-btn"
            class:active={state.viewMode === "editor"}
            onclick={() => handleViewMode("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            class="capsule-btn"
            class:active={state.viewMode === "split"}
            onclick={() => handleViewMode("split")}
          >
            Split
          </button>
          <button
            type="button"
            class="capsule-btn"
            class:active={state.viewMode === "preview"}
            onclick={() => handleViewMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>

      <!-- Workspace Area -->
      <main
        class="workspace-container"
        class:editor-only={state.viewMode === "editor"}
        class:preview-only={state.viewMode === "preview"}
        class:split-view={state.viewMode === "split"}
      >
        {#if largeFileMode && state.viewMode !== "editor"}
          <div class="large-file-banner">
            <span>Large file mode: preview updates only when requested.</span>
            <button type="button" onclick={() => (manualPreviewContent = activeDoc?.content ?? "")}>Refresh preview</button>
          </div>
        {/if}

        {#if state.viewMode !== "preview" && activeDoc}
          <div class="pane-wrapper">
            <EditorPane
              bind:this={editorRef}
              content={activeDoc.content}
              {settings}
              {headings}
              wordWrap={state.wordWrap}
              showLineNumbers={state.showLineNumbers}
              on:change={handleContentChange}
              on:cursor={(event) => editorState.setCursor(event.detail)}
              on:save={handleSave}
              on:open={() => handleOpen()}
              on:find={() => editorRef?.openFindPanel()}
              on:togglePreview={() => editorState.setViewMode(state.viewMode === "split" ? "preview" : "split")}
            />
          </div>
        {/if}

        {#if state.viewMode !== "editor" && activeDoc}
          <div class="pane-wrapper">
            <PreviewPane
              content={largeFileMode ? manualPreviewContent : activeDoc.content}
              filePath={activeDoc.path}
              {settings}
              on:unsafeLink={(event) => setStatus(`Blocked unsafe link: ${event.detail.href}`)}
              on:openRelative={(event) => {
                const path = resolveRelativePath(event.detail.href);
                if (path) void handleOpen(path);
              }}
            />
          </div>
        {/if}
      </main>

      <!-- Status Bar -->
      <StatusBar
        document={activeDoc}
        cursor={state.currentCursor}
        {stats}
        viewMode={state.viewMode}
        message={statusMessage}
      />
    </div>
  </div>

  <SettingsDialog
    open={settingsOpen}
    {settings}
    on:close={() => (settingsOpen = false)}
    on:save={handleSettingsSave}
  />
</AppShell>
