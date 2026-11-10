import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { renderDocsMarkdown } from "./docsRender.js";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "../..");

const SKILL_ORDER = [
  "front-end-add-page",
  "front-end-write-css",
  "front-end-add-gsap-transition",
  "front-end-adapt-layout-component",
  "front-end-gsap-experiment",
  "front-end-check-performance",
  "front-end-write-js",
  "front-end-add-module",
  "front-end-add-service",
  "front-end-add-view-transition",
  "front-end-add-effect",
  "front-end-write-test",
  "front-end-add-custom-element",
  "front-end-add-integration",
];

export function listMarkdownFiles() {
  const files = [
    join(repoRoot, "AGENTS.md"),
    join(repoRoot, "GLOSSARY.md"),
    join(repoRoot, "documentation/REMAINING_REVIEWS.md"),
  ];

  for (const name of readdirSync(join(repoRoot, "documentation/reference"))) {
    if (name.endsWith(".md")) {
      files.push(join(repoRoot, "documentation/reference", name));
    }
  }

  for (const name of readdirSync(join(repoRoot, "documentation/adr"))) {
    if (name.endsWith(".md")) {
      files.push(join(repoRoot, "documentation/adr", name));
    }
  }

  const skillRoot = join(repoRoot, ".cursor/skills");
  for (const entry of readdirSync(skillRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(skillRoot, entry.name);
    for (const name of readdirSync(dir)) {
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
  return `/${id}`;
}

export function splitMarkdown(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  const body = match ? match[1] : raw;
  const heading = body.match(/^#\s+(.+)$/m);
  return {
    title: heading?.[1]?.trim() ?? "Untitled",
    body,
  };
}

export function rewriteDocsHref(href, fromAbsPath) {
  if (!href || /^(https?:|mailto:|\/|#)/.test(href)) return href;
  const [path, hash] = href.split("#");
  if (!path) return href;

  const resolved = resolve(dirname(fromAbsPath), path);
  const rel = repoPath(resolved);
  if (rel === "documentation/adr") {
    const dest = "/decisions/0001-router-enhances-static-documents";
    return hash ? `${dest}#${hash}` : dest;
  }
  if (!path.endsWith(".md")) return href;

  const id = idFromRepoPath(rel);
  if (!id) return href;
  const slug = slugFromId(id);
  return hash ? `${slug}#${hash}` : slug;
}

export function rewriteDocsMarkdown(body, fromAbsPath) {
  const inline = body.replace(
    /(!?)\[([^\]]*)\]\(([^)\s]+)\)/g,
    (match, bang, text, href) => {
      const next = bang ? href : rewriteDocsHref(href, fromAbsPath);
      return `${bang}[${text}](${next})`;
    },
  );
  return inline.replace(
    /^\[([^\]]+)\]:\s+(\S+)/gm,
    (match, label, href) => `[${label}]: ${rewriteDocsHref(href, fromAbsPath)}`,
  );
}

export function docsMenu() {
  return [
    {
      label: "Start",
      items: [
        { label: "Introduction", slug: "index" },
        { label: "Create a site", slug: "reference/wizard" },
        { label: "Commands", link: "/reference/templates#commands" },
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

export async function loadDocsPages() {
  const byId = new Map();
  for (const absPath of listMarkdownFiles()) {
    const id = idFromAbsPath(absPath);
    if (!id) continue;
    const raw = await readFile(absPath, "utf8");
    const { title, body } = splitMarkdown(raw);
    const rendered = renderDocsMarkdown(body, absPath);
    byId.set(id, {
      id,
      href: slugFromId(id),
      title,
      section: sectionFor(id),
      headings: rendered.headings,
      html: rendered.html,
      text: rendered.text,
    });
  }

  const ordered = [];
  const seen = new Set();
  for (const group of docsMenu()) {
    for (const item of group.items) {
      if (!item.slug || seen.has(item.slug)) continue;
      const page = byId.get(item.slug);
      if (!page) continue;
      seen.add(item.slug);
      ordered.push(page);
    }
  }
  for (const page of byId.values()) {
    if (!seen.has(page.id)) ordered.push(page);
  }
  return ordered;
}

export function normalizeDocsPath(pathname) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    path = pathname;
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

function sectionFor(id) {
  if (id === "index" || id.startsWith("start/")) return "Start";
  if (id === "glossary") return "Glossary";
  if (id.startsWith("reference/")) return "Reference";
  if (id.startsWith("skills/")) return "Skills";
  if (id.startsWith("decisions/")) return "Decisions";
  return "Pages";
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
  const bare = name.startsWith("front-end-")
    ? name.slice("front-end-".length)
    : name;
  return bare
    .split("-")
    .map((word) =>
      word === "gsap" ? "GSAP" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
