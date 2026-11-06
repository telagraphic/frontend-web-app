import { Preloader } from "../partials/preloader.jsx";
import { Menu } from "../partials/navigation.jsx";
import { Footer } from "../partials/footer.jsx";

export function Layout({ route, meta, assets, navigation, site, children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <script src={assets.head}></script>
        <link rel="stylesheet" href={assets.css} />
        <script type="module" src={assets.js}></script>
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <Preloader site={site} />
        <Menu navigation={navigation} site={site} />
        <div
          class="page-transition-overlay"
          data-transition-host=""
          hidden
          aria-hidden="true"
        ></div>
        <main id="main" data-route={route.key} tabindex="-1">
          {children}
        </main>
        <Footer site={site} />
        {assets.liveReload ? (
          <script type="module" src={assets.liveReload}></script>
        ) : null}
      </body>
    </html>
  );
}
