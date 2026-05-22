---
title: "Scrapy Official Document"
description: "一个面向政府站点与资讯站点的多项目 Scrapy 采集仓库，提供通用基类、增量采集和 Crawlab 集成。"
githubUrl: ""
tags:
  - Python
  - Scrapy
  - Crawlab
  - 爬虫
draft: false
---

# Scrapy Official Document

**一个面向政府站点与资讯站点的多项目 Scrapy 采集仓库。仓库内不是单一爬虫，而是按业务域拆分的多个独立 Scrapy project，覆盖教育、民政、财政、司法、人社、科技、生态环境以及网易资讯等采集场景。**

**当前仓库更接近一套可持续迭代的“采集项目集合”与“生产脚手架”，而不是演示性质的示例代码。各目录下维护了大量站点级 Spider，并配套了统一的数据抽取基类、增量采集控制、附件下载、文档落盘、Crawlab 集成以及爬虫模板生成工具。**

## 项目定位

**本项目主要用于以下场景：**

* **面向政府公开信息网站的结构化采集**
* **面向新闻/资讯站点的文章抓取**
* **将网页内容、正文、附件、HTML 源码统一保存为标准化文件**
* **在 Crawlab 等调度环境中执行批量增量采集**
* **通过 GUI 工具快速生成新的 Spider 模板**

## 仓库概览

**仓库根目录主要包含 8 个在用 Scrapy 项目、2 个工具目录，以及 1 个历史归档目录。**

| **目录**                               | **说明**                                     | **Spider 数量**         |
| ---------------------------------------- | ---------------------------------------------- | ------------------------- |
| `departmentOfScienceAndTechnology` | **科技系统站点采集**                         | **27**                  |
| `ecologicalEnvironment`            | **生态环境系统站点采集**                     | **87**                  |
| `humanResourcesAndSocialSecurity`  | **人社系统站点采集**                         | **30**                  |
| `ministryOfCivilAffairs`           | **民政系统站点采集**                         | **29**                  |
| `ministryOfEducation`              | **教育系统站点采集**                         | **34**                  |
| `ministryOfFinance`                | **财政系统站点采集**                         | **32**                  |
| `ministryOfJustice`                | **司法系统站点采集**                         | **21**                  |
| `netease`                          | **网易资讯采集**                             | **18**                  |
| `00utils`                          | **正则与内容处理试验脚本**                   | **-**                   |
| `01exe`                            | **Spider 模板 GUI 生成器与打包产物**         | **-**                   |
| `已归档采集`                       | **历史归档脚本，保留旧版本或阶段性交付结果** | **226 个**`.py`文件 |

**在用项目中的 Spider 总数约为 278 个，说明该仓库已经积累了较完整的行业站点样本与可复用规则。**

## 目录结构

**典型业务目录结构如下：**

```
ministryOfEducation/
├─ scrapy.cfg
└─ ministryOfEducation/
   ├─ items.py
   ├─ middlewares.py
   ├─ pipelines.py
   ├─ settings.py
   ├─ spiders/
   ├─ utils/
   │  ├─ parsers.py
   │  ├─ processors.py
   │  ├─ spiders.py
   │  └─ starturls.py
   └─ xuehua/
      └─ source/
```

**各部分职责如下：**

* `scrapy.cfg`：Scrapy project 入口配置
* `settings.py`：下载延迟、并发、增量开关、输出目录、Pipeline 配置
* `items.py`：统一字段模型，如标题、发布时间、正文、附件、来源等
* `spiders/`：站点级 Spider，通常一个文件对应一个站点或一个栏目族
* `utils/spiders.py`：通用基类 `BasePortiaSpider`，负责列表页解析、详情页抽取、翻页和日期过滤
* `utils/processors.py`、`utils/parsers.py`：字段处理器与解析逻辑
* `utils/starturls.py`：起始 URL 生成器，支持固定列表、范围、日期片段等模式
* `pipelines.py`：文件下载、HTML 保存、正文文档生成、元数据输出
* `xuehua/`：Snowflake 风格 ID 生成与相关辅助代码

## 核心设计

### 1. 多项目拆分

**仓库按业务域拆分为多个 Scrapy project，而不是把所有 Spider 堆在一个项目内。这样做有几个直接好处：**

