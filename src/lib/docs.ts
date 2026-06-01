import { getCollection, render, type CollectionEntry } from "astro:content";
import type { Lang } from "../i18n/ui";

export interface DocHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface DocNavItem {
  slug: string;
  /** Front-matter `nav` when present, otherwise the page title. */
  title: string;
  order: number;
  /** Section headings (h2/h3) of the page. */
  headings: DocHeading[];
}

export interface DocEntry {
  entry: CollectionEntry<"docs">;
  slug: string;
  title: string;
  order: number;
}

/** All docs entries for a locale, ordered. */
export async function getDocEntries(lang: Lang): Promise<DocEntry[]> {
  const all = await getCollection("docs");
  return all
    .filter((entry) => entry.id === lang || entry.id.startsWith(`${lang}/`))
    .map((entry) => ({
      entry,
      slug: entry.id === lang ? "index" : entry.id.slice(lang.length + 1),
      title: entry.data.title,
      order: entry.data.order,
    }))
    .sort((a, b) => a.order - b.order);
}

const treeCache = new Map<Lang, DocNavItem[]>();

/**
 * The sidebar tree: every page (including the docs home) with the section
 * headings that were generated from the Markdown, so the navigation never has
 * to be maintained by hand.
 */
export async function getDocsTree(lang: Lang): Promise<DocNavItem[]> {
  const cached = treeCache.get(lang);
  if (cached) return cached;

  const entries = await getDocEntries(lang);
  const tree = await Promise.all(
    entries.map(async ({ entry, slug, title, order }) => {
      const { headings } = await render(entry);
      return {
        slug,
        title: entry.data.nav ?? title,
        order,
        headings: headings
          .filter((h) => h.depth === 2 || h.depth === 3)
          .map((h) => ({ depth: h.depth, slug: h.slug, text: h.text })),
      };
    })
  );

  treeCache.set(lang, tree);
  return tree;
}
