import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { getContentRoute } from "./content-routes.mjs";

export default function remarkContentLinks() {
  return (tree, file) => {
    function walk(node) {
      if (
        (node.type === "link" || node.type === "definition") &&
        typeof node.url === "string"
      ) {
        const url = node.url;
        if (!/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) {
          const match = url.match(/^([^?#]+\.md)(\?[^#]*)?(#.*)?$/i);
          if (match) {
            let target;
            try {
              target = path.resolve(
                path.dirname(file.path),
                decodeURIComponent(match[1]),
              );
            } catch {
              file.fail(`Markdown 链接编码无效：${url}`, node);
            }
            if (!target || !fs.existsSync(target))
              file.fail(`Markdown 链接目标不存在：${url}`, node);
            const { frontmatter } = parseFrontmatter(
              fs.readFileSync(target, "utf8"),
            );
            const route = getContentRoute(target, frontmatter);
            if (!route)
              file.fail(`Markdown 链接目标不在内容集合中：${url}`, node);
            if (frontmatter.draft && !file.data.astro?.frontmatter?.draft)
              file.fail(`公开内容不能链接到草稿：${url}`, node);
            node.url = route + (match[2] || "") + (match[3] || "");
          }
        }
      }
      for (const child of node.children || []) walk(child);
    }
    walk(tree);
  };
}