* **不同业务线可以独立维护 settings 与 pipeline**
* **同类站点可以复用相同字段模型与工具类**
* **便于在调度平台中按项目维度部署与执行**
* **历史演进过程中可以保留差异化实现，而不必强行统一**

### 2. 统一 Spider 基类

**多个业务目录都复用了 **`utils/spiders.py` 中的通用模式，核心能力包括：

* **统一的列表页解析 **`parse_list`
* **统一的详情页解析 **`parse_item`
* **列表页详情链接与发布时间配对**
* **支持“下一页”或自定义分页函数**
* **内置日期提取与日期范围过滤**
* **连续重复页检测，避免无效翻页**
* **抓取时将页面 HTML 与源 URL 回填到 item，供后续 Pipeline 使用**

**这意味着新增一个站点时，通常只需要补充：**

* `start_urls`
* **列表页 XPath/正则**
* **详情页 XPath/正则**
* **特定分页逻辑**

### 3. 字段式抽取配置

**Spider 普遍采用 **`Item(...) + Field(...)` 的方式声明字段，而不是把所有解析逻辑散落在 `parse` 方法中。常见字段包括：

* `title`
* `publish_time`
* `content`
* `menu`
* `source`
* `attachment`
* `attachment_name`
* `issuer`
* `fileno`
* `indexnumber`
* `category`
* `status`
* `writtendate`

**这种设计更适合批量维护政府站点，因为不同站点的差异通常只体现在 XPath 和正则，不在整体解析流程。**

### 4. 增量抓取

**各业务项目的 **`settings.py` 中都定义了：

* `CUTOFF_DATE`
* `INCREMENTAL_MODE`

**Spider 在列表页阶段就会根据发布时间判断是否跳过旧数据，从而减少无效请求。对于在 Crawlab 中周期执行的任务，这种方式适合做增量同步。**

### 5. Crawlab 集成

**多个项目都通过以下方式与 Crawlab 集成：**

* `FILES_STORE = crawlab.get_task_export_dir()`
* `crawlab.save_item(...)`

**这表明本项目默认不是把文件输出到固定本地目录，而是输出到 Crawlab 任务导出目录，并同步元数据记录。**

## 数据输出规范

`pipelines.py` 中的 `CustomFileStoragePipeline` 是项目的重要组成部分。它不仅保存字段，还会把一次采集拆成多个标准化产物：

* `meta`：元数据 JSON
* `html`：原始 HTML 源码或降级页面信息
* `master`：正文主文档，通常为 `.md`、`.docx` 或原始主文件
* `attach`：附件文件

**典型输出结构如下：**

```
{FILES_STORE}/{origin_id}/
├─ meta/
│  └─ meta_{origin_id}_{origin_id}.json
├─ html/
│  └─ html_{origin_id}_{record_id}.html
├─ master/
│  └─ master_{origin_id}_{record_id}.md|docx|原始文件
└─ attach/
   └─ 各类附件文件
```

**该 Pipeline 还处理了这些实际问题：**

* **给主记录和附件生成唯一 ID**
* **下载详情页中的附件链接**
* **将正文内容转 Markdown**
* **识别附件下载失败或遭遇反爬时的异常情况**
* **在附件无法直接下载时生成说明文件**
* **保存 HTML、元数据、正文文档时分别记录成功与失败状态**

**这部分代码明显是面向生产落地写的，而不只是“抓到数据就打印出来”。**

## 运行方式

### 环境依赖

**从代码中的导入可以确认，项目至少依赖以下组件：**

* `python`
* `scrapy`
* `itemloaders`
* `fake-useragent`
* `requests`
* `markdownify`
* `crawlab`

**其中 **`netease` 项目还包含 Playwright 适配中间件，若启用浏览器渲染，还需要相关依赖，例如：

* `scrapy-playwright`
* `playwright`

### 运行单个业务项目

**进入对应项目目录后执行标准 Scrapy 命令即可，例如：**

```
cd ministryOfEducation
scrapy crawl jyj_yaan_gov_cn
```

### 运行网易项目

**网易项目提供了额外命令模块：**

* `scrapy crawl <spider_name>`：运行单个 Spider
* `scrapy crawl_all`：按文件顺序批量执行 `netease/spiders/` 下的 Spider

**示例：**

```
cd netease
scrapy crawl news_163_com
scrapy crawl_all
```

