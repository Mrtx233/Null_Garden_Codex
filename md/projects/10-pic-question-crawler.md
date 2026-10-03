---
title: "PicQuestionCrawler｜含图题目采集与答案 OCR"
description: "通过浏览器采集含题干图片的题目，整理题干、子问题、知识点和答案图片，再用 RapidOCR 提取答案与解析，支持按题目 ID 去重和失败续采。"
githubUrl: "https://github.com/Mrtx233/PicQuestionCrawler"
repositoryVisibility: private
draft: false
featured: true
stack:
  - Python
  - DrissionPage
  - BeautifulSoup
  - RapidOCR
---

# PicQuestionCrawler｜含图题目采集与答案 OCR

## 项目定位

这是我面向含图题目数据整理开发的采集 Demo。项目将题目链接收集、详情与图片下载、答案 OCR 分成三个脚本，最终得到可继续清洗和分析的结构化题目 JSON。

当前入口针对组卷网站中的含题干图片题目，优先完成数据闭环，没有构建通用题库平台或高并发采集服务。

仓库没有根目录 README，本篇依据 `Collection Project.md` 和三个实际脚本整理，阅读日期为 **2026 年 10 月 3 日**。仓库当前为私有仓库，源码链接需要访问权限。

## 三步工作流

```text
collect_links.py
  → 列表页筛选含图题目
  → outputs/json/links.jsonl

collect_details.py
  → 读取题目链接、采集详情与图片
  → outputs/json/questions.json

ocr_answers.py
  → 识别本地答案图片
  → 回写答案全文、答案与解析
```

三个脚本依赖前一步的输出文件。OCR 不负责采集网页，没有 `questions.json` 时会直接报告缺少输入。

## 核心能力

### 含图链接筛选与去重

浏览器打开列表页后，使用 BeautifulSoup 解析页面，筛选含题干图片的题目地址。已有记录按题目 ID 去重，每新增一条立即追加到 JSONL，并执行 flush 与 fsync。

分页数由 `MAX_PAGES` 控制，当前默认只读取一页，便于小范围验证。

### 详情整理与失败续采

详情脚本以题目 ID 管理已有结果：成功项跳过，缺失项与失败项重新尝试。失败时保留结构完整的占位记录，并记录原因，便于下次续采。

采集字段包含题干文字、题干图片、子问题、知识点、能力要求与答案图片。每处理完一题保存全量状态，详情结果使用临时文件原子替换。

### 图片本地化

图片通过浏览器下载功能保存，复用当前登录会话。下载后检查文件头，按实际 PNG、JPEG、GIF、WebP 或 BMP 格式修正扩展名。

图片按题目 ID 和题干 / 答案类别归档，JSON 同时保留来源地址和相对本地产物目录的路径。

### OCR 与答案解析

RapidOCR 逐张读取本地答案图，将多图识别结果合并为完整文本，再按“答案”“参考答案”“详解”“解析”等标记拆分答案与解释部分。

没有识别到对应标记时，整段文本作为解析，答案字段留空。OCR 脚本回写同一个题目 JSON，便于后续统一消费。

## 数据结构

链接层的 JSONL 每行保存 `id` 与 `url`。最终题目记录的主要字段为：

| 字段                                         | 含义                      |
| -------------------------------------------- | ------------------------- |
| `id`、`url`                                  | 题目标识与来源地址        |
| `status`、`error`                            | 成功 / 失败状态及失败原因 |
| `stem.text`、`stem.images`                   | 题干文字与图片            |
| `questions`                                  | 拆分的子问题              |
| `knowledge_points`、`abilities`              | 知识点与能力要求          |
| `answer.images`                              | 答案图来源与本地路径      |
| `answer.text`                                | OCR 完整文本              |
| `answer.answer_text`、`answer.analysis_text` | 拆分后的答案与解析        |

## 环境与运行

需要 Python、可运行的 Chromium 浏览器，以及以下依赖：

```bash
python -m pip install DrissionPage beautifulsoup4 rapidocr_onnxruntime
cd "Collection Project"
python collect_links.py
python collect_details.py
python ocr_answers.py
```

两个采集脚本每次都等待人工确认登录：在浏览器完成或确认登录后，回终端按回车继续。`.browser_profile/` 用于复用本机浏览器状态。

运行前修改脚本顶部的列表地址、页数和代理设置。产物集中到 `outputs/json/` 与 `outputs/images/`，不会保存中间 HTML 文件。

## 实践亮点

- 链接与最终数据分开保存，避免不同阶段相互覆盖。
- 以题目 ID 为稳定标识，支持重复执行和失败重试。
- 浏览器图片下载、文件类型判断和 OCR 拆分形成完整数据链路。
- 失败占位保留统一结构，便于后续检查和补采。

## 当前边界

项目仍处于 Demo 阶段，依赖目标站点的登录状态、页面结构与答案加载行为。没有题干图片的题目会在列表阶段过滤；OCR 对公式、上下标和复杂排版的结果仍需核对。

当前未保留统一依赖版本清单或自动化测试套件。详情保存的原子替换机制不能直接推定 OCR 回写也具备相同保障。本次整理仅阅读代码，没有登录站点或执行真实采集。

## 仓库与资料

- [GitHub 仓库](https://github.com/Mrtx233/PicQuestionCrawler)（私有，需要权限）
- [采集流程说明](https://github.com/Mrtx233/PicQuestionCrawler/blob/main/Collection%20Project.md)
- [详情采集脚本](https://github.com/Mrtx233/PicQuestionCrawler/blob/main/Collection%20Project/collect_details.py)
- [OCR 脚本](https://github.com/Mrtx233/PicQuestionCrawler/blob/main/Collection%20Project/ocr_answers.py)
