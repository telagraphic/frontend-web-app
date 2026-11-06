import { site } from "../app/config/site.js";
import { siteRoutes } from "../app/config/siteRoutes.js";

export function buildData(route, assets) {
  const navigation = Object.entries(siteRoutes)
    .filter(([key]) => key !== "not-found")
    .map(([key, record]) => ({
      path: record.path,
      title: record.title,
      current: key === route.key ? "page" : "false",
    }));

  const meta = {
    title: route.key === "home" ? site.name : `${route.title} | ${site.name}`,
    description: route.description,
    canonical: new URL(route.path, site.origin).href,
    socialImage: site.socialImage ?? "",
  };

  return {
    route: { key: route.key, ...route },
    site,
    routes: siteRoutes,
    navigation,
    meta,
    assets,
  };
}
