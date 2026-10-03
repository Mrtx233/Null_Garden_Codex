const sections = [...document.querySelectorAll<HTMLElement>("[data-home-section]")];
const desktop = window.matchMedia(
  "(min-width: 821px) and (min-height: 600px) and (hover: hover) and (pointer: fine)",
);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const rails = sections.map((section) => ({
  section,
  rail: section.querySelector<HTMLElement>("[data-home-rail]")!,
  start: 0,
  distance: 0,
  appliedOffset: 0,
}));

type Rail = (typeof rails)[number];
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(value, maximum));

// 保留浏览器原生纵向滚动，用 sticky 的停留距离映射卡片的横向位移。
// 不拦截滚轮，因此快速滚动、键盘、返回顶部与反向滚动使用同一套进度。
function syncScroll() {
  for (const item of rails) {
    if (item.section.hasAttribute("data-home-pinned")) {
      item.appliedOffset = clamp(window.scrollY - item.start, item.distance);
      item.rail.scrollLeft = item.appliedOffset;
    }
  }
}

let frame = 0;
function scheduleScroll() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    syncScroll();
  });
}

function measure() {
  const pinned = desktop.matches && !reducedMotion.matches;
  for (const item of rails) {
    item.distance = Math.max(0, item.rail.scrollWidth - item.rail.clientWidth);
    item.section.style.setProperty("--home-scroll-distance", `${item.distance}px`);
    item.section.toggleAttribute("data-home-pinned", pinned && item.distance > 0);
  }
  // 必须等所有板块高度更新后再读取起点，避免后面的板块使用旧位置。
  for (const item of rails) {
    item.start = item.section.getBoundingClientRect().top + window.scrollY;
  }
  syncScroll();
}

function moveTo(item: Rail, offset: number) {
  const target = clamp(offset, item.distance);
  if (item.section.hasAttribute("data-home-pinned")) {
    window.scrollTo({ top: item.start + target, behavior: "instant" });
    syncScroll();
  } else {
    item.rail.scrollTo({
      left: target,
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }
}

for (const item of rails) {
  function moveByCard(direction: number) {
    const cards = [...item.rail.children] as HTMLElement[];
    const step = cards.length > 1
      ? cards[1].offsetLeft - cards[0].offsetLeft : item.rail.clientWidth;
    moveTo(item, item.rail.scrollLeft + step * direction);
  }
  item.rail.addEventListener("keydown", (event) => {
    // 保留卡片内链接和其他控件自己的按键行为。
    if (event.target !== item.rail) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveByCard(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveTo(item, event.key === "Home" ? 0 : item.distance);
    }
  });
  item.rail.addEventListener("focusin", (event) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>("article");
    if (!card) return;
    const first = item.rail.firstElementChild as HTMLElement;
    const left = card.offsetLeft - first.offsetLeft;
    const right = left + card.offsetWidth;
    if (left < item.rail.scrollLeft) moveTo(item, left);
    else if (right > item.rail.scrollLeft + item.rail.clientWidth) {
      moveTo(item, right - item.rail.clientWidth);
    }
  });
  item.rail.addEventListener("scroll", () => {
    // 触控板直接横滑时也同步纵向进度，避免下一次滚轮让卡片跳回。
    if (item.section.hasAttribute("data-home-pinned")) {
      const progress = window.scrollY - item.start;
      if (progress >= 0 && progress <= item.distance
        && Math.abs(item.rail.scrollLeft - item.appliedOffset) > 1) {
        item.appliedOffset = item.rail.scrollLeft;
        window.scrollTo({ top: item.start + item.rail.scrollLeft, behavior: "instant" });
      }
    }
  }, { passive: true });
}

if (rails.length) {
  measure();
  window.addEventListener("scroll", scheduleScroll, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("pageshow", measure);
  desktop.addEventListener("change", measure);
  reducedMotion.addEventListener("change", measure);
  document.fonts.ready.then(measure);
}
