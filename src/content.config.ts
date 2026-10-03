import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { getContentId } from "../scripts/content-routes.mjs";

const text = z.string().trim().min(1);
const slug = text
  .regex(
    /^[\p{Letter}\p{Number}_-]+(?:\/[\p{Letter}\p{Number}_-]+)*$/u,
    "slug 必须由文字、数字、下划线、连字符或路径段组成",
  )
  .optional();
const common = {
  title: text,
  description: text,
  slug,
  draft: z.boolean().default(false),
};
const generateId = ({
  entry,
  data,
}: {
  entry: string;
  data: Record<string, unknown>;
}) => getContentId(entry, data);

const blog = defineCollection({
  loader: glob({ pattern: "*.md", base: "./md", generateId }),
  schema: z
    .object({
      ...common,
      pubDate: z.coerce.date().optional(),
      tags: z.array(text).default([]),
    })
    .strict(),
});

const projects = defineCollection({
  loader: glob({ pattern: "*.md", base: "./md/projects", generateId }),
  schema: z
    .object({
      ...common,
      githubUrl: z.url({ protocol: /^https$/ }).optional(),
      repositoryVisibility: z.enum(["public", "private"]).optional(),
      stack: z.array(text).min(1, "请用 stack 填写项目技术栈"),
      featured: z.boolean().default(false),
    })
    .strict(),
});

const developmentManual = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./md/Development-Manual",
    generateId,
  }),
  schema: z
    .object({
      ...common,
      tags: z.array(text).default([]),
      overview: z.boolean().default(false),
    })
    .strict(),
});

export const collections = { blog, projects, developmentManual };
