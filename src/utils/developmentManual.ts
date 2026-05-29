import type { CollectionEntry } from "astro:content";

export type DevelopmentManualEntry = CollectionEntry<"developmentManual">;

export interface ManualSeries {
  title: string;
  entries: DevelopmentManualEntry[];
}

const getPathParts = (manual: DevelopmentManualEntry) => manual.id.split("/");

const getDisplayPathParts = (manual: DevelopmentManualEntry) => {
  const filePath = manual.filePath;

  if (!filePath) {
    return getPathParts(manual);
  }

  const parts = filePath.split(/[\\/]/).filter(Boolean);
  const baseIndex = parts.lastIndexOf("Development-Manual");
  const displayParts = baseIndex >= 0 ? parts.slice(baseIndex + 1) : parts;
  const lastIndex = displayParts.length - 1;

  if (lastIndex >= 0) {
    displayParts[lastIndex] = displayParts[lastIndex].replace(/\.md$/i, "");
  }

  return displayParts.length > 0 ? displayParts : getPathParts(manual);
};

const getFileName = (manual: DevelopmentManualEntry) =>
  getDisplayPathParts(manual).pop() ?? manual.id;

const getManualBody = (manual: DevelopmentManualEntry) =>
  ((manual as DevelopmentManualEntry & { body?: string }).body ?? "").trim();

const cleanText = (value: string) =>
  value
    .replace(/^#+\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/`/g, "")
    .replace(/[_-]+/g, " ")
    .trim();

const getStageMatch = (manual: DevelopmentManualEntry) =>
  getFileName(manual).match(/阶段\s*(\d+)/) ??
  getFileName(manual).match(/^(\d+)[_\s-]/);

const isSeriesOverview = (manual: DevelopmentManualEntry) =>
  cleanText(getFileName(manual)) === getManualSeriesTitle(manual);

export const getManualSeriesTitle = (manual: DevelopmentManualEntry) =>
  getDisplayPathParts(manual).length > 1
    ? getDisplayPathParts(manual)[0]
    : "开发手册";

export const getManualOrder = (manual: DevelopmentManualEntry) => {
  if (isSeriesOverview(manual)) {
    return 0;
  }

  const match = getStageMatch(manual);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

export const getManualOrderLabel = (manual: DevelopmentManualEntry) => {
  if (isSeriesOverview(manual)) {
    return "总览";
  }

  const match = getStageMatch(manual);
  return match ? `阶段 ${match[1]}` : "手册";
};

export const getManualTitle = (manual: DevelopmentManualEntry) => {
  if (manual.data.title) {
    return manual.data.title;
  }

  const fileTitle = cleanText(getFileName(manual));

  if (fileTitle) {
    return fileTitle;
  }

  const heading = getManualBody(manual)
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));

  return heading ? cleanText(heading) : manual.id;
};

export const getManualDescription = (manual: DevelopmentManualEntry) => {
  if (manual.data.description) {
    return manual.data.description;
  }

  const paragraph = getManualBody(manual)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !line.startsWith("#") &&
        !line.startsWith("|") &&
        line !== "---" &&
        !line.startsWith("```")
    );

  return paragraph
    ? cleanText(paragraph)
    : `${getManualTitle(manual)} 的阶段开发手册。`;
};

export const getManualUrl = (manual: DevelopmentManualEntry) =>
  `/development-manual/${manual.id}/`;

export const getManualSeriesAnchor = (seriesTitle: string) =>
  seriesTitle
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "");

export const sortManualsBySeriesOrder = (manuals: DevelopmentManualEntry[]) =>
  [...manuals].sort((a, b) => {
    const seriesDiff = getManualSeriesTitle(a).localeCompare(
      getManualSeriesTitle(b),
      "zh-CN",
      { numeric: true }
    );

    if (seriesDiff !== 0) {
      return seriesDiff;
    }

    const orderDiff = getManualOrder(a) - getManualOrder(b);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return getFileName(a).localeCompare(getFileName(b), "zh-CN", {
      numeric: true
    });
  });

export const groupManualsBySeries = (
  manuals: DevelopmentManualEntry[]
): ManualSeries[] => {
  const grouped = new Map<string, DevelopmentManualEntry[]>();

  for (const manual of sortManualsBySeriesOrder(manuals)) {
    const seriesTitle = getManualSeriesTitle(manual);
    grouped.set(seriesTitle, [...(grouped.get(seriesTitle) ?? []), manual]);
  }

  return [...grouped.entries()].map(([title, entries]) => ({ title, entries }));
};
