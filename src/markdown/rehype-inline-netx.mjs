// Rehype plugin: highlight inline code spans with the NetX grammar.
//
// Astro/Shiki already highlights fenced code blocks at build time. This plugin
// extends that to `inline code` (excluding links and explicit non-NetX cases),
// so NetX snippets read with the same colours as the surrounding code blocks.

import { createHighlighter } from "shiki";

let highlighterPromise;

function getHighlighter(options) {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [options.theme],
      langs: options.langs,
    });
  }
  return highlighterPromise;
}

// Inline code that should stay plain (URLs, e-mail addresses).
const SKIP = /^(https?:\/\/|mailto:)/i;

function textOf(node) {
  if (node.type === "text") return node.value;
  if (!node.children) return "";
  return node.children.map(textOf).join("");
}

export default function rehypeInlineNetx(options = {}) {
  const lang = options.lang || "netx";
  const themeName = options.theme?.name;

  return async (tree) => {
    const hl = await getHighlighter(options);

    const visit = (node) => {
      if (!node || !node.children) return;
      const inPre = node.type === "element" && node.tagName === "pre";
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === "element" && child.tagName === "code" && !inPre) {
          const classes = child.properties?.className ?? [];
          // leave math (handled by KaTeX) alone
          if (classes.some((c) => /math/.test(String(c)))) continue;
          const text = textOf(child);
          if (!text || SKIP.test(text)) continue;
          let tokens;
          try {
            ({ tokens } = hl.codeToTokens(text, { lang, theme: themeName }));
          } catch {
            continue;
          }
          const children = [];
          for (const line of tokens) {
            for (const token of line) {
              if (!token.content) continue;
              const styles = [];
              if (token.color) styles.push(`color:${token.color}`);
              if (token.fontStyle & 1) styles.push("font-style:italic");
              if (token.fontStyle & 2) styles.push("font-weight:bold");
              children.push({
                type: "element",
                tagName: "span",
                properties: styles.length ? { style: styles.join(";") } : {},
                children: [{ type: "text", value: token.content }],
              });
            }
          }
          node.children[i] = {
            type: "element",
            tagName: "code",
            properties: { className: ["netx-inline"] },
            children,
          };
        } else {
          visit(child);
        }
      }
    };

    visit(tree);
  };
}
