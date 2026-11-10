export function searchDocs(pages, { query = "", currentId = "" } = {}) {
  const q = query.trim().toLowerCase();
  const current = pages.find((page) => page.id === currentId) ?? null;
  const headings = current ? headingResults(current, q) : [];
  const others = [];

  for (const page of pages) {
    if (page.id === currentId) continue;
    if (!q) {
      others.push({
        title: page.title,
        href: page.href,
        section: page.section,
      });
      continue;
    }
    const match = pageMatch(page, q);
    if (match) others.push(match);
  }

  if (q) others.sort((a, b) => a.rank - b.rank);
  return { headings, pages: others };
}

function headingResults(page, q) {
  const headings = [];
  for (const heading of page.headings) {
    if (q && !heading.text.toLowerCase().includes(q)) continue;
    headings.push({
      title: heading.text,
      href: `${page.href}#${heading.id}`,
    });
  }
  if (!q) return headings;

  const headingHit = page.headings.some((heading) =>
    heading.text.toLowerCase().includes(q),
  );
  const excerpt = excerptAround(page.text, q);
  if (excerpt && !headingHit) {
    headings.push({ title: page.title, href: page.href, excerpt });
  }
  return headings;
}

function pageMatch(page, q) {
  const title = page.title.toLowerCase();
  const inTitle = title.includes(q);
  const excerpt = excerptAround(page.text, q);
  if (!inTitle && !excerpt) return null;
  const rank = title.startsWith(q) ? 0 : inTitle ? 1 : 2;
  return {
    title: page.title,
    href: page.href,
    section: page.section,
    excerpt: excerpt || clip(page.text),
    rank,
  };
}

function excerptAround(text, query) {
  const flat = String(text).replace(/\s+/g, " ").trim();
  const at = flat.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return "";
  const start = Math.max(0, at - 48);
  const end = Math.min(flat.length, at + query.length + 72);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < flat.length ? "…" : "";
  return `${prefix}${flat.slice(start, end)}${suffix}`;
}

function clip(text) {
  const flat = String(text).replace(/\s+/g, " ").trim();
  if (flat.length <= 120) return flat;
  return `${flat.slice(0, 120)}…`;
}
