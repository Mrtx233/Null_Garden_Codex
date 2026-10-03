import path from "node:path";
import { slug } from "github-slugger";

// 与 Astro 默认 ID 规则保持一致；加载器和 Markdown 链接共用此函数。
export function getContentId(entry, data = {}) {
  return (
    data.slug ||
    entry
      .replace(/\.md$/i, "")
      .split(/[\\/]/)
      .map((part) => slug(part))
      .join("/")
      .replace(/\/index$/, "")
  );
}

export function getContentRoute(file, data = {}, root = process.cwd()) {
  const relative = path
    .relative(path.join(root, "md"), file)
    .split(path.sep)
    .join("/");
  if (relative.startsWith("../") || path.isAbsolute(relative)) return null;
  if (relative.startsWith("Development-Manual/"))
    return `/development-manual/${getContentId(relative.slice(19), data)}/`;
  if (relative.startsWith("projects/") && !relative.slice(9).includes("/"))
    return `/projects/${getContentId(relative.slice(9), data)}/`;
  if (!relative.includes("/")) return `/blog/${getContentId(relative, data)}/`;
  return null;
}
