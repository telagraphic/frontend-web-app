export function swap(currentMain, nextMain) {
  for (const { name } of [...currentMain.attributes]) {
    if (name.startsWith("data-")) currentMain.removeAttribute(name);
  }
  for (const { name, value } of nextMain.attributes) {
    if (name.startsWith("data-")) currentMain.setAttribute(name, value);
  }
  currentMain.replaceChildren(...nextMain.childNodes);
}

export function updateHead(nextDocument) {
  document.title = nextDocument.title;
  for (const selector of [
    'meta[name="description"]',
    'link[rel="canonical"]',
  ]) {
    const next = nextDocument.head.querySelector(selector);
    const current = document.head.querySelector(selector);
    if (next && current) current.replaceWith(next.cloneNode(true));
    else if (next && !current) document.head.append(next.cloneNode(true));
    else current?.remove();
  }
}
