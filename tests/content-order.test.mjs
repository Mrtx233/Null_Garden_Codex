import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(code, { exports });
  return exports;
}
const blog = load("src/utils/blog.ts");
const manuals = load("src/utils/developmentManual.ts");
const post = (number, date, slug = `post-${number}`) => ({
  id: slug,
  filePath: `md/${number}_文章.md`,
  data: {
    title: `文章 ${number}`,
    description: "摘要",
    ...(date ? { pubDate: new Date(date) } : {}),
  },
});
test("首页按真实日期倒序，缺日期时按编号倒序；列表维持学习顺序", () => {
  const entries = [
    post("01", "2026-10-02"),
    post("02"),
    post("03", "2026-10-01"),
    post("07"),
  ];
  assert.deepEqual(
    Array.from(blog.sortPostsByLatest(entries), (item) => item.id),
    ["post-01", "post-03", "post-07", "post-02"],
  );
  assert.deepEqual(
    Array.from(blog.sortPostsByFileOrder(entries), (item) => item.id),
    ["post-01", "post-02", "post-03", "post-07"],
  );
});
test("自定义 slug 不影响按原始文件编号排序", () => {
  assert.equal(blog.getPostOrder(post("08", undefined, "fixed-url")), 8);
  assert.equal(
    blog.getPostOrderLabel(post("08", undefined, "fixed-url")),
    "第 08 篇",
  );
});
test("最新排序将无编号笔记放到最后，真实历史日期也优先于无日期内容", () => {
  const entries = [post("随笔"), post("07"), post("01", "1960-01-01")];
  assert.deepEqual(
    Array.from(blog.sortPostsByLatest(entries), (item) => item.id),
    ["post-01", "post-07", "post-随笔"],
  );
});
test("00 文件和显式 overview 都显示总览，阶段导航只在系列内排序", () => {
  const manual = (file, overview = false) => ({
    id: file,
    filePath: `md/Development-Manual/学习系列/${file}.md`,
    data: { title: file, description: "摘要", overview },
  });
  assert.equal(manuals.getManualOrderLabel(manual("00_总览")), "总览");
  assert.equal(manuals.getManualOrder(manual("介绍", true)), 0);
  const groups = manuals.groupManualsBySeries([
    manual("02_进阶"),
    manual("00_总览"),
    manual("01_基础"),
  ]);
  assert.deepEqual(
    Array.from(groups[0].entries, (item) => item.id),
    ["00_总览", "01_基础", "02_进阶"],
  );
});
