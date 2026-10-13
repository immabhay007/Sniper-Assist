import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { getPageMeta } from "@/utils/pageMeta";
import { getSniperFaviconUrl } from "@/utils/azureStorage";

export default function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = getPageMeta(pathname);
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.setAttribute("rel", "icon");
      icon.setAttribute("type", "image/png");
      document.head.appendChild(icon);
    }
    icon.setAttribute("href", getSniperFaviconUrl());
  }, [pathname]);

  return null;
}
