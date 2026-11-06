import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import {
  docsRoot,
  idFromAbsPath,
  listMarkdownFiles,
  rewriteHtmlHrefs,
  rewriteMarkdownBody,
  splitMarkdown,
} from "../lib/repo-docs.js";

export function repoDocsLoader() {
  return {
    name: "repo-docs",
    async load({ store, parseData, renderMarkdown, generateDigest, watcher }) {
      store.clear();
      const files = await listMarkdownFiles();
      watcher?.add(files);

      for (const absPath of files) {
        const id = idFromAbsPath(absPath);
        if (!id) continue;
        const raw = await readFile(absPath, "utf8");
        const { title, body } = splitMarkdown(raw);
        const rewritten = rewriteMarkdownBody(body, absPath);
        const data = await parseData({
          id,
          data: { title },
        });
        const entry = {
          id,
          data,
          body: rewritten,
          filePath: relative(docsRoot, absPath),
          digest: generateDigest(raw),
        };
        if (typeof renderMarkdown === "function") {
          const rendered = await renderMarkdown(rewritten);
          if (rendered?.html) {
            rendered.html = rewriteHtmlHrefs(rendered.html, absPath);
          }
          entry.rendered = rendered;
        }
        store.set(entry);
      }
    },
  };
}
