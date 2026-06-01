import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeInlineNetx from "./src/markdown/rehype-inline-netx.mjs";
import rehypeBaseLinks from "./src/markdown/rehype-base-links.mjs";

const read = (path) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const netxGrammar = read("./src/shiki/netx.tmLanguage.json");
const antlrGrammar = read("./src/shiki/antlr.tmLanguage.json");
const netxTheme = read("./src/shiki/netx-light.tmTheme.json");

// The site must work both at the domain root (an organisation site,
// https://netx-lang.github.io) and under a sub-path (a project site,
// https://netx-lang.github.io/website). The Pages workflow fills these in from
// `actions/configure-pages`; the defaults below are for local builds and for the
// organisation site.
const site = process.env.SITE_URL || "https://netx-lang.github.io";
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site,
  base,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        [rehypeBaseLinks, { base }],
        [rehypeInlineNetx, { lang: "netx", langs: [netxGrammar, antlrGrammar], theme: netxTheme }],
      ],
    }),
    shikiConfig: {
      theme: netxTheme,
      langs: [netxGrammar, antlrGrammar],
      langAlias: { nxon: "json" },
    },
  },
});
