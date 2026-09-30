import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

const getFileName = (post: BlogPost) => post.id.split("/").pop() ?? post.id;

const getPostBody = (post: BlogPost) =>
  ((post as BlogPost & { body?: string }).body ?? "").trim();

const getOrderMatch = (post: BlogPost) => getFileName(post).match(/^(\d+)/);

const cleanText = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|~~|`/g, "")
    .trim();

// 文章正文以固定签名开场，简介需跳过该行取真正的内容段落
const isGreetingLine = (line: string) => /^大家好[，,]?\s*我是/.test(line);

export const getPostOrder = (post: BlogPost) => {
  const match = getOrderMatch(post);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

export const getPostOrderLabel = (post: BlogPost) => {
  const match = getOrderMatch(post);
  return match ? `第 ${match[1]} 篇` : "笔记";
};

export const getPostTitle = (post: BlogPost) => {
  if (post.data.title) {
    return post.data.title;
  }

  const heading = getPostBody(post)
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));

  if (heading) {
    return cleanText(heading);
  }

  return getFileName(post)
    .replace(/^\d+/, "")
    .replace(/[_-]+/g, " ")
    .trim();
};

export const getPostDescription = (post: BlogPost) => {
  if (post.data.description) {
    return post.data.description;
  }

  const paragraph = getPostBody(post)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !line.startsWith("#") &&
        line !== "---" &&
        !line.startsWith("```") &&
        !isGreetingLine(line)
    );

  return paragraph ? cleanText(paragraph) : `${getPostTitle(post)} 的整理笔记。`;
};

export const getPostUrl = (post: BlogPost) => `/blog/${post.id}/`;

export const sortPostsByFileOrder = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => {
    const orderDiff = getPostOrder(a) - getPostOrder(b);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return getFileName(a).localeCompare(getFileName(b), "zh-CN", {
      numeric: true
    });
  });
