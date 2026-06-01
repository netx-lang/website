import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    /** Optional short label for the sidebar (falls back to `title`). */
    nav: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { docs };
