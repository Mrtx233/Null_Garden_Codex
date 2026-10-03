import type { SearchEntry } from "../utils/search";
const form = document.querySelector<HTMLFormElement>(".search-form")!;
const query = document.querySelector<HTMLInputElement>("#search-query")!;
const category = document.querySelector<HTMLSelectElement>("#search-category")!;
const tag = document.querySelector<HTMLSelectElement>("#search-tag")!;
const status = document.querySelector<HTMLParagraphElement>("#search-status")!;
const results = document.querySelector<HTMLDivElement>("#search-results")!;
const params = new URLSearchParams(location.search);
query.value = params.get("q") ?? "";
category.value = params.get("category") ?? "";
tag.value = params.get("tag") ?? "";
let index: Promise<SearchEntry[]> | undefined;
let version = 0;
let debounce: ReturnType<typeof setTimeout>;
function loadIndex() {
  return (index ??= fetch("/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error("search index unavailable");
      return response.json() as Promise<SearchEntry[]>;
    })
    .catch((error) => {
      index = undefined;
      throw error;
    }));
}
async function search() {
  const request = ++version;
  const terms = query.value
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  results.replaceChildren();
  if (!terms.length && !category.value && !tag.value) {
    status.textContent = "输入关键词开始搜索，或选择分类与标签。";
    return;
  }
  status.textContent = "正在查找…";
  try {
    const entries = await loadIndex();
    if (request !== version) return;
    const matches = entries
      .filter(
        (entry) =>
          (!category.value || entry.category === category.value) &&
          (!tag.value || entry.tags.includes(tag.value)),
      )
      .map((entry) => {
        const primary =
          `${entry.title} ${entry.description} ${entry.tags.join(" ")}`.toLocaleLowerCase();
        const full = `${primary} ${entry.text}`.toLocaleLowerCase();
        return {
          entry,
          match: terms.every((term) => full.includes(term)),
          score: terms.reduce(
            (sum, term) =>
              sum +
              (entry.title.toLocaleLowerCase().includes(term)
                ? 3
                : primary.includes(term)
                  ? 1
                  : 0),
            0,
          ),
        };
      })
      .filter((item) => item.match)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.entry.title.localeCompare(b.entry.title, "zh-CN", {
            numeric: true,
          }),
      );
    status.textContent = matches.length
      ? `找到 ${matches.length} 条内容。`
      : "没有找到匹配内容，试试更短的关键词或取消筛选。";
    const fragment = document.createDocumentFragment();
    matches.forEach(({ entry }) => {
      const card = document.createElement("article");
      card.className = "post-card";
      const meta = document.createElement("p");
      meta.className = "post-meta";
      meta.textContent = `${entry.category} · ${entry.tags.join(" / ")}`;
      const heading = document.createElement("h2");
      const link = document.createElement("a");
      link.href = entry.url;
      link.textContent = entry.title;
      heading.append(link);
      const description = document.createElement("p");
      description.textContent = entry.description;
      card.append(meta, heading, description);
      if (
        terms.length &&
        !`${entry.title} ${entry.description}`
          .toLocaleLowerCase()
          .includes(terms[0])
      ) {
        const position = entry.text.toLocaleLowerCase().indexOf(terms[0]);
        if (position >= 0) {
          const snippet = document.createElement("p");
          snippet.className = "search-snippet";
          const start = Math.max(0, position - 35);
          snippet.textContent = `${start ? "…" : ""}${entry.text.slice(start, start + 150)}…`;
          card.append(snippet);
        }
      }
      fragment.append(card);
    });
    results.append(fragment);
  } catch {
    if (request === version)
      status.textContent = "搜索暂时无法加载，请检查网络后再次搜索。";
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(debounce);
  const params = new URLSearchParams();
  if (query.value.trim()) params.set("q", query.value.trim());
  if (category.value) params.set("category", category.value);
  if (tag.value) params.set("tag", tag.value);
  history.replaceState(null, "", `/search/${params.size ? `?${params}` : ""}`);
  void search();
});
query.addEventListener("input", () => {
  clearTimeout(debounce);
  ++version;
  debounce = setTimeout(() => void search(), 180);
});
category.addEventListener("change", () => {
  clearTimeout(debounce);
  void search();
});
tag.addEventListener("change", () => {
  clearTimeout(debounce);
  void search();
});
void search();
