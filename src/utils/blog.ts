import type { CollectionEntry } from "astro:content";
export type BlogPost = CollectionEntry<"blog">;
const getFileName = (post: BlogPost) =>
  (post.filePath ?? post.id).split(/[\\/]/).pop() ?? post.id;
const getOrderMatch = (post: BlogPost) => getFileName(post).match(/^(\d+)/);
export const getPostOrder = (post: BlogPost) =>
  Number(getOrderMatch(post)?.[1] ?? Number.MAX_SAFE_INTEGER);
export const getPostOrderLabel = (post: BlogPost) =>
  getOrderMatch(post) ? `第 ${getOrderMatch(post)![1]} 篇` : "笔记";
export const getPostTitle = (post: BlogPost) => post.data.title;
export const getPostDescription = (post: BlogPost) => post.data.description;
export const getPostUrl = (post: BlogPost) => `/blog/${post.id}/`;
export const sortPostsByFileOrder = (posts: BlogPost[]) =>
  [...posts].sort(
    (a, b) =>
      getPostOrder(a) - getPostOrder(b) ||
      getFileName(a).localeCompare(getFileName(b), "zh-CN", { numeric: true }),
  );
export const sortPostsByLatest = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => {
    if (a.data.pubDate && b.data.pubDate) {
      const dateOrder = b.data.pubDate.getTime() - a.data.pubDate.getTime();
      if (dateOrder) return dateOrder;
    } else if (a.data.pubDate || b.data.pubDate) {
      return a.data.pubDate ? -1 : 1;
    }
    // 无编号内容放到最后，不能把 MAX_SAFE_INTEGER 当作最新编号。
    const aOrder = getOrderMatch(a);
    const bOrder = getOrderMatch(b);
    if (!aOrder || !bOrder) {
      if (aOrder || bOrder) return aOrder ? -1 : 1;
    } else {
      const numberOrder = Number(bOrder[1]) - Number(aOrder[1]);
      if (numberOrder) return numberOrder;
    }
    return getFileName(a).localeCompare(getFileName(b), "zh-CN", {
      numeric: true,
    });
  });
