import { existsSync, readFileSync } from "node:fs";

export class RenderError extends Error {
  constructor(message, { file, line, cause } = {}) {
    super(message, { cause });
    this.name = "RenderError";
    this.file = file ?? null;
    this.line = line ?? null;
  }

  static from(error, file) {
    const message = error?.message ?? String(error);
    const lineMatch =
      message.match(/\[Line (\d+)/i) ?? message.match(/line (\d+)/i);
    return new RenderError(message, {
      file,
      line: lineMatch ? Number(lineMatch[1]) : null,
      cause: error,
    });
  }
}

export class DocumentError extends Error {
  constructor(missing) {
    super(`Document is missing: ${missing.join(", ")}`);
    this.name = "DocumentError";
    this.missing = missing;
  }
}

export function assertDocument(route, html, { requireHost = true } = {}) {
  const missing = [];
  if (!/<html\b[^>]*\blang=/i.test(html)) missing.push("html lang");
  if (!/width=device-width/i.test(html) || !/initial-scale=1/i.test(html)) {
    missing.push("viewport");
  }
  if (/user-scalable=no|maximum-scale/i.test(html)) {
    missing.push("viewport must not disable zoom");
  }

  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const headScript = head.search(/<script\b[^>]*\bsrc=/i);
  const headCss = head.search(/<link\b[^>]*rel=["']stylesheet["']/i);
  if (headScript === -1 || headCss === -1 || headScript > headCss) {
    missing.push("head script before CSS");
  }

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  const firstFocusable = body.match(
    /<(a|button|input|select|textarea)\b[^>]*>/i,
  );
  if (
    !firstFocusable ||
    !/class=["'][^"']*skip-link[^"']*["']/i.test(firstFocusable[0]) ||
    !/href=["']#main["']/i.test(firstFocusable[0])
  ) {
    missing.push("skip link as first focusable");
  }

  const mains = html.match(/<main\b[^>]*>/gi) ?? [];
  if (mains.length !== 1) missing.push("exactly one main");
  const mainTag = mains[0] ?? "";
  if (!/\bid=["']main["']/i.test(mainTag)) missing.push("main id");
  if (!new RegExp(`\\bdata-route=["']${route.key}["']`, "i").test(mainTag)) {
    missing.push(`main data-route=${route.key}`);
  }
  if (!/\btabindex=["']-1["']/i.test(mainTag)) missing.push("main tabindex");

  const mainSplit = html.split(/<main\b/i);
  const beforeMain = mainSplit[0] ?? "";
  if (!/data-navigation\b/i.test(beforeMain)) missing.push("menu outside main");
  if (!/class=["'][^"']*preloader[^"']*["']/i.test(beforeMain)) {
    missing.push("preloader outside main");
  }

  if (requireHost) {
    const host = html.match(/<div\b[^>]*data-transition-host[^>]*>/i);
    if (!host) missing.push("transition host");
    else {
      if (!/\bhidden\b/i.test(host[0])) missing.push("host hidden");
      if (!/\baria-hidden=["']true["']/i.test(host[0])) {
        missing.push("host aria-hidden");
      }
      if (!beforeMain.includes(host[0])) missing.push("host outside main");
    }
  }

  if (missing.length) throw new DocumentError(missing);
}

export function layoutRequiresHost(viewsDir) {
  for (const extension of [".njk", ".vto", ".jsx", ".html"]) {
    const file = `${viewsDir}/layouts/page${extension}`;
    if (!existsSync(file)) continue;
    return readFileSync(file, "utf8").includes("data-transition-host");
  }
  return false;
}
