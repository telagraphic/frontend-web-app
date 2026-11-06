import { resolve } from "node:path";
import { visit } from "unist-util-visit";
import { rewriteMarkdownHref } from "../lib/repo-docs.js";

export function remarkRepoLinks() {
  return (tree, file) => {
    const fromAbsPath = resolve(
      file.history?.[0] ?? file.path ?? file.filename ?? "",
    );
    if (!fromAbsPath || fromAbsPath === ".") return;

    visit(tree, "link", (node) => {
      if (typeof node.url !== "string") return;
      node.url = rewriteMarkdownHref(node.url, fromAbsPath);
    });
  };
}

export function remarkStripTitleHeading() {
  return (tree) => {
    const index = tree.children.findIndex(
      (node) => node.type === "heading" && node.depth === 1,
    );
    if (index !== -1) tree.children.splice(index, 1);
  };
}
