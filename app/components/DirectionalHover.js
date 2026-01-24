import Component from "./Component.js";

export class DirectionalHover extends Component {
  constructor() {
    super({
      element: null, // No specific element needed
      elements: {},
    });
    this._initialized = false;
    this._handlers = new Map();
  }

  setup() {
    if (this._initialized) {
      return;
    }

    this.initDirectionalListHover();
  }

  remove() {
    this.removeDirectionalListHover();
  }

  initDirectionalListHover() {
    if (this._initialized) {
      return;
    }

    const directionMap = {
      top: "translateY(-100%)",
      bottom: "translateY(100%)",
      left: "translateX(-100%)",
      right: "translateX(100%)",
    };

    document
      .querySelectorAll("[data-directional-hover]")
      .forEach((container) => {
        const type = container.getAttribute("data-type") || "all";

        container
          .querySelectorAll("[data-directional-hover-item]")
          .forEach((item) => {
            const tile = item.querySelector("[data-directional-hover-tile]");
            if (!tile) return;

            // Skip if already initialized
            if (item.hasAttribute("data-directional-hover-initialized")) {
              return;
            }

            const mouseenterHandler = (e) => {
              const dir = getDirection(e, item, type);
              tile.style.transition = "none";
              tile.style.transform = directionMap[dir] || "translate(0, 0)";
              void tile.offsetHeight;
              tile.style.transition = "";
              tile.style.transform = "translate(0%, 0%)";
              item.setAttribute("data-status", `enter-${dir}`);
            };

            const mouseleaveHandler = (e) => {
              const dir = getDirection(e, item, type);
              item.setAttribute("data-status", `leave-${dir}`);
              tile.style.transform = directionMap[dir] || "translate(0, 0)";
            };

            item.addEventListener("mouseenter", mouseenterHandler);
            item.addEventListener("mouseleave", mouseleaveHandler);

            this._handlers.set(item, {
              mouseenter: mouseenterHandler,
              mouseleave: mouseleaveHandler,
            });

            item.setAttribute("data-directional-hover-initialized", "true");
          });

        function getDirection(event, el, type) {
          const { left, top, width: w, height: h } = el.getBoundingClientRect();
          const x = event.clientX - left;
          const y = event.clientY - top;

          if (type === "y") return y < h / 2 ? "top" : "bottom";
          if (type === "x") return x < w / 2 ? "left" : "right";

          const distances = {
            top: y,
            right: w - x,
            bottom: h - y,
            left: x,
          };

          return Object.entries(distances).reduce((a, b) =>
            a[1] < b[1] ? a : b
          )[0];
        }
      });

    this._initialized = true;
  }

  removeDirectionalListHover() {
    if (!this._handlers) return;

    this._handlers.forEach((handlers, item) => {
      item.removeEventListener("mouseenter", handlers.mouseenter);
      item.removeEventListener("mouseleave", handlers.mouseleave);
      item.removeAttribute("data-directional-hover-initialized");
    });

    this._handlers.clear();
    this._initialized = false;
  }
}