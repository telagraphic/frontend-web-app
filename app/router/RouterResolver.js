export class RouterResolver {
  constructor({ routes }) {
    this.routes = routes;
    this.byPath = new Map();
    for (const [key, record] of Object.entries(routes)) {
      this.byPath.set(record.path, { key, record });
    }
  }

  resolve(url, { currentPath = location.pathname } = {}) {
    const parsed = url instanceof URL ? url : new URL(url, location.href);
    if (parsed.origin !== location.origin) {
      return { kind: "external", url: parsed };
    }
    const entry = this.byPath.get(parsed.pathname);
    if (!entry) {
      return { kind: "not-found", url: parsed };
    }
    if (parsed.pathname === currentPath) {
      return {
        kind: "same-document",
        key: entry.key,
        record: entry.record,
        path: parsed.pathname,
        url: parsed,
      };
    }
    return {
      kind: "commit",
      key: entry.key,
      record: entry.record,
      path: parsed.pathname,
      url: parsed,
    };
  }
}
