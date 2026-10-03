import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const runtime = ts.transpileModule(
  fs.readFileSync("src/scripts/browser.ts", "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
).outputText;
function harness(clipboard) {
  const created = [];
  function node(tag = "div") {
    const attrs = {};
    return {
      tag,
      attrs,
      children: [],
      events: {},
      textContent: "",
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute(k, v) {
        attrs[k] = v;
      },
      append(...items) {
        this.children.push(...items);
      },
      prepend(...items) {
        this.children.unshift(...items);
      },
      addEventListener(k, f) {
        this.events[k] = f;
      },
      before() {},
    };
  }
  const button = node("button");
  const meta = node("meta");
  const code = { textContent: 'print("保留缩进")\n  return True' };
  const pre = node("pre");
  pre.querySelector = () => code;
  const doc = {
    documentElement: { dataset: { theme: "dark" } },
    querySelector(selector) {
      return selector === ".theme-toggle" ? button : meta;
    },
    querySelectorAll(selector) {
      return selector === ".content pre" ? [pre] : [];
    },
    createElement(tag) {
      const element = node(tag);
      created.push(element);
      return element;
    },
    createRange() {
      return { selectNodeContents() {} };
    },
  };
  const ctx = {
    document: doc,
    window: {
      matchMedia() {
        return { matches: false, addEventListener() {} };
      },
      getSelection() {
        return { removeAllRanges() {}, addRange() {} };
      },
    },
    localStorage: {
      setItem() {
        throw new Error("SecurityError");
      },
    },
    navigator: { clipboard },
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
  };
  vm.runInNewContext(runtime, ctx);
  return {
    button,
    doc,
    meta,
    copyButton: created.find((n) => n.tag === "button"),
    status: created.find((n) => n.tag === "span"),
  };
}
test("存储读取被拒绝时，首屏主题初始化不抛异常", () => {
  const layout = fs.readFileSync("src/layouts/BaseLayout.astro", "utf8");
  const script = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() =>
    vm.runInNewContext(script, {
      localStorage: {
        getItem() {
          throw new Error("SecurityError");
        },
      },
    }),
  );
});
test("存储写入被拒绝时，切换主题仍更新按钮与浏览器颜色", () => {
  const { button, doc, meta } = harness();
  button.events.click();
  assert.equal(doc.documentElement.dataset.theme, "light");
  assert.equal(button.attrs["aria-label"], "切换深色模式");
  assert.equal(meta.attrs.content, "#f6f4f0");
});
test("复制成功保留代码原文，并提供状态提示", async () => {
  let copied;
  const { copyButton, status } = harness({
    async writeText(value) {
      copied = value;
    },
  });
  await copyButton.events.click();
  assert.equal(copied, 'print("保留缩进")\n  return True');
  assert.equal(status.textContent, "已复制");
});
for (const [label, clipboard] of [
  ["没有剪贴板 API", undefined],
  [
    "剪贴板权限被拒绝",
    {
      async writeText() {
        throw new Error("NotAllowedError");
      },
    },
  ],
]) {
  test(`${label}时提供手动复制提示`, async () => {
    const { copyButton, status } = harness(clipboard);
    await copyButton.events.click();
    assert.equal(copyButton.textContent, "重试复制");
    assert.match(status.textContent, /Ctrl\/Cmd\+C/);
  });
}
