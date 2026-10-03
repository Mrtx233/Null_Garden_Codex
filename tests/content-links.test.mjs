import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import remarkContentLinks from "../scripts/remark-content-links.mjs";
import { getContentId, getContentRoute } from "../scripts/content-routes.mjs";
import { auditSite } from "../scripts/check-links.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "null-garden-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function transform(source, nodes) {
  const tree = { type: "root", children: nodes };
  const file = {
    path: source,
    data: { astro: { frontmatter: {} } },
    fail(message) {
      throw new Error(message);
    },
  };
  // 生产插件以仓库为根；用于临时文件的路由测试由独立 getContentRoute 覆盖。
  remarkContentLinks()(tree, file);
  return tree;
}
test("内容 ID 保留现有中文路径、大小写规范化与空格规则", () => {
  assert.equal(
    getContentId("阶段 1：创建 Django 项目 + 连接 MySQL.md"),
    "阶段-1创建-django-项目--连接-mysql",
  );
  assert.equal(
    getContentId("FastAPI系统阶段开发计划/00_开发步骤总览.md"),
    "fastapi系统阶段开发计划/00_开发步骤总览",
  );
  assert.equal(
    getContentId("01_old.md", { slug: "stable-name" }),
    "stable-name",
  );
});
test("三类内容准确映射路由，并拒绝未扫描的文章子目录", () => {
  const root = "/example";
  assert.equal(
    getContentRoute("/example/md/01_Test.md", {}, root),
    "/blog/01_test/",
  );
  assert.equal(
    getContentRoute("/example/md/projects/01_Test.md", {}, root),
    "/projects/01_test/",
  );
  assert.equal(
    getContentRoute("/example/md/Development-Manual/系列/01_章节.md", {}, root),
    "/development-manual/系列/01_章节/",
  );
  assert.equal(getContentRoute("/example/md/other/test.md", {}, root), null);
  assert.equal(getContentRoute("/outside/test.md", {}, root), null);
});
test("正文链接转换保留查询参数与锚点，兼容引用式链接及编码文件名", () => {
  const source = path.resolve(
    "md/Development-Manual/FastAPI系统阶段开发计划/00_开发步骤总览.md",
  );
  const target = "01_后端基础工程构建.md";
  const nodes = [
    {
      type: "link",
      url: encodeURIComponent(target) + "?from=overview#一阶段目标",
    },
    { type: "definition", url: target },
  ];
  transform(source, nodes);
  assert.equal(
    nodes[0].url,
    "/development-manual/fastapi系统阶段开发计划/01_后端基础工程构建/?from=overview#一阶段目标",
  );
  assert.equal(
    nodes[1].url,
    "/development-manual/fastapi系统阶段开发计划/01_后端基础工程构建/",
  );
});
test("外部链接和纯锚点不被改写；缺失章节明确报错", () => {
  const source = path.resolve("md/01Python爬虫完整系统总结.md");
  const nodes = [
    { type: "link", url: "https://example.com/readme.md" },
    { type: "link", url: "#章节" },
  ];
  transform(source, nodes);
  assert.equal(nodes[0].url, "https://example.com/readme.md");
  assert.equal(nodes[1].url, "#章节");
  assert.throws(
    () => transform(source, [{ type: "link", url: "does-not-exist.md" }]),
    /目标不存在/,
  );
  assert.throws(
    () => transform(source, [{ type: "link", url: "%XX.md" }]),
    /编码无效/,
  );
});
test("站内检查覆盖失效页面、标题锚点和资源，不请求外部网站", (t) => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, "article"));
  fs.writeFileSync(
    path.join(root, "index.html"),
    '<a href="/article/#章节">文章</a><a href="https://example.com/">外部</a><img src="/icon.svg">',
  );
  fs.writeFileSync(
    path.join(root, "article/index.html"),
    '<h2 id="章节">标题</h2>',
  );
  fs.writeFileSync(path.join(root, "icon.svg"), "<svg/>");
  assert.deepEqual(auditSite(root).errors, []);
  fs.writeFileSync(
    path.join(root, "index.html"),
    '<a href="/article/#缺失">锚点</a><a href="chapter.md">章节</a><script src="/missing.js"></script>',
  );
  const result = auditSite(root);
  assert.equal(result.errors.length, 3);
  assert.ok(result.errors.some((error) => error.includes("锚点不存在")));
});
