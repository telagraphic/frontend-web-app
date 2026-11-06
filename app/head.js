try {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && !sessionStorage.getItem("preloader-played")) {
    document.documentElement.classList.add("is-loading");
    sessionStorage.setItem("preloader-played", "1");
  }
} catch {
  document.documentElement.classList.add("is-loading");
}
