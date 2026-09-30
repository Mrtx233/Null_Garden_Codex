import type { CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

const getFileName = (project: ProjectEntry) =>
  project.id.split("/").pop() ?? project.id;

const getOrderMatch = (project: ProjectEntry) => getFileName(project).match(/^(\d+)/);

export const getProjectOrder = (project: ProjectEntry) => {
  const match = getOrderMatch(project);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

export const getProjectOrderLabel = (project: ProjectEntry) => {
  const match = getOrderMatch(project);
  return match ? `项目 ${match[1]}` : "项目";
};

export const getProjectTitle = (project: ProjectEntry) => project.data.title;

export const getProjectDescription = (project: ProjectEntry) =>
  project.data.description;

export const getProjectUrl = (project: ProjectEntry) => `/projects/${project.id}/`;

export const getProjectGithubLabel = (project: ProjectEntry) =>
  project.data.githubUrl?.trim() ? "GitHub 已填写" : "GitHub 链接待填写";

export const sortProjectsByFileOrder = (projects: ProjectEntry[]) =>
  [...projects].sort((a, b) => {
    const orderDiff = getProjectOrder(a) - getProjectOrder(b);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return getFileName(a).localeCompare(getFileName(b), "zh-CN", {
      numeric: true
    });
  });
