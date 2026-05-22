import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./md" }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./md/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    githubUrl: z.string().optional(),
    stack: z.array(z.string()).default([]),
    draft: z.boolean().default(false)
  })
});

export const collections = {
  blog,
  projects
};
