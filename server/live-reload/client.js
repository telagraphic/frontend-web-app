const source = new EventSource("/dev/events");
let seenHello = false;

source.addEventListener("hello", () => {
  if (seenHello) {
    saveScroll();
    location.reload();
    return;
  }
  seenHello = true;
});

source.addEventListener("reload", () => {
  saveScroll();
  location.reload();
});

source.addEventListener("css", () => {
  for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
    const url = new URL(link.href);
    url.searchParams.set("t", String(Date.now()));
    link.href = url.href;
  }
});

source.addEventListener("error", (event) => {
  showOverlay(event.data ?? "Build error");
});

function saveScroll() {
  try {
    sessionStorage.setItem("dev-scroll", String(window.scrollY ?? 0));
  } catch {
    /* sessionStorage can throw in private mode */
  }
}

function showOverlay(text) {
  let overlay = document.getElementById("dev-error");
  if (!overlay) {
    overlay = document.createElement("pre");
    overlay.id = "dev-error";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;margin:0;padding:1.5rem;background:#111;color:#fca5a5;overflow:auto;white-space:pre-wrap;";
    document.body.append(overlay);
  }
  overlay.textContent = text;
}
