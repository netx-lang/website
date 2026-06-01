import type { Lang } from "../i18n/ui";
import { withBase } from "./base";

/** Drop the site base ("/website") from a pathname. */
function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (!base || !pathname.startsWith(base)) return pathname;
  return pathname.slice(base.length) || "/";
}

/** Drop the locale prefix ("/zh") as well, leaving a base-relative path. */
export function stripLocale(pathname: string): string {
  const path = stripBase(pathname);
  if (path === "/zh") return "/";
  if (path.startsWith("/zh/")) return path.slice(3);
  return path;
}

/**
 * The same page in another language. Takes the current (possibly base- and
 * locale-prefixed) pathname and returns a usable href.
 */
export function localeUrl(pathname: string, lang: Lang): string {
  const path = stripLocale(pathname) || "/";
  const target = lang === "en" ? path : path === "/" ? "/zh/" : `/zh${path}`;
  return withBase(target);
}

export function docsHome(lang: Lang): string {
  return withBase(lang === "en" ? "/docs/" : "/zh/docs/");
}

export function docUrl(lang: Lang, slug: string): string {
  const base = lang === "en" ? "/docs" : "/zh/docs";
  return withBase(slug === "index" ? `${base}/` : `${base}/${slug}/`);
}
