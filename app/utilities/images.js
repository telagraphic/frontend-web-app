function loadOne(element) {
  return new Promise((resolve) => {
    const finish = () => {
      if (typeof element.decode === "function") {
        element.decode().then(resolve, resolve);
        return;
      }
      resolve();
    };

    if (element.complete) {
      finish();
      return;
    }

    element.addEventListener("load", finish, { once: true });
    element.addEventListener("error", () => resolve(), { once: true });
  });
}

export function loadImages(elements, { maxWait = 4000 } = {}) {
  const images = [...(elements ?? [])].filter(Boolean);
  if (images.length === 0) return Promise.resolve();

  const settle = Promise.all(images.map(loadOne));
  if (maxWait == null) return settle;

  return Promise.race([
    settle,
    new Promise((resolve) => setTimeout(resolve, maxWait)),
  ]);
}
