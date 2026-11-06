export function isProduction() {
  const env = globalThis.process?.env;
  return env?.NODE_ENV === "production" || env?.BUN_ENV === "production";
}
