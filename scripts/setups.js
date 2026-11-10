import { developerDocument } from "../server/developer/theme.js";

const cover =
  "covers then reveals from not-found to home when a host is present";
const focus = "moves focus to main";
const view = "view transition calls startViewTransition";

export const knownSkips = [cover, focus, view];

export const setups = [
  {
    folder: "wizard-gsap-page-swap",
    label: "GSAP + page swap",
    transition: "gsap",
    navigation: "page-swap",
    renderer: "nunjucks",
    browser: true,
    skips: [view],
  },
  {
    folder: "wizard-gsap-document-load",
    label: "GSAP + document load",
    transition: "gsap",
    navigation: "document-load",
    renderer: "nunjucks",
    browser: true,
    skips: [cover, focus, view],
  },
  {
    folder: "wizard-view-page-swap",
    label: "View transition + page swap",
    transition: "view",
    navigation: "page-swap",
    renderer: "nunjucks",
    browser: true,
    skips: [cover],
  },
  {
    folder: "wizard-view-document-load",
    label: "View transition + document load",
    transition: "view",
    navigation: "document-load",
    renderer: "nunjucks",
    browser: true,
    skips: [cover, focus, view],
  },
  {
    folder: "wizard-none-document-load",
    label: "None",
    transition: "none",
    navigation: "document-load",
    renderer: "nunjucks",
    browser: true,
    skips: [cover, focus, view],
  },
  {
    folder: "wizard-gsap-page-swap-vento",
    label: "GSAP + page swap, Vento",
    transition: "gsap",
    navigation: "page-swap",
    renderer: "vento",
    browser: false,
    skips: [],
  },
  {
    folder: "wizard-gsap-page-swap-jsx",
    label: "GSAP + page swap, JSX",
    transition: "gsap",
    navigation: "page-swap",
    renderer: "jsx",
    browser: false,
    skips: [],
  },
];

export function freshResults() {
  return setups.map((setup) => ({
    ...setup,
    steps: {
      lint: "pending",
      unit: "pending",
      build: "pending",
      browser: "pending",
    },
    note: "",
    sawSkips: [],
  }));
}

export function skippedTitles(output) {
  return output
    .split("\n")
    .filter((line) => /^\s+-\s/.test(line))
    .map((line) => line.split("›").pop().trim())
    .filter((title) => knownSkips.includes(title));
}

export function skipsMatch(expected, saw) {
  const left = [...expected].sort();
  const right = [...new Set(saw)].sort();
  return left.join("\n") === right.join("\n");
}

export function scoreboardDocument(results) {
  const rows = results
    .map((result) => {
      const report =
        result.steps.browser === "pass"
          ? `<a href="${escapeHtml(result.folder)}/playwright-report/">Report</a>`
          : "";
      const skips = result.browser
        ? escapeHtml(result.skips.join("; "))
        : "Playwright off";
      const saw =
        result.browser &&
        result.steps.browser !== "pending" &&
        !skipsMatch(result.skips, result.sawSkips)
          ? `<br />Saw ${escapeHtml(result.sawSkips.join("; ") || "none")}`
          : "";
      const note = result.note ? `<br />${escapeHtml(result.note)}` : "";
      return `<tr><td>${escapeHtml(result.label)}<br /><code>${escapeHtml(result.folder)}</code>${note}</td><td>${escapeHtml(result.steps.lint)}</td><td>${escapeHtml(result.steps.unit)}</td><td>${escapeHtml(result.steps.build)}</td><td>${escapeHtml(result.steps.browser)}</td><td>${skips}${saw}</td><td>${report}</td></tr>`;
    })
    .join("");

  return developerDocument(
    "Wizard setups",
    `<h1>Wizard setups</h1>
    <p>Pass, fail, or pending for each of the seven combination sites beside this repo. This is not the options wired into the running project. <a href="/admin">Developer</a>. <a href="/admin/codebase">Codebase</a>.</p>
    <table>
      <thead><tr><th>Setup</th><th>Lint</th><th>Unit</th><th>Build</th><th>Browser</th><th>Expected skips</th><th>Report</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`,
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
