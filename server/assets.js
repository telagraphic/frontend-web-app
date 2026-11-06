import { basename } from "node:path";
import { mkdir } from "node:fs/promises";

export async function buildAssets({
  outdir,
  minify = false,
  sourcemap = false,
} = {}) {
  await mkdir(outdir, { recursive: true });
  const result = await Bun.build({
    entrypoints: ["app/App.js", "app/head.js", "styles/styles.css"],
    outdir,
    minify,
    sourcemap: sourcemap ? "linked" : "none",
    naming: minify ? "[name]-[hash].[ext]" : "[name].[ext]",
    splitting: true,
    target: "browser",
    external: ["/fonts/*"],
  });

  if (!result.success) {
    const logs = result.logs?.map((log) => String(log)).join("\n") ?? "";
    const error = new Error(logs || "Asset build failed");
    error.logs = result.logs;
    throw error;
  }

  const assets = { head: "", css: "", js: "" };
  for (const output of result.outputs) {
    const name = basename(output.path);
    if (name.startsWith("styles") && name.endsWith(".css")) {
      assets.css = `/assets/${name}`;
      continue;
    }
    if (output.kind && output.kind !== "entry-point") continue;
    const href = `/assets/${name}`;
    if (name.startsWith("head") && name.endsWith(".js")) assets.head = href;
    else if (name.startsWith("App") && name.endsWith(".js")) assets.js = href;
  }
  return assets;
}
