import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { repoRoot, sidebar } from "./src/lib/repo-docs.js";
import {
  remarkRepoLinks,
  remarkStripTitleHeading,
} from "./src/remark/repo-links.js";

const docsDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  srcDir: "./src",
  markdown: {
    remarkPlugins: [remarkRepoLinks, remarkStripTitleHeading],
  },
  vite: {
    server: {
      fs: {
        allow: [docsDir, repoRoot],
      },
    },
  },
  integrations: [
    starlight({
      title: "Frontend web app",
      description:
        "Internal reference for the Bun, GSAP, and Lenis starter: onboarding, options, building blocks, skills, and decisions.",
      sidebar: sidebar(),
      markdown: {
        processedDirs: [repoRoot],
      },
    }),
  ],
});
