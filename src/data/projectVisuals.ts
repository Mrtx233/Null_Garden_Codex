import search from "../assets/projects/project-01.png";
import documents from "../assets/projects/project-02.png";
import joyfit from "../assets/projects/project-03.png";
import football from "../assets/projects/project-04.png";
import cosplay from "../assets/projects/project-05.png";
import fastapi from "../assets/projects/project-06.png";
import crawler from "../assets/projects/project-07.png";
import crawlerPro from "../assets/projects/project-08.png";
import crawlerJson from "../assets/projects/project-09.png";
import question from "../assets/projects/project-10.png";
import blueprint from "../assets/projects/project-11.png";
import article from "../assets/projects/project-12.png";
import type { ImageMetadata } from "astro";
import { getProjectOrder, type ProjectEntry } from "../utils/projects";

const covers: Record<number, { image: ImageMetadata; alt: string }> = {
  1: { image: search, alt: "角色查找相似表格并归档，模糊搜索主题插画" },
  2: { image: documents, alt: "角色将公开资讯整理到文档库，政务信息采集主题插画" },
  3: { image: joyfit, alt: "角色管理会员卡与课程表，JoyFit 健身管理主题插画" },
  4: { image: football, alt: "角色整理战术板与球员位置，足球俱乐部管理主题插画" },
  5: { image: cosplay, alt: "角色安排活动与预约，CosVerse 服务平台主题插画" },
  6: { image: fastapi, alt: "角色连接前后端模块并保护数据，FastAPI 健身系统主题插画" },
  7: { image: crawler, alt: "角色将商品信息整理成表格并导出，电商数据采集主题插画" },
  8: { image: crawlerPro, alt: "角色在工作台连接采集、处理与导出模块，爬虫流水线主题插画" },
  9: { image: crawlerJson, alt: "角色整理结构化数据与分析图表，JSON 数据分析主题插画" },
  10: { image: question, alt: "角色用放大镜识别含图题目，OCR 题目采集主题插画" },
  11: { image: blueprint, alt: "角色绘制模块关系与数据库蓝图，AI 软件架构主题插画" },
  12: { image: article, alt: "角色在电脑前研究资料并写作，AI 文章创作主题插画" }
};

export const getProjectCover = (project: ProjectEntry) => covers[getProjectOrder(project)] ?? covers[11];
