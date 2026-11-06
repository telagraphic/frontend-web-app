import { readdirSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const docsRoot = resolve(here, "../..");
export const repoRoot = resolve(docsRoot, "..");

const SKILL_ORDER = [
  "add-page",
  "write-css",
  "add-gsap-transition",
  "adapt-layout-component",
  "gsap-experiment",
  "check-performance",
  "write-js",
  "add-module",
  "add-service",
  "add-view-transition",
  "add-effect",
  "write-test",
  "add-custom-element",
  "add-integration",
];

export async function listMarkdownFiles() {
  const files = [
    join(repoRoot, "AGENTS.md"),
    join(repoRoot, "GLOSSARY.md"),
    join(repoRoot, "documentation/REMAINING_REVIEWS.md"),
  ];

  for (const name of await readdir(join(repoRoot, "documentation/reference"))) {
    if (name.endsWith(".md")) {
      files.push(join(repoRoot, "documentation/reference", name));
    }
  }

  for (const name of await readdir(join(repoRoot, "documentation/adr"))) {
    if (name.endsWith(".md")) {
      files.push(join(repoRoot, "documentation/adr", name));
    }
  }

  const skillRoot = join(repoRoot, ".cursor/skills");
  for (const entry of await readdir(skillRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(skillRoot, entry.name);
    for (const name of await readdir(dir)) {
      if (name.endsWith(".md")) files.push(join(dir, name));
    }
  }

  return files;
}

export function repoPath(absPath) {
  return relative(repoRoot, absPath).split(sep).join("/");
}

export function idFromRepoPath(rel) {
  const normalized = rel.split(sep).join("/");
  if (normalized === "AGENTS.md") return "index";
  if (normalized === "GLOSSARY.md") return "glossary";
  if (normalized === "documentation/REMAINING_REVIEWS.md") {
    return "start/remaining-reviews";
  }

  const reference = normalized.match(/^documentation\/reference\/(.+)\.md$/);
  if (reference) return `reference/${slugStem(reference[1])}`;

  const adr = normalized.match(/^documentation\/adr\/(.+)\.md$/);
  if (adr) return `decisions/${slugStem(adr[1])}`;

  const skill = normalized.match(/^\.cursor\/skills\/([^/]+)\/SKILL\.md$/);
  if (skill) return `skills/${skill[1]}`;

  const extra = normalized.match(/^\.cursor\/skills\/([^/]+)\/(.+)\.md$/);
  if (extra) return `skills/${extra[1]}/${slugStem(extra[2])}`;

  return null;
}

export function idFromAbsPath(absPath) {
  return idFromRepoPath(repoPath(absPath));
}

export function slugFromId(id) {
  if (id === "index") return "/";
  return `/${id}/`;
}

export function splitMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const body = match ? match[2] : raw;
  const heading = body.match(/^#\s+(.+)$/m);
  return {
    title: heading?.[1]?.trim() ?? "Untitled",
    body: heading ? body.replace(/^#\s+.+\r?\n+/, "") : body,
  };
}

export function rewriteMarkdownHref(href, fromAbsPath) {
  if (!href || /^(https?:|mailto:|\/|#)/.test(href)) return href;
  const [path, hash] = href.split("#");
  if (!path) return href;

  const resolved = resolve(dirname(fromAbsPath), path);
  const rel = repoPath(resolved);
  if (rel === "documentation/adr") {
    const dest = "/decisions/0001-router-enhances-static-documents/";
    return hash ? `${dest}#${hash}` : dest;
  }
  if (!path.endsWith(".md")) return href;

  const id = idFromRepoPath(rel);
  if (!id) return href;
  const slug = slugFromId(id);
  return hash ? `${slug}#${hash}` : slug;
}

export function rewriteHtmlHrefs(html, fromAbsPath) {
  return html.replace(/href="([^"]+)"/g, (match, href) => {
    const next = rewriteMarkdownHref(href, fromAbsPath);
    return `href="${next}"`;
  });
}

export function rewriteMarkdownBody(body, fromAbsPath) {
  const inline = body.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g,
    (match, bang, text, href) => {
      const next = bang ? href : rewriteMarkdownHref(href, fromAbsPath);
      return `${bang}[${text}](${next})`;
    },
  );
  return inline.replace(
    /^\[([^\]]+)\]:\s+(\S+)/gm,
    (match, label, href) =>
      `[${label}]: ${rewriteMarkdownHref(href, fromAbsPath)}`,
  );
}

export function sidebar() {
  return [
    {
      label: "Start",
      items: [
        { label: "Introduction", slug: "index" },
        { label: "Create a site", slug: "reference/wizard" },
        { label: "Commands", link: "/reference/templates/#commands" },
        { label: "Remaining reviews", slug: "start/remaining-reviews" },
      ],
    },
    {
      label: "Glossary",
      items: [{ label: "Glossary", slug: "glossary" }],
    },
    {
      label: "Reference",
      items: referenceItems(),
    },
    {
      label: "Skills",
      items: skillItems(),
    },
    {
      label: "Decisions",
      items: decisionItems(),
    },
  ];
}

function referenceItems() {
  const names = readdirSync(join(repoRoot, "documentation/reference"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -3));
  const rest = names
    .filter((name) => name !== "OVERVIEW")
    .sort((a, b) => a.localeCompare(b));
  return ["OVERVIEW", ...rest]
    .filter((name) => names.includes(name))
    .map((name) => ({
      label: humanizeStem(name),
      slug: `reference/${slugStem(name)}`,
    }));
}

function decisionItems() {
  return readdirSync(join(repoRoot, "documentation/adr"))
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const stem = name.slice(0, -3);
      return {
        label: adrLabel(stem),
        slug: `decisions/${slugStem(stem)}`,
      };
    });
}

function adrLabel(stem) {
  const match = stem.match(/^(\d+)-(.+)$/);
  if (!match) return humanizeStem(stem.replaceAll("-", "_"));
  const words = match[2].split("-").map((word, index) => {
    if (word === "gsap") return "GSAP";
    if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
    return word;
  });
  return `${match[1]}. ${words.join(" ")}`;
}

function skillItems() {
  const found = readdirSync(join(repoRoot, ".cursor/skills"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const rest = found
    .filter((name) => !SKILL_ORDER.includes(name))
    .sort((a, b) => a.localeCompare(b));
  return [...SKILL_ORDER.filter((name) => found.includes(name)), ...rest].map(
    (name) => ({
      label: skillLabel(name),
      slug: `skills/${name}`,
    }),
  );
}

function slugStem(stem) {
  return stem.replaceAll("_", "-").toLowerCase();
}

function humanizeStem(stem) {
  const acronyms = new Set(["GSAP", "CSS", "JS", "DOM", "ADR"]);
  const words = stem.split("_").map((word) => {
    const upper = word.toUpperCase();
    if (acronyms.has(upper)) return upper;
    return word.charAt(0) + word.slice(1).toLowerCase();
  });
  return words.join(" ");
}

function skillLabel(name) {
  return name
    .split("-")
    .map((word) =>
      word === "gsap" ? "GSAP" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
