import pageMetaConfig from "@/config/pageMeta.json";

const APP_SUFFIX = "Sniper Assist";

/**
 * Resolve page title and description for a pathname using config/pageMeta.json.
 * @param {string} pathname - e.g. "/dashboard"
 */
export function getPageMeta(pathname) {
  const routes = pageMetaConfig.routes || {};
  const exact = routes[pathname];
  const fallback = pageMetaConfig.default || { title: APP_SUFFIX, description: "" };

  let entry = exact;
  if (!entry && /^\/users\/\d+\/permissions$/.test(pathname)) {
    entry = routes["/users/:userId/permissions"] || {
      title: "Member permissions",
      description: "Edit team member details and menu access.",
    };
  }
  entry = entry || fallback;
  const pageTitle = entry.title || fallback.title;
  const documentTitle =
    pageTitle === APP_SUFFIX || pageTitle === fallback.title
      ? APP_SUFFIX
      : `${pageTitle} · ${APP_SUFFIX}`;

  return {
    title: documentTitle,
    pageTitle,
    description: entry.description || fallback.description || "",
  };
}
