/**
 * Prefix root-absolute `href`/`src` values in rendered Markdown with the site
 * base.
 *
 * Astro rewrites the links it generates, but a Markdown link written as
 * "/assets/netx-paper.pdf" stays root-absolute, which breaks when the site is
 * deployed under a sub-path (e.g. https://netx-lang.github.io/website/).
 *
 * Pass the resolved base in from astro.config.mjs; no-op for the domain root.
 */

function walk(node, visit) {
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visit);
  }
}

export default function rehypeBaseLinks(options = {}) {
  const base = (options.base || "/").replace(/\/$/, "");
  return (tree) => {
    if (!base) return;
    walk(tree, (node) => {
      if (!node.properties) return;
      for (const key of ["href", "src"]) {
        const value = node.properties[key];
        // Leave protocol-relative ("//host/...") and absolute URLs alone.
        if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
          node.properties[key] = `${base}${value}`;
        }
      }
    });
  };
}
