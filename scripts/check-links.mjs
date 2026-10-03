import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

export function auditSite(
  directory,
  origin = "https://null-garden.netlify.app",
) {
  const root = path.resolve(directory);
  function files(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? files(path.join(dir, entry.name))
          : [path.join(dir, entry.name)],
      );
  }
  function walk(node, visit) {
    visit(node);
    for (const child of node.childNodes ?? []) walk(child, visit);
  }
  const pages = new Map();
  const errors = [];
  for (const file of files(root).filter((file) => file.endsWith(".html"))) {
    const url =
      "/" +
      path
        .relative(root, file)
        .split(path.sep)
        .join("/")
        .replace(/index\.html$/, "");
    const info = { ids: new Set(), references: [] };
    walk(parse(fs.readFileSync(file, "utf8")), (node) => {
      const attrs = Object.fromEntries(
        (node.attrs ?? []).map((attr) => [attr.name, attr.value]),
      );
      if (attrs.id) {
        if (info.ids.has(attrs.id)) errors.push(`${url}：重复 id #${attrs.id}`);
        info.ids.add(attrs.id);
      }
      if (node.tagName === "a" || node.tagName === "link") {
        if (attrs.href) info.references.push(attrs.href);
      }
      if (node.tagName === "script" || node.tagName === "img") {
        if (attrs.src) info.references.push(attrs.src);
      }
    });
    pages.set(url, info);
  }
  let references = 0;
  function check(url, reference) {
    let target;
    try {
      target = new URL(reference, origin + url);
    } catch {
      errors.push(`${url}：无效链接 ${reference}`);
      return;
    }
    if (target.origin !== origin) return;
    references++;
    let pathname, hash;
    try {
      pathname = decodeURIComponent(target.pathname);
      hash = decodeURIComponent(target.hash.slice(1));
    } catch {
      errors.push(`${url}：无效 URL 编码 ${reference}`);
      return;
    }
    const relative = pathname.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) && file !== root) {
      errors.push(`${url}：链接越出发布目录 ${reference}`);
      return;
    }
    const page =
      pages.get(pathname) ??
      pages.get(pathname + "/") ??
      pages.get(pathname.replace(/index\.html$/, ""));
    if (!page && (!fs.existsSync(file) || fs.statSync(file).isDirectory()))
      errors.push(`${url}：目标不存在 ${reference}`);
    else if (page && hash && !page.ids.has(hash))
      errors.push(`${url}：锚点不存在 ${reference}`);
  }
  for (const [url, page] of pages)
    for (const reference of page.references) check(url, reference);
  const indexFile = path.join(root, "search-index.json");
  if (fs.existsSync(indexFile))
    for (const entry of JSON.parse(fs.readFileSync(indexFile, "utf8")))
      check("/search/", entry.url);
  return { pages: pages.size, references, errors };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!fs.existsSync("dist")) {
    console.error("请先生成 dist/。");
    process.exit(1);
  }
  const result = auditSite("dist");
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  }
  console.log(
    `链接检查：${result.pages} 个页面，${result.references} 处站内引用，${result.errors.length} 个错误。`,
  );
}
