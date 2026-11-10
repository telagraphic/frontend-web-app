---
status: accepted
---

# The documentation site publishes the full markdown set as internal reference

The starter's behavior was spread across JSDoc, many Markdown files, and the setup wizard. We publish one internal documentation site that lives with the code: onboarding, options, building blocks, skills, and decisions. More accepted pages is better than a thin public subset. JSDoc stays in the code for function-level detail. The site renders the markdown in the repo; it does not grow a second copy.

The reader is the Bun server in ADR 0027. The map below is the content contract.

## Decisions

- Source of truth is `AGENTS.md`, `GLOSSARY.md`, `documentation/adr/`, `documentation/reference/`, `documentation/REMAINING_REVIEWS.md`, and `.cursor/skills/`. `bun run docs:dev` serves it while developing. `bun run build` publishes `dist/` only. The reference is not part of that build.
- Every accepted markdown page is a documentation page. That includes the method-verb table ([METHOD_VERBS.md](../reference/METHOD_VERBS.md)), the building-blocks overview ([OVERVIEW.md](../reference/OVERVIEW.md)), wizard, templates, ADRs, and skills. Do not keep a convention only in the repo.
- Sidebar:

  | Section | Holds |
  | --- | --- |
  | Start | Introduction, Create a site (`WIZARD.md`), Commands, remaining reviews until they finish |
  | Glossary | `GLOSSARY.md` |
  | Reference | `OVERVIEW.md` first, then every file in `documentation/reference/` |
  | Skills | Each add-* skill, in sync with `.cursor/skills/` (ADR 0013) |
  | Decisions | Every ADR |

- `WIZARD.md` is the living options catalog. Do not add a third options file.
- History files (`documentation/guides/`, `documentation/refactoring-reviews/`, `APPLICATION_GUIDE.md`, `ARCHITECTURE.md`, superseded CSS notes, stale reference, SEO/CSP checklists) are not pages. They are deleted from the starter (slice 0), not published.
- A change that adds, removes, or changes an option or a convention updates the markdown in the same change. The server reads those files on request.

## Considered Options

- **A slim public site plus private repo notes.** Internal onboarding would drift from the published pages. One set.
- **Copy markdown into a content folder.** A second tree goes stale. The server reads the existing files.
- **Leave METHOD_VERBS and similar tables in the repo only.** They are conventions people and agents need on the site.
- **Publish the reference only from the starter.** A created site could not open the reference beside its own dev server. `docs:dev` is part of the copy.

## Consequences

- Skills that contradict an accepted ADR are wrong (ADR 0013).
- The Skills list is accepted (ADR 0013).
- Deleting the history files is part of this review, not the reader.
- A created site runs `bun run docs:dev` for the reference. Deploy the site from `dist/`. Do not deploy the reference.
