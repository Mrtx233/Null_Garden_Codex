const root = document.documentElement;
const themeToggle = document.querySelector<HTMLButtonElement>(".theme-toggle");
function syncTheme() {
  const light = root.dataset.theme === "light";
  themeToggle?.setAttribute(
    "aria-label",
    light ? "切换深色模式" : "切换浅色模式",
  );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", light ? "#f6f4f0" : "#0b0f14");
}
syncTheme();
themeToggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* 浏览器禁用存储时，本页切换仍然生效。 */
  }
  syncTheme();
});

const wideScreen = window.matchMedia("(min-width: 981px)");
function syncNavigation() {
  document
    .querySelectorAll<HTMLDetailsElement>("[data-desktop-open]")
    .forEach((panel) => {
      panel.open = wideScreen.matches;
    });
}
syncNavigation();
wideScreen.addEventListener("change", syncNavigation);

// 代码块使用容器承载操作栏，复制按钮不覆盖或随代码横向滚动。
document.querySelectorAll<HTMLPreElement>(".content pre").forEach((pre) => {
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";
  pre.before(wrapper);
  wrapper.append(pre);
  const toolbar = document.createElement("div");
  toolbar.className = "code-toolbar";
  const button = document.createElement("button");
  button.className = "copy-btn";
  button.type = "button";
  button.textContent = "复制";
  button.setAttribute("aria-label", "复制代码");
  const status = document.createElement("span");
  status.className = "copy-status";
  status.setAttribute("role", "status");
  toolbar.append(status, button);
  wrapper.prepend(toolbar);
  let timer: ReturnType<typeof setTimeout>;
  button.addEventListener("click", async () => {
    const code = pre.querySelector("code") ?? pre;
    const text = code.textContent ?? "";
    clearTimeout(timer);
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      status.textContent = "已复制";
      button.textContent = "已复制";
      button.classList.add("is-copied");
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent =
        "自动复制失败，请选中代码后按 Ctrl/Cmd+C，或长按复制。";
      button.textContent = "重试复制";
    }
    timer = setTimeout(() => {
      status.textContent = "";
      button.textContent = "复制";
      button.classList.remove("is-copied");
    }, 5000);
  });
});

const links = [...document.querySelectorAll<HTMLAnchorElement>(".toc-link")];
const headings = links
  .map((link) => {
    try {
      return document.getElementById(decodeURIComponent(link.hash.slice(1)));
    } catch {
      return null;
    }
  })
  .filter((heading): heading is HTMLElement => Boolean(heading));
let pending = false;
function syncActiveToc() {
  let current = headings[0];
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= 120) current = heading;
    else break;
  }
  links.forEach((link) => {
    const active =
      link.hash.slice(1) === encodeURIComponent(current?.id ?? "") ||
      decodeURIComponent(link.hash.slice(1)) === current?.id;
    link.classList.toggle("is-current", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  pending = false;
}
if (headings.length) {
  syncActiveToc();
  window.addEventListener(
    "scroll",
    () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(syncActiveToc);
      }
    },
    { passive: true },
  );
  document
    .querySelectorAll<HTMLAnchorElement>(".content a[href^='#']")
    .forEach((link) => {
      link.addEventListener("click", () => {
        links
          .find((item) => item.hash === link.hash)
          ?.closest<HTMLDetailsElement>(".toc-children")
          ?.setAttribute("open", "");
      });
    });
}
