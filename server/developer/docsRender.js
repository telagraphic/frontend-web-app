import { Marked } from "marked";
import { rewriteDocsMarkdown } from "./docsCatalog.js";

const context = {
  headings: [],
  used: new Set(),
};

const marked = new Marked({ gfm: true, breaks: false });
marked.use({
  renderer: {
    heading(token) {
      const html = this.parser.parseInline(token.tokens);
      const plain = plainText(html);
      const id = uniqueSlug(plain, context.used);
      if (token.depth >= 2 && token.depth <= 3) {
        context.headings.push({ id, text: plain, level: token.depth });
      }
      return `<h${token.depth} id="${escapeHtml(id)}">${html}</h${token.depth}>\n`;
    },
    html(token) {
      if (token.text.trim().startsWith("<!--")) return "";
      return escapeHtml(token.text);
    },
    code({ text, lang }) {
      const language = /^[\w-]+$/.test(lang ?? "")
        ? ` class="language-${lang}"`
        : "";
      return `<div class="docs-code"><button type="button" class="docs-code__copy" data-docs-copy>Copy</button><pre><code${language}>${escapeHtml(text)}</code></pre></div>\n`;
    },
  },
});

export function renderDocsMarkdown(body, fromAbsPath) {
  context.headings = [];
  context.used = new Set();
  const html = marked.parse(rewriteDocsMarkdown(body, fromAbsPath), {
    async: false,
  });
  return {
    html: wrapTables(html),
    headings: context.headings,
    text: plainText(html),
  };
}

function wrapTables(html) {
  return html
    .replaceAll("<table>", '<div class="docs-table"><table>')
    .replaceAll("</table>", "</table></div>");
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plainText(html) {
  return decodeEntities(
    String(html)
      .replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function uniqueSlug(text, used) {
  const base =
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "section";
  let slug = base;
  let count = 0;
  while (used.has(slug)) {
    count += 1;
    slug = `${base}-${count}`;
  }
  used.add(slug);
  return slug;
}
