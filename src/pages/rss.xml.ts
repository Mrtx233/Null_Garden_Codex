import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { sortPostsByLatest, getPostUrl } from "../utils/blog";
import { escapeXml } from "../utils/xml";
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("请先配置 Astro site 地址");
  const posts = sortPostsByLatest(
    await getCollection("blog", ({ data }) => !data.draft),
  );
  const items = posts
    .map((post) => {
      const url = escapeXml(new URL(getPostUrl(post), site).href);
      return `<item><title>${escapeXml(post.data.title)}</title><description>${escapeXml(post.data.description)}</description><link>${url}</link><guid isPermaLink="true">${url}</guid>${post.data.pubDate ? `<pubDate>${post.data.pubDate.toUTCString()}</pubDate>` : ""}${post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}</item>`;
    })
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Null Garden | LV MA</title><link>${escapeXml(site.href)}</link><description>技术学习、项目实践与个人思考。</description><language>zh-CN</language><atom:link href="${escapeXml(new URL("/rss.xml", site).href)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
};
