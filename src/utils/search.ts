import { getCollection } from "astro:content";
import { getPostTitle, getPostDescription, getPostUrl } from "./blog";
import {
  getManualTitle,
  getManualDescription,
  getManualUrl,
  getManualSeriesTitle,
} from "./developmentManual";
import { getProjectUrl } from "./projects";
export interface SearchEntry {
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  text: string;
}
const searchableText = (body = "") =>
  body
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*`|>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export async function getSearchEntries(): Promise<SearchEntry[]> {
  const [blog, projects, manuals] = await Promise.all([
    getCollection("blog", ({ data }) => !data.draft),
    getCollection("projects", ({ data }) => !data.draft),
    getCollection("developmentManual", ({ data }) => !data.draft),
  ]);
  return [
    ...blog.map((entry) => ({
      title: getPostTitle(entry),
      description: getPostDescription(entry),
      url: getPostUrl(entry),
      category: "文章",
      tags: entry.data.tags,
      text: searchableText(entry.body),
    })),
    ...projects.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      url: getProjectUrl(entry),
      category: "项目",
      tags: entry.data.stack,
      text: searchableText(entry.body),
    })),
    ...manuals.map((entry) => ({
      title: getManualTitle(entry),
      description: getManualDescription(entry),
      url: getManualUrl(entry),
      category: "手册",
      tags: [...entry.data.tags, getManualSeriesTitle(entry)],
      text: searchableText(entry.body),
    })),
  ];
}
