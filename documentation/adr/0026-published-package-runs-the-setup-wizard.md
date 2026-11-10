---
status: accepted
---

# A published package runs the setup wizard for each new client site

This repo is the starter. Other people should be able to start a client site from a released snapshot without cloning the repo. Publish that snapshot as one package. `bunx` runs it. The package runs the setup wizard already in `wizard/create.js`. Each run writes a new folder from that release. A later release is what the next new site gets. A client site that already exists stays as it was created.

The package is not published yet. This decision is the shape for that work.

## Decisions

- The git repo stays the source. A starter release is a tagged commit of this repo, published as one npm package. `bunx` is how someone runs it. There is one package, not a separate Bun package and npm package.
- The package command is the setup wizard. Prompts, flags, and the copy/drop map stay the ones in [WIZARD.md](../reference/WIZARD.md). The bin copies from the installed package into `<dest>`, deletes the modules the chosen site does not need, and writes the same seams as `bun run create`.
- The new site has no `wizard/` folder and no `create` script. `@clack/prompts` stays in the package that asks the questions.
- `bun run create` in a checkout of this repo stays. CI and local setup folders use it, and it copies that checkout. The published command copies the package contents. Both call the same wizard.
- A starter release does not modify a client site that already exists. Changing page transition, navigation, or renderer in that site stays a manual edit there (ADR 0002).

## Considered Options

- **Leave creation on a local clone.** One author can `bun run create` from this repo. Someone else would need the repo and the right commit.
- **`bun create` of the GitHub repo with no wizard.** That downloads every option. The wizard exists so the client site contains only the chosen page transition, navigation, and renderer.
- **Apply a newer release onto an existing client site.** That site has already had unused modules removed, and then it has been edited. Writing a newer starter over it is brittle.

## Consequences

- Publish from a tagged commit. A dirty working tree is not a release.
- After a publish, a cached `bunx` can still run the previous release. The command for a new site names `@latest` or a version.
- The created site is a Bun app. The wizard still stops after writing files and prints `bun install` and `bun run dev`. `bun run docs:dev` serves the reference.
- A public package publishes this starter, including the ADRs, skills, and docs. Use a private registry when the repo stays private.
- ADR 0002 records the wizard. This ADR records how a release of that wizard is shared.
