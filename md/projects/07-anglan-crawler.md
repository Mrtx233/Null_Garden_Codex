---
title: "Anglan Crawler｜电商商品采集与平台转换"
description: "面向跨境电商选品与铺货的早期采集工具集，将商品链接、详情、变体和图片整理为统一字段，再转换为 Shopify / WooCommerce 导入文件。"
githubUrl: "https://github.com/Mrtx233/anglan_crawler"
repositoryVisibility: public
draft: false
featured: true
stack:
  - Python
  - Scrapy
  - Selenium
  - DrissionPage
  - pandas
  - openpyxl
---

# Anglan Crawler｜电商商品采集与平台转换

## 项目定位

这是我围绕跨境电商商品数据处理整理的一套早期工具。它把分类页链接采集、商品详情整理、平台字段转换和价格处理串联起来，让不同品牌站点的数据可以进入同一条表格处理流程。

各环节通过 Excel / CSV 交接，既可以从分类页开始，也可以接收已有商品链接或字段表，仅执行后续转换。

本篇依据仓库 README、依赖文件与默认分支目录整理，阅读日期为 **2026 年 10 月 3 日**。当前默认分支主要保留说明、依赖清单和 Python 缓存文件，未检出 README 列举的 `.py` 源文件；下述采集与转换机制是项目说明记录的设计，运行前需要取得完整源码。

## 业务流程

```text
分类页
  → 商品链接表：title、link
  → 商品详情与变体解析
  → 十字段统一表
  → Shopify 字段转换与价格匹配
  → WooCommerce 字段转换
  → CSV / Excel 导入文件
```

这种按文件分段的流程，方便在采集完成后重复尝试价格方案，也便于针对一个站点替换解析器，继续复用平台转换部分。

## 核心能力

### 分类页与商品链接采集

README 记录了分页、无限滚动和点击“加载更多”三种分类页策略。链接输出使用统一的分类名与商品地址两列，作为详情采集器的输入。

### 两条详情采集路线

- Shopify 站点：将商品页地址规范化为对应的 `.json` 地址，读取结构化商品、选项和变体数据。
- 需要页面渲染的站点：使用 Selenium 加载页面，再从 DOM 或页面内嵌数据中提取信息。

说明中还记录了对重复商品 JSON 地址的合并、图片整理、描述 HTML 清洗，以及币种向 USD 的换算。

### 变体编码与表格转换

商品规格、变体价格和对应图片通过内部 `styles` 编码交接。转换器再将这些信息展开为平台的商品行、变体行和图片行，减少采集器直接拼装平台字段的重复工作。

### 价格与辅助处理

说明记录了按价格库匹配售价、检查剩余价格、转换 WooCommerce 字段、更新 SKU、检查父子 SKU 关联，以及图片格式和品牌词处理等工具。

价格匹配依赖预设库价和原价窗口，并不等于实时市场定价或利润优化。

## 统一数据结构

| 字段                            | 用途                     |
| ------------------------------- | ------------------------ |
| `title`                         | 商品分类                 |
| `name`                          | 商品名称                 |
| `price1`、`price2`              | 售价与划线价             |
| `styles1`、`styles2`、`styles3` | 规格、变体价格和图片信息 |
| `src_links`                     | 商品图片列表             |
| `link-href`                     | 原始商品地址             |
| `details`                       | 商品描述 HTML            |

README 中的主线主要使用 `styles1`，其余款式列保留作扩展位置。消费者需要按同一套编码约定解析，而不是把款式列视为普通说明文字。

## 技术分工

| 技术                    | 在项目中的职责                                |
| ----------------------- | --------------------------------------------- |
| Python                  | 脚本执行、数据整理与格式转换                  |
| Scrapy                  | README 记录的 Shopify JSON 与渲染型采集子项目 |
| Selenium / DrissionPage | 浏览器驱动、分类页交互和动态页面采集          |
| pandas / openpyxl       | Excel、CSV 的读写和平台字段映射               |
| lxml / requests         | 页面解析与 HTTP 数据请求                      |

`requirements.txt` 当前可见；DrissionPage 和图片处理用到的 Pillow 属于 README 单独说明的按需依赖。

## 模块划分

README 描述的业务目录包括：

| 模块                     | 职责                      |
| ------------------------ | ------------------------- |
| `02crawler/detail_link/` | 分类页链接采集            |
| `02crawler/Crawl/`       | 早期站点定制采集          |
| `shopify_json/`          | Shopify 商品 JSON 采集    |
| `not_shopify/`           | 需要浏览器渲染的采集      |
| `03switch/`              | 平台转换、改价与 SKU 工具 |
| `04utils/`               | 图片和品牌词处理          |

此表用于理解设计，不表示当前默认分支已经包含上述目录内的全部可运行源码。

## 使用准备与当前边界

完整环境按 README 使用 Python 3.10+ 与 Chrome，安装依赖后还需检查输入表位置、输出目录、站点规则、浏览器和代理配置。

实际复用前应先补齐源码，再用少量商品验证“链接 → 详情 → 十字段 → 平台导入文件”的闭环。当前仓库中的 `__pycache__/*.pyc` 不能替代完整源码工程，本文也没有对采集任务或平台导入执行运行验收。

早期方案依赖较多脚本内配置；站点页面、变体格式或导入模板变化时，需要同步更新采集和转换规则。

## 系列关系与仓库

同属我的 Anglan 电商数据处理项目，三个仓库各自保留不同实现：

- [Anglan Crawler Pro](08-anglan-crawler-pro.md)：增加图形工作流、模块化拆分和更多数据处理工具。
- [Anglan Crawler JSON](09-anglan-crawler-json.md)：将 JSON 中间数据、分析和定价导出组织为四阶段工作台。

项目资料：[GitHub 仓库](https://github.com/Mrtx233/anglan_crawler)、[README](https://github.com/Mrtx233/anglan_crawler/blob/main/README.md)、[依赖清单](https://github.com/Mrtx233/anglan_crawler/blob/main/requirements.txt)。仓库当前为公开仓库，具体使用授权以仓库声明为准。
