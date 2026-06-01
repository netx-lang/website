#!/usr/bin/env node
// Structural check that the Chinese docs still mirror the English docs.
// It compares headings, code blocks, table rows, and the `order` field, so a
// revised English section is flagged until the translation is updated.
//
// Usage: node tools/check-translations.mjs

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const docsDir = join(here, "..", "src", "content", "docs");

function stats(file) {
  const text = readFileSync(file, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const orderMatch = fm && /order:\s*(\d+)/.exec(fm[1]);
  const order = orderMatch ? Number(orderMatch[1]) : null;
  const body = text
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, "");
  return {
    order,
    headings: (body.match(/^#{1,6}\s/gm) || []).length,
    fences: (text.match(/^```/gm) || []).length / 2,
    tables: (text.match(/^\|/gm) || []).length,
  };
}

const slugs = readdirSync(join(docsDir, "en"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

let problems = 0;
for (const slug of slugs) {
  const en = stats(join(docsDir, "en", `${slug}.md`));
  let zh;
  try {
    zh = stats(join(docsDir, "zh", `${slug}.md`));
  } catch {
    console.log(`MISSING  zh/${slug}.md`);
    problems++;
    continue;
  }
  const diffs = [];
  if (en.headings !== zh.headings) diffs.push(`headings ${en.headings}→${zh.headings}`);
  if (en.fences !== zh.fences) diffs.push(`code blocks ${en.fences}→${zh.fences}`);
  if (en.tables !== zh.tables) diffs.push(`table rows ${en.tables}→${zh.tables}`);
  if (en.order !== zh.order) diffs.push(`order ${en.order}→${zh.order}`);
  if (diffs.length) {
    console.log(`DIFF     ${slug}: ${diffs.join(", ")}`);
    problems++;
  } else {
    console.log(`ok       ${slug}`);
  }
}

console.log(
  problems
    ? `\n${problems} file(s) need attention.`
    : "\nAll translations are structurally in sync."
);
process.exit(problems ? 1 : 0);
