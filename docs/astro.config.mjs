import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import { docsServer } from "../server/developer/docsUrl.js";
import starlight from "@astrojs/starlight";
import { repoRoot, sidebar } from "./src/lib/repo-docs.js";
import {
  remarkRepoLinks,
  remarkStripTitleHeading,
} from "./src/remark/repo-links.js";

const docsDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  srcDir: "./src",
  server: docsServer(),
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
      customCss: [
        "@fontsource-variable/geist/wght.css",
        "@fontsource-variable/geist-mono/wght.css",
        "./src/styles/custom.css",
      ],
      markdown: {
        processedDirs: [repoRoot],
      },
    }),
  ],
});
