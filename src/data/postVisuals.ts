import basics from "../assets/posts/post-01.png";
import advanced from "../assets/posts/post-02.png";
import encoding from "../assets/posts/post-03.png";
import encryption from "../assets/posts/post-04.png";
import automation from "../assets/posts/post-05.png";
import scrapy from "../assets/posts/post-06.png";
import type { ImageMetadata } from "astro";
import { getPostOrder, type BlogPost } from "../utils/blog";

const covers: Record<number, { image: ImageMetadata; alt: string }> = {
  1: { image: basics, alt: "角色学习请求、解析与存储流程，Python 爬虫知识体系主题插画" },
  2: { image: advanced, alt: "角色调度多路数据流，爬虫并发与进阶主题插画" },
  3: { image: encoding, alt: "角色将字符图块转换成字节积木，字符串与编码主题插画" },
  4: { image: encryption, alt: "角色用钥匙保护数据传输，加密基础主题插画" },
  5: { image: automation, alt: "角色定位浏览器中的页面元素，DrissionPage 自动化主题插画" },
  6: { image: scrapy, alt: "角色搭建采集与解析流水线，Scrapy 框架主题插画" }
};

export const getPostCover = (post: BlogPost) => covers[getPostOrder(post)] ?? covers[1];
