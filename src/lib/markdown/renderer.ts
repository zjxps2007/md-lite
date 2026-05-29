import { convertFileSrc } from "@tauri-apps/api/core";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/common";
import MarkdownIt from "markdown-it";
import { slugifyHeading } from "$lib/utils/headings";
import type { AppSettings } from "$lib/types";

export interface MarkdownRenderOptions {
  filePath?: string | null;
}

const allowedProtocols = ["http:", "https:", "mailto:"];

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("./") || trimmed.startsWith("../")) return true;

  try {
    const parsed = new URL(trimmed);
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return !/^\s*(javascript|data|file|vbscript):/i.test(trimmed);
  }
}

function isRelativeAssetPath(src: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(src) && !src.startsWith("/") && !src.startsWith("#");
}

function dirname(path: string): string {
  return path.replace(/[\\/][^\\/]*$/, "");
}

function resolveRelativeAsset(documentPath: string | null | undefined, src: string): string {
  if (!documentPath || !isRelativeAssetPath(src)) return src;

  const base = dirname(documentPath);
  const separator = documentPath.includes("\\") ? "\\" : "/";
  const resolved = `${base}${separator}${src.replace(/\//g, separator)}`;

  try {
    return convertFileSrc(resolved);
  } catch {
    return resolved;
  }
}

function highlightCode(code: string, language: string): string {
  if (language && hljs.getLanguage(language)) {
    try {
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    } catch {
      return MarkdownIt().utils.escapeHtml(code);
    }
  }

  return MarkdownIt().utils.escapeHtml(code);
}

export function renderMarkdownToHtml(
  markdown: string,
  settings: AppSettings,
  options: MarkdownRenderOptions = {},
): string {
  const md = new MarkdownIt({
    html: settings.markdown.html,
    breaks: settings.markdown.breaks,
    linkify: settings.markdown.linkify,
    typographer: settings.markdown.typographer,
    highlight: (code, language) =>
      `<pre class="hljs"><code>${highlightCode(code, language.trim())}</code></pre>`,
  });

  md.validateLink = isSafeUrl;

  const defaultLinkOpen =
    md.renderer.rules.link_open ??
    ((tokens, index, rendererOptions, env, self) => self.renderToken(tokens, index, rendererOptions));

  md.renderer.rules.link_open = (tokens, index, rendererOptions, env, self) => {
    const token = tokens[index];
    const href = token.attrGet("href");

    if (href && /^(https?:|mailto:)/i.test(href)) {
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noreferrer noopener");
    }

    return defaultLinkOpen(tokens, index, rendererOptions, env, self);
  };

  const defaultHeadingOpen =
    md.renderer.rules.heading_open ??
    ((tokens, index, rendererOptions, env, self) => self.renderToken(tokens, index, rendererOptions));

  md.renderer.rules.heading_open = (tokens, index, rendererOptions, env, self) => {
    const inlineToken = tokens[index + 1];
    if (inlineToken?.content) {
      tokens[index].attrSet("id", slugifyHeading(inlineToken.content));
    }

    return defaultHeadingOpen(tokens, index, rendererOptions, env, self);
  };

  const defaultImage =
    md.renderer.rules.image ??
    ((tokens, index, rendererOptions, env, self) => self.renderToken(tokens, index, rendererOptions));

  md.renderer.rules.image = (tokens, index, rendererOptions, env, self) => {
    const token = tokens[index];
    const src = token.attrGet("src");

    if (src && isSafeUrl(src)) {
      token.attrSet("src", resolveRelativeAsset(options.filePath, src));
      token.attrSet("loading", "lazy");
    }

    return defaultImage(tokens, index, rendererOptions, env, self);
  };

  const raw = md.render(markdown);

  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "class", "id", "loading", "checked", "disabled"],
  });
}
