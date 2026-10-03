import type { APIRoute } from "astro";
import { getSearchEntries } from "../utils/search";
import { escapeXml } from "../utils/xml";
export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error("请先配置 Astro site 地址");
  const urls = [
    "/",
    "/blog/",
    "/projects/",
    "/development-manual/",
    "/about/",
    ...(await getSearchEntries()).map((entry) => entry.url),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeXml(new URL(url, site).href)}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
