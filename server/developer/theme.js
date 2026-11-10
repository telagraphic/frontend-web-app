import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const geistGray = readFileSync(
  fileURLToPath(new URL("./geist-gray.css", import.meta.url)),
  "utf8",
);

const fontDirs = {
  geist: fileURLToPath(
    new URL(
      "../../node_modules/@fontsource-variable/geist/files/",
      import.meta.url,
    ),
  ),
  "geist-mono": fileURLToPath(
    new URL(
      "../../node_modules/@fontsource-variable/geist-mono/files/",
      import.meta.url,
    ),
  ),
};

const fontFaces = [
  [
    "Geist Variable",
    "geist",
    "geist-latin-ext-wght-normal.woff2",
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  ],
  [
    "Geist Variable",
    "geist",
    "geist-latin-wght-normal.woff2",
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  ],
  [
    "Geist Mono Variable",
    "geist-mono",
    "geist-mono-latin-ext-wght-normal.woff2",
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  ],
  [
    "Geist Mono Variable",
    "geist-mono",
    "geist-mono-latin-wght-normal.woff2",
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  ],
];

export function developerFontFile(family, file) {
  const dir = fontDirs[family];
  if (!dir || !/^[\w.-]+\.woff2$/.test(file)) return null;
  const full = resolve(dir, file);
  const base = resolve(dir);
  if (full !== base && !full.startsWith(`${base}${sep}`)) return null;
  if (!existsSync(full)) return null;
  return full;
}

export function developerDocument(title, body) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
${geistGray}
${developerFontFaceCss("/admin/fonts")}
      :root {
        color-scheme: light;
        --developer-font: "Geist Variable", sans-serif;
        --developer-mono: "Geist Mono Variable", ui-monospace, monospace;
      }

      body {
        margin: 0;
        background: var(--ds-background-200);
        color: var(--ds-gray-1000);
        font: 1rem / 1.75 var(--developer-font);
      }

      .bar {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        height: 3.5rem;
        padding-inline: 1rem;
        background: var(--ds-background-200);
        border-bottom: 1px solid var(--ds-gray-200);
      }

      .title {
        color: var(--ds-gray-1000);
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1.2;
        text-decoration: none;
      }

      .developer {
        box-sizing: border-box;
        max-width: 45rem;
        margin-inline: auto;
        padding: 1.5rem 1rem 3rem;
      }

      .developer > * + * {
        margin-top: 1.5rem;
      }

      h1,
      h2,
      h3 {
        margin: 0;
        color: var(--ds-gray-1000);
        font-weight: 600;
        line-height: 1.2;
      }

      h1 {
        margin-top: 1rem;
        font-size: 2.1875rem;
      }

      h2 {
        margin-top: 1.5em;
        font-size: 1.8125rem;
      }

      h3 {
        margin-top: 1.5em;
        font-size: 1.5rem;
      }

      p,
      ul {
        margin: 0;
      }

      a {
        color: var(--ds-gray-1000);
      }

      code {
        font-family: var(--developer-mono);
        font-size: 0.8125rem;
        background: var(--ds-gray-100);
        margin-block: -0.125rem;
        padding: 0.125rem 0.375rem;
      }

      pre {
        overflow: auto;
        border: 1px solid var(--ds-gray-200);
        margin: 0;
        padding: 0.75rem 1rem;
        font-family: var(--developer-mono);
        font-size: 0.875rem;
        line-height: 1.5;
        tab-size: 2;
      }

      pre code {
        background: transparent;
        margin: 0;
        padding: 0;
        font-size: inherit;
      }

      table {
        border-collapse: collapse;
        border-spacing: 0;
        display: block;
        overflow: auto;
        width: 100%;
      }

      th,
      td {
        border-bottom: 1px solid var(--ds-gray-200);
        padding: 0.5rem 1rem;
        text-align: start;
        vertical-align: baseline;
      }

      th:first-child,
      td:first-child {
        padding-inline-start: 0;
      }

      th:last-child,
      td:last-child {
        padding-inline-end: 0;
      }

      th {
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <header class="bar">
      <a class="title" href="/admin">Frontend web app</a>
    </header>
    <main class="developer">
      ${body}
    </main>
  </body>
</html>`;
}

export function developerFontFaceCss(urlPrefix) {
  return fontFaces
    .filter(([, family, file]) => developerFontFile(family, file))
    .map(
      ([name, family, file, range]) => `@font-face {
        font-family: "${name}";
        font-style: normal;
        font-display: swap;
        font-weight: 100 900;
        src: url("${urlPrefix}/${family}/${file}") format("woff2");
        unicode-range: ${range};
      }`,
    )
    .join("\n");
}
