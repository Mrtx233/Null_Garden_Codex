import django from "../assets/manuals/django.png";
import fastapi from "../assets/manuals/fastapi.png";
import flask from "../assets/manuals/flask.png";
import crawler from "../assets/manuals/python-crawler.png";
import type { ImageMetadata } from "astro";
import { getManualSeriesAnchor } from "../utils/developmentManual";

const covers: Record<string, { image: ImageMetadata; alt: string }> = {
  "django系统阶段开发计划": {
    image: django,
    alt: "角色从数据库底座搭建业务模块与权限，Django 阶段开发专栏插画"
  },
  "fastapi系统阶段开发计划": {
    image: fastapi,
    alt: "角色连接 API 服务与前端页面，FastAPI 阶段开发专栏插画"
  },
  "flask-系统阶段开发计划": {
    image: flask,
    alt: "角色为轻量应用连接扩展模块，Flask 阶段开发专栏插画"
  },
  "python爬虫阶段学习": {
    image: crawler,
    alt: "角色沿采集、解析、并发与存储路线学习，Python 爬虫专栏插画"
  }
};

export const getManualSeriesCover = (title: string) =>
  covers[getManualSeriesAnchor(title)] ?? covers["django系统阶段开发计划"];
