/**
 * Prefix a root-absolute path with the site's configured base.
 *
 * The site can be served at the domain root (an organisation site such as
 * https://netx-lang.github.io) or under a sub-path (a project site such as
 * https://netx-lang.github.io/website). `import.meta.env.BASE_URL` is "/" in the
 * first case and "/website/" in the second, so every hard-coded asset path or
 * internal route has to go through here — otherwise the sub-path deployment
 * 404s on all of them.
 *
 * `path` must start with "/" (all call sites do).
 */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
