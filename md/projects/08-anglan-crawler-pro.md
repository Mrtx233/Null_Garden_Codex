---
title: "Anglan Crawler Pro｜商品采集与转换工作流"
description: "面向跨境电商运营的 Python 工具集，整合链接库、浏览器与 Scrapy 采集、商品变体解析、价格匹配和 Shopify / WooCommerce 导出，并拆分为可维护的业务模块。"
githubUrl: "https://github.com/Mrtx233/anglan_crawler_pro"
repositoryVisibility: public
draft: false
featured: true
stack:
  - Python
  - DrissionPage
  - Scrapy
  - Tkinter
  - pandas
  - openpyxl
---

# Anglan Crawler Pro｜商品采集与转换工作流

## 项目定位

这是我面向跨境电商运营开发的商品数据工作流，覆盖站点链接库管理、分类页链接采集、商品详情整理、规格编码、价格匹配与平台导出。

项目同时保留图形工作台、Scrapy 采集路线、非标准站点适配和单独的数据转换工具。它们以共享的十字段数据结构衔接，便于根据目标站点和已有数据选择入口。

本篇结合默认分支 README、标准流水线调度器与价格处理源码整理，阅读日期为 **2026 年 10 月 3 日**。

## 核心能力

### 链接库与分类页采集

`Assembly line/jsonl_gui.py` 提供链接记录管理界面。采集端支持分页与滚动页面，输出后续商品采集需要的分类和商品 URL。

模块化分页采集器将浏览器操作、链接提取、日志、保存和界面分开；保存逻辑包含原子写入与恢复文件，减少中断或保存失败时的数据损失。

### 商品 JSON 与动态页面采集

Shopify 主线读取商品 JSON，整理商品名称、售价、选项、变体、图片和描述。需要渲染或缺少标准商品 JSON 的站点使用专属浏览器采集脚本与公共解析工具。

另一条 Scrapy 路线将站点爬虫与通用的链接采集、变体解析和表格输出工具分离，便于追加定制站点。

### 商品整理与平台转换

商品统一为：

```text
title, name, price1, price2, styles1, styles2, styles3, src_links, link-href, details
```

转换部分解析款式串，展开规格与图片，生成 Shopify 商品文件，再转换 WooCommerce 的简单商品或父子变体结构。

独立辅助工具还覆盖图片格式转换、标题拆表、SKU 抽样、价格修正和描述清洗。

### 多种价格处理方案

仓库保留不同年代和用途的价格匹配实现：Shopify 表价格库匹配、styles 表递增处理，以及 `standard_collection_process_Preposition` 中的百分位分档方案。

Preposition 分支还增加来源域名替换和商品关键词剔除。不同工作流的定价规则、输出目录和数据清洗行为并不完全相同，复用时应先选定具体入口。

## 分层架构

活跃的模块化实现位于 `DrissionPage_Json_Shopify/03CRAWLER_Disassemble/`。

| 层 / 工具                                  | 职责                                       |
| ------------------------------------------ | ------------------------------------------ |
| `link_collector_pagination/`               | 分类页分页采集、链接文件保存与恢复         |
| `shopify_scraper_workbench/`               | 商品 JSON 采集、解析和图形操作             |
| `standard_collection_process/crawler/`     | 浏览器、链接与商品请求                     |
| `standard_collection_process/processing/`  | 商品、规格、图片、币种、价格与平台字段处理 |
| `standard_collection_process/storage/`     | 表格、合并、路径、导出和检查点             |
| `standard_collection_process/pipeline/`    | 阶段调度、任务结果与运行状态               |
| `standard_collection_process/ui/`          | Tkinter 界面与日志展示                     |
| `standard_collection_process_Preposition/` | 含预处理与分档定价的同源实现               |

调度器使用工作线程、停止事件和队列传递任务状态，业务任务通过事件与界面通信。采集和转换逻辑因此可以独立阅读和测试。

## 工作流程

```text
站点链接库
  → 分类页链接采集
  → 商品 JSON / 浏览器详情采集
  → 十字段表与变体编码
  → 合并、清洗与价格处理
  → Shopify 文件
  → WooCommerce 文件
```

标准工作台使用链接采集、商品采集、合并转换三阶段操作。价格修正、格式转换和图片工具也可以脱离采集流程处理已有文件。

## 环境与启动

仓库主要开发环境为 Python 3.12、Chromium / Chrome 与 Tkinter。根依赖和部分子项目依赖的 pandas 版本不同，应根据选用的工作流安装对应清单。

从仓库根目录启动链接管理工具：

```bash
python -m pip install -r requirements.txt
python "Assembly line/jsonl_gui.py"
```

使用模块化标准流水线：

```bash
cd DrissionPage_Json_Shopify/03CRAWLER_Disassemble
python -m pip install -r standard_collection_process/requirements.txt
python standard_collection_process/main.py
```

运行前检查输入目录、站点分类地址和代理配置；部分工具默认使用本机代理，应按环境修改。

## 工程实践与测试

该项目的重点实践是将较大的单文件程序拆成采集、处理、存储、调度和 UI 模块，并在后续维护中增加保存恢复、商品校验和独立采集调度器。

当前标准流水线保留 `unittest` 测试，覆盖阶段调度、数据处理、文件保存、平台转换和界面分层约束。README 记录了 55 项测试的历史运行结果；本次整理没有重新运行该仓库的测试，也没有执行真实站点采集。

## 当前边界

- 历史单文件版、模块化版与 Preposition 版并存，修复不会自动同步到所有入口。
- 非标准站点解析依赖各站点页面结构，换站点通常需要适配。
- 价格库匹配结果受算法、数据和分配顺序影响，不应混用不同路线的规则说明。
- 部分子目录没有保留独立测试套件，不能把标准流水线的测试覆盖等同于全仓库覆盖。

## 仓库与相关项目

- [GitHub 仓库与总说明](https://github.com/Mrtx233/anglan_crawler_pro)
- [标准流水线说明](https://github.com/Mrtx233/anglan_crawler_pro/blob/master/DrissionPage_Json_Shopify/03CRAWLER_Disassemble/standard_collection_process/README.md)
- [初版采集与转换工具](07-anglan-crawler.md)
- [JSON 四阶段工作台](09-anglan-crawler-json.md)

仓库当前为公开仓库，具体使用授权以仓库声明为准。