### 日期与增量控制

**项目代码已经支持按发布时间过滤的能力，但实际传参与调度方式和执行环境有关：**

* **通用基类支持 **`target_date` 参数
* `netease` 项目通过自定义命令传递位置参数
* **其他业务项目更适合通过 Crawlab 调度参数或二次封装命令注入**

**如果只想控制增量范围，优先修改各项目 **`settings.py` 中的：

```
CUTOFF_DATE = '2025-12-1'
INCREMENTAL_MODE = True
```

## Spider 命名与开发约定

**从现有代码看，Spider 命名大体遵循“域名下划线化”的规则，例如：**

* `jyj_yaan_gov_cn`
* `rst_qinghai_gov_cn`
* `czj_yinchuan_gov_cn`
* `sfj_xianyang_gov_cn`

**这套命名方式有几个优点：**

* **可以快速反推目标站点**
* **文件名、Spider 名、允许域名基本一致**
* **在大规模 Spider 仓库中更容易检索与定位**

**一个典型 Spider 一般包含：**

* `name`
* `allowed_domains`
* `start_urls`
* **自定义分页函数，如 **`make_url_base`
* `start_requests`
* **列表页字段定义 **`list_items`
* **详情页字段定义 **`items`

## 工具目录说明

### `01exe`

**该目录下包含多个版本的 Spider 模板生成 GUI：**

* `gen_spider_gui_v3.py`
* `gen_spider_gui_v4.py`
* `gen_spider_gui_v5.py`

**它们的作用不是执行采集，而是辅助生成新的 Spider 文件。代码里可以看到：**

* **自动把域名转换为文件名**
* **生成 Spider 类名**
* **生成列表页/详情页 XPath 模板**
* **生成常用正则模板**
* **可选生成政府公开信息字段**

**这说明仓库已经把“新增 Spider”这件事工具化了。**

### `00utils`

**该目录是一些轻量测试脚本，主要用于：**

* **正则表达式验证**
* **内容为空场景调试**

**它更像开发辅助目录，不属于核心运行链路。**

## 历史归档目录

`已归档采集` 保存了大量历史阶段的 Spider 脚本，按批次时间归档，例如：

* `马缕采集12.22-12.31`
* `马缕采集01.04-01.16`
* `马缕采集01.19-01.23`
* `马缕采集01.26-01.30`

**这些内容通常有几类价值：**

* **保留旧站点的历史实现**
* **方便从历史脚本中回收 XPath/正则**
* **对比不同批次交付代码的演进方式**
* **作为新 Spider 编写时的参考样板**

**如果后续要继续维护该仓库，建议把 **`已归档采集` 明确视为“历史资料区”，不要与当前活跃项目混合部署。

## 项目特点总结

**这个仓库的核心特点可以概括为：**

* **多业务域、多项目并行维护**
* **Spider 数量多，站点覆盖面广**
* **采用统一基类和字段配置方式**
* **强调增量抓取与生产落盘**
* **深度集成 Crawlab**
* **支持附件、HTML、正文、元数据四类结果输出**
* **提供 Spider 生成工具，降低新增站点成本**
* **保留了完整的历史归档，便于复用旧规则**

## 适合的使用方式

**这个项目最适合以下几种使用方式：**

* **作为政务公开信息采集项目底座继续扩展**
* **复用已有 Spider 规则快速接新站点**
* **参考其通用基类与 Pipeline 设计搭建内部采集平台**
* **在 Crawlab 中按项目部署为周期任务**

**如果只是学习 Scrapy 入门，这个仓库会显得偏重；如果是要维护一套长期运行的行业采集系统，这个仓库反而非常有参考价值。**

## 后续建议

**如果后续准备继续长期维护，建议逐步补齐这些基础设施：**

* **增加统一的 **`requirements.txt` 或 `pyproject.toml`
* **在仓库根目录补充批量运行脚本**
* **为各业务项目补充独立 README 或运行说明**
* **清理或统一部分历史编码问题与注释乱码**
* **给活跃项目补充测试样例与站点状态说明**

---

**如果把这个仓库一句话概括，它就是：****一个按业务域拆分、面向生产落地、深度集成 Crawlab 的 Scrapy 政务信息采集仓库。**

## GitHub 链接

https://github.com/Mrtx233/Scrapy_Official_Document

