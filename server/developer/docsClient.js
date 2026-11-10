import { searchDocs } from "./docsSearch.js";

export default class DocsPage {
  constructor(root, { pages } = {}) {
    this.root = root;
    this.pages = pages ?? null;
    this.controller = null;
    this.signal = null;
    this.menuOpen = false;
    this.searchOpen = false;
    this.loading = null;
  }

  init() {
    this.controller = new AbortController();
    this.signal = this.controller.signal;
    this.menu = this.root.querySelector("[data-docs-menu]");
    this.menuToggle = this.root.querySelector("[data-docs-menu-toggle]");
    this.shell = this.root.querySelector("[data-docs-shell]");
    this.search = this.root.querySelector("[data-docs-search]");
    this.searchOpenButton = this.root.querySelector("[data-docs-search-open]");
    this.searchBackdrop = this.root.querySelector(
      "[data-docs-search-backdrop]",
    );
    this.searchInput = this.root.querySelector("[data-docs-search-input]");
    this.searchPanel = this.root.querySelector("[data-docs-search-panel]");
    this.currentId =
      this.root.documentElement?.getAttribute("data-docs-page") ?? "";

    const kbd = this.root.querySelector("[data-docs-search-kbd]");
    if (kbd) kbd.textContent = macShortcut() ? "⌘ + K" : "Ctrl + K";

    this.menuToggle.addEventListener(
      "click",
      (event) => this.onMenuToggle(event),
      {
        signal: this.signal,
      },
    );
    this.menu.addEventListener("click", (event) => this.onMenuClick(event), {
      signal: this.signal,
    });
    this.searchOpenButton?.addEventListener("click", () => this.openSearch(), {
      signal: this.signal,
    });
    this.searchBackdrop?.addEventListener("click", () => this.closeSearch(), {
      signal: this.signal,
    });
    this.search.addEventListener("submit", (event) => event.preventDefault(), {
      signal: this.signal,
    });
    this.searchInput.addEventListener("focus", () => this.onSearchFocus(), {
      signal: this.signal,
    });
    this.searchInput.addEventListener("input", () => this.onSearchInput(), {
      signal: this.signal,
    });
    this.searchInput.addEventListener(
      "keydown",
      (event) => this.onSearchKey(event),
      {
        signal: this.signal,
      },
    );
    this.searchPanel.addEventListener(
      "click",
      (event) => this.onSearchResult(event),
      {
        signal: this.signal,
      },
    );
    this.root.addEventListener("keydown", (event) => this.onKeyDown(event), {
      signal: this.signal,
    });
    this.root.addEventListener("click", (event) => this.onCopyClick(event), {
      signal: this.signal,
    });
  }

  destroy() {
    this.controller?.abort();
    if (this.shell) this.shell.inert = false;
    this.root.documentElement?.classList.remove("is-menu-open");
    this.menuOpen = false;
    this.searchOpen = false;
  }

  openMenu() {
    this.closeSearch();
    this.menuOpen = true;
    this.menu.hidden = false;
    this.root.documentElement.classList.add("is-menu-open");
    this.menuToggle.setAttribute("aria-expanded", "true");
    this.shell.inert = true;
    const current =
      this.menu.querySelector('[aria-current="page"]') ??
      this.menu.querySelector("a");
    current?.focus();
  }

  closeMenu({ focusToggle = false } = {}) {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    this.menu.hidden = true;
    this.root.documentElement.classList.remove("is-menu-open");
    this.menuToggle.setAttribute("aria-expanded", "false");
    this.shell.inert = false;
    if (focusToggle) this.menuToggle.focus();
  }

  openSearch() {
    this.closeMenu();
    this.searchOpen = true;
    this.search.hidden = false;
    this.searchPanel.hidden = false;
    this.searchInput.setAttribute("aria-expanded", "true");
    if (this.pages) this.renderResults(this.searchInput.value);
    this.searchInput.focus();
    if (!this.pages) this.loadAndRender();
  }

  async loadAndRender() {
    await this.ensurePages();
    if (!this.searchOpen) return;
    this.renderResults(this.searchInput.value);
  }

  closeSearch() {
    if (!this.searchOpen) return;
    this.searchOpen = false;
    this.search.hidden = true;
    this.searchPanel.hidden = true;
    this.searchInput.setAttribute("aria-expanded", "false");
  }

  onMenuClick(event) {
    if (event.target === this.menu) this.closeMenu();
  }

  onCopyClick(event) {
    const button = event.target.closest?.("[data-docs-copy]");
    if (!button) return;
    const code = button.closest(".docs-code")?.querySelector("code");
    if (!code) return;
    copyCode(code.textContent ?? "").then((ok) => {
      if (!ok || !button.isConnected) return;
      button.textContent = "Copied";
      window.setTimeout(() => {
        if (button.isConnected) button.textContent = "Copy";
      }, 1500);
    });
  }

  onMenuToggle(event) {
    event.stopPropagation();
    if (this.menuOpen) this.closeMenu();
    else this.openMenu();
  }

  onSearchFocus() {
    if (this.searchOpen) return;
    this.openSearch();
  }

  onSearchInput() {
    if (!this.searchOpen) {
      this.openSearch();
      return;
    }
    this.renderResults(this.searchInput.value);
  }

  onSearchKey(event) {
    const links = [...this.searchPanel.querySelectorAll("a")];
    if (!links.length) return;
    const current = links.findIndex(
      (link) => link.getAttribute("aria-selected") === "true",
    );
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        event.key === "ArrowDown"
          ? (current + 1) % links.length
          : current <= 0
            ? links.length - 1
            : current - 1;
      for (const link of links) link.removeAttribute("aria-selected");
      links[next].setAttribute("aria-selected", "true");
      links[next].scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      (links[current] ?? links[0]).click();
    }
  }

  onSearchResult(event) {
    const link = event.target.closest?.("a");
    if (!link) return;
    const url = new URL(link.href, this.root.location.href);
    if (url.pathname !== this.root.location.pathname || !url.hash) return;
    event.preventDefault();
    this.closeSearch();
    this.searchInput.blur();
    const id = hashId(url.hash);
    const target = this.root.getElementById(id);
    if (!target) return;
    if (this.root.location.hash !== url.hash)
      this.root.location.hash = url.hash;
    target.scrollIntoView();
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      if (this.searchOpen) {
        this.closeSearch();
        this.searchInput.blur();
      } else this.openSearch();
      return;
    }
    if (key === "escape") {
      if (this.searchOpen) {
        this.closeSearch();
        this.searchInput.blur();
      } else if (this.menuOpen) {
        this.closeMenu({ focusToggle: true });
      }
      return;
    }
    if (key !== "m" || event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (event.target?.isContentEditable) return;
    event.preventDefault();
    if (this.menuOpen) this.closeMenu();
    else this.openMenu();
  }

  async ensurePages() {
    if (this.pages) return;
    this.loading ??= fetch("/search.json").then((response) => response.json());
    this.pages = await this.loading;
  }

  renderResults(query) {
    const { headings, pages } = searchDocs(this.pages ?? [], {
      query,
      currentId: this.currentId,
    });
    this.searchPanel.replaceChildren();
    if (!headings.length && !pages.length) {
      const empty = this.root.createElement("p");
      empty.className = "docs-search__empty";
      empty.textContent = "No results";
      this.searchPanel.append(empty);
      return;
    }
    if (headings.length) {
      this.searchPanel.append(
        this.resultGroup("On this page", headings, query),
      );
    }
    if (pages.length) {
      this.searchPanel.append(this.resultGroup("Pages", pages, query));
    }
  }

  resultGroup(label, items, query) {
    const group = this.root.createElement("section");
    group.className = "docs-search__group";
    const title = this.root.createElement("p");
    title.className = "docs-search__label";
    title.textContent = label;
    group.append(title);
    for (const item of items) {
      const link = this.root.createElement("a");
      link.className = "docs-search__link";
      link.href = item.href;
      const name = this.root.createElement("span");
      name.className = "docs-search__title";
      fillMatch(name, item.title, query);
      link.append(name);
      if (item.section) {
        const section = this.root.createElement("span");
        section.className = "docs-search__section";
        section.textContent = item.section;
        link.append(section);
      }
      if (item.excerpt) {
        const excerpt = this.root.createElement("span");
        excerpt.className = "docs-search__excerpt";
        fillMatch(excerpt, item.excerpt, query);
        link.append(excerpt);
      }
      group.append(link);
    }
    return group;
  }
}

function fillMatch(node, value, query) {
  const q = query.trim();
  if (!q) {
    node.textContent = value;
    return;
  }
  const lower = value.toLowerCase();
  const needle = q.toLowerCase();
  let from = 0;
  let at = lower.indexOf(needle);
  while (at !== -1) {
    node.append(value.slice(from, at));
    const mark = node.ownerDocument.createElement("mark");
    mark.textContent = value.slice(at, at + needle.length);
    node.append(mark);
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  node.append(value.slice(from));
}

function hashId(hash) {
  const raw = hash.slice(1);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function macShortcut() {
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

function copyCode(text) {
  const clipboard = navigator.clipboard;
  if (clipboard?.writeText) {
    return clipboard.writeText(text).then(
      () => true,
      () => copyWithSelection(text),
    );
  }
  return Promise.resolve(copyWithSelection(text));
}

function copyWithSelection(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
