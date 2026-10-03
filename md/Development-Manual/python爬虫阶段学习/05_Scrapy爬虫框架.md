---
title: "第五阶段：Scrapy 爬虫框架"
description: "以工程化框架替代逐一定制实现，掌握 Scrapy 的组件模型与生产级配置"
tags:
  - "Python"
  - "开发手册"
---

# 第五阶段：Scrapy 爬虫框架

> **合辑**：Python 爬虫阶段学习手册 ｜ **阶段**：5 / 7 ｜ **定位**：以工程化框架替代逐一定制实现，掌握 Scrapy 的组件模型与生产级配置 ｜ **建议学时**：14–18 小时

大家好，我是小马不起床。

## 阶段导语

前四个阶段的实现方式，是围绕单个站点逐一定制并发、调度、去重与存储逻辑。Scrapy 采用与 Web 框架 Django 类似的框架化设计：请求队列、并发调度、重复过滤、重试机制、编码处理与数据管道均由框架统一管理，开发者只需定义数据提取逻辑与后处理规则。

本阶段以组件为单位展开：先建立引擎（Engine）、调度器（Scheduler）、下载器（Downloader）、爬虫（Spider）、条目管道（Item Pipeline）五者的协作模型，再依次落地 Spider 编写、Pipeline 数据处理、中间件（Middleware）扩展、settings 配置调优与 Scrapy-Redis 分布式部署。完成后，同一套抓取需求可以由数十行声明式代码承载，并且具备可配置、可扩展、可横向部署的工程属性。

## 学习目标

- [ ] 能够画出 Scrapy 五大组件的数据流向图，并说明一次请求从入队到落库经过的完整环节。
- [ ] 能够使用 `scrapy startproject` 与 `scrapy genspider` 创建项目，并说明各标准文件的职责边界。
- [ ] 能够编写含翻页、参数化、多级回调的 Spider，并正确使用 `response.follow` 与 `urljoin` 处理相对链接。
- [ ] 能够定义 Item 数据结构，并实现清洗、去重、存储三类条目管道（Item Pipeline）与优先级注册。
- [ ] 能够编写下载器中间件（Downloader Middleware）实现随机 User-Agent、代理轮换与异常重试。
- [ ] 能够根据目标站点特征配置并发、延迟、限速与重试参数，并说明 Scrapy-Redis 分布式方案的适用条件。

## 前置知识

| 前置阶段 | 需掌握内容 | 在本阶段的作用 |
| --- | --- | --- |
| 第四阶段 高并发与高性能爬虫 | 并发模型与异步 I/O（`asyncio`、协程、线程池、连接池） | 理解 Scrapy 基于 Twisted 的事件循环与并发参数含义 |
| 第三阶段 动态网页与浏览器自动化 | Playwright 渲染流程 | 理解 `scrapy-playwright` 集成方式与动态页面处理 |
| 第二阶段 网络基础与静态网页抓取 | HTTP 语义、状态码、CSS/XPath 选择器 | 编写 `parse` 回调与中间件中的响应判断 |
| 第一阶段 Python 语言底座 | 类与继承、生成器 `yield`、装饰器 | 理解 Spider 继承体系与信号注册写法 |

## 目录

1. [Scrapy 核心架构](#1-scrapy-核心架构)
2. [安装与项目创建](#2-安装与项目创建)
3. [Spider 爬虫编写](#3-spider-爬虫编写)
4. [Item 与条目管道](#4-item-与条目管道)
5. [中间件体系](#5-中间件体系)
6. [settings 与进阶用法](#6-settings-与进阶用法)
7. [Scrapy-Redis 分布式爬虫](#7-scrapy-redis-分布式爬虫)
8. [学习建议与实践路径](#8-学习建议与实践路径)
9. [阶段小结](#阶段小结)
10. [常见问题与排查](#常见问题与排查)
11. [下一阶段衔接](#下一阶段衔接)

---

## 1. Scrapy 核心架构

### 1.1 五大组件

Scrapy 的运行期由五个核心组件与两类中间件构成。组件职责如下：

| 组件 | 中文名称 | 职责 |
| --- | --- | --- |
| Engine | 引擎 | 系统核心调度器，负责在其余组件之间传递请求与响应，控制整体流转节奏 |
| Scheduler | 调度器（Scheduler） | 维护请求队列，按优先级出队，并借助去重过滤器（Dupe Filter）拒绝重复请求 |
| Downloader | 下载器 | 向目标服务器发送请求、接收响应，管理并发连接与下载延迟 |
| Spider | 爬虫 | 开发者编写解析逻辑的位置，接收 Response 并产出 Item 或新的 Request |
| Item Pipeline | 条目管道（Item Pipeline） | 对提取出的 Item 做后处理：清洗、校验、去重与持久化存储 |

除上述五个组件外，两类中间件以钩子（Hook）形式嵌入数据流：

| 中间件 | 中文名称 | 介入时机 | 典型用途 |
| --- | --- | --- | --- |
| Downloader Middleware | 下载器中间件（Downloader Middleware） | 请求发出前、响应返回后 | 设置代理、替换 User-Agent、集成浏览器渲染、异常重试 |
| Spider Middleware | 爬虫中间件（Spider Middleware） | Spider 处理请求前、处理结果产出后 | 过滤起始请求、拦截异常、修正出队 Item |

组件关系与数据流向：

```text
                    ┌──────────────────────┐
                    │   Spider (爬虫)      │
                    │   解析逻辑所在层     │
                    └──────────┬───────────┘
                               │ yield Request / Item
                               ▼
┌──────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  Scheduler   │◄──│  Engine (引擎)       │──►│  Downloader  │
│  (调度器)    │   │  核心调度            │   │  (下载器)    │
│  请求队列    │──►│                      │◄──│  发送请求    │
└──────────────┘   └──────┬───────────────┘   └──────────────┘
                          │ Item
                          ▼
               ┌──────────────────────┐
               │  Item Pipeline       │
               │  (条目管道：清洗/保存)│
               │  数据库 / CSV / JSON │
               └──────────────────────┘

两类中间件（钩子）：
  - Downloader Middleware：在请求发送前 / 响应返回后处理
  - Spider Middleware：在 Spider 处理前 / 处理后处理
```

### 1.2 核心数据流转

一次完整抓取循环的流转顺序如下：

```text
Spider 声明待抓取 URL → Engine 将请求交给 Scheduler 入队 → Scheduler 排队并去重 →
队列出队后 Engine 交给 Downloader 发送请求 → Downloader 返回 Response →
Engine 将 Response 交给对应 Spider 回调解析 →
回调产出 Item 或新的 Request →
Item 进入 Item Pipeline 处理并保存 / 新的 Request 送回 Scheduler 继续排队
```

该循环持续运行，直到请求队列为空且所有在途请求完成，爬虫自然结束。开发者通过编写回调函数影响循环的内容，通过配置与中间件影响循环的行为。

### 1.3 框架化能力对照

下表对比自研爬虫与 Scrapy 在同等需求下的实现成本，说明采用框架的理由：

| 能力项 | 从零编写爬虫的代价 | Scrapy 提供的实现 |
| --- | --- | --- |
| 请求队列管理 | 自行维护队列与优先级 | 内置 Scheduler |
| 并发 | 自行实现线程池或协程调度 | 内置协程并发（基于 Twisted） |
| 去重 | 自行维护已爬 URL 集合 | 内置去重过滤器 RFPDupeFilter |
| 重试 | 自行编写重试与退避逻辑 | 内置重试中间件 |
| 编码处理 | 自行判断并转换字符集 | 自动检测响应编码 |
| 数据后处理 | 与抓取逻辑耦合 | Item Pipeline 分离 |
| 代理与请求头 | 逐请求手工设置 | Downloader Middleware 统一注入 |
| 部署运行 | 自行编写进程管理 | 命令行运行 / Scrapyd 部署 |

**要点**：

- **要点**：五大组件中只有 Spider 与 Item Pipeline 需要开发者编写代码，其余由框架提供默认实现。
- **要点**：请求与数据是两条独立通道，Request 经 Scheduler 循环，Item 经 Pipeline 单向输出。
- **要点**：中间件是不修改 Spider 代码即可改变抓取行为的标准扩展点。
- **要点**：Twisted 的事件循环承担并发，因此 Spider 回调不应出现阻塞式同步调用。

---

## 2. 安装与项目创建

### 2.1 安装

```bash
pip install scrapy
```

### 2.2 创建项目

```bash
# 创建项目骨架
scrapy startproject my_spider

# 进入项目目录并查看结构
cd my_spider
tree
```

标准目录结构与各文件职责：

```text
my_spider/
├── scrapy.cfg               # 项目部署配置文件
└── my_spider/
    ├── __init__.py
    ├── items.py              # 定义数据结构（Item）
    ├── middlewares.py        # 中间件
    ├── pipelines.py          # 条目管道（数据清洗 + 存储）
    ├── settings.py           # 项目设置
    └── spiders/              # 爬虫定义所在目录
        ├── __init__.py
        └── example.py
```

### 2.3 创建爬虫

有两种创建方式。

方法一：使用命令行生成模板

```bash
cd my_spider
scrapy genspider example example.com
```

方法二：手动创建，在 `spiders/` 目录下新建 `.py` 文件并继承 `scrapy.Spider`。

两种方式产物一致，命令行模板适合快速起步，手动创建适合在已有 Spider 基础上复制改造。

**要点**：

- **要点**：`scrapy.cfg` 位于项目外层，负责指向内部 Python 包；日常修改集中在内部包中。
- **要点**：`items.py`、`pipelines.py`、`middlewares.py` 是三类扩展点，`spiders/` 是解析逻辑目录。
- **要点**：Spider 文件必须置于 `spiders/` 包内，否则无法被 `scrapy list` 识别。

---

## 3. Spider 爬虫编写

### 3.1 最基本的爬虫

```python
# my_spider/spiders/example.py
import scrapy


class ExampleSpider(scrapy.Spider):
    """最小可运行的爬虫"""
    name = "example"                    # 爬虫名称（唯一标识，运行时使用该值）
    allowed_domains = ["example.com"]   # 允许爬取的域名（避免偏离目标站点）
    start_urls = ["https://example.com"]  # 起始 URL 列表

    def parse(self, response):
        """解析响应（默认回调函数）"""
        title = response.css("h1::text").get()
        content = response.css(".content::text").get()

        # 以字典形式 yield，是最简单的数据输出方式
        yield {
            "title": title,
            "content": content,
        }
```

三个类属性构成 Spider 的运行边界：`name` 用于命令定位，`allowed_domains` 用于域名过滤，`start_urls` 用于生成初始请求。`parse` 是默认回调，未显式指定回调时响应均由它处理。

### 3.2 运行爬虫

```bash
# 运行爬虫
scrapy crawl example

# 结果输出为 JSON
scrapy crawl example -o output.json

# 结果输出为 CSV
scrapy crawl example -o output.csv

# 结果输出为 JSON Lines（每行一个 JSON，适合大数据量）
scrapy crawl example -o output.jl
```

输出格式由文件扩展名决定，`-o` 会覆盖同名文件，`-O` 追加写入。批量抓取场景优先使用 `.jl`，便于流式读取与增量处理。

### 3.3 翻页爬虫

```python
import scrapy
from scrapy.linkextractors import LinkExtractor


class MovieSpider(scrapy.Spider):
    name = "movies"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com/movies?page=1"]

    def parse(self, response):
        """提取当前页的列表数据"""
        # 遍历列表项
        for movie in response.css(".movie-item"):
            yield {
                "title": movie.css(".title::text").get(),
                "score": movie.css(".score::text").get(),
                "url": response.urljoin(movie.css("a::attr(href)").get()),
            }

        # 翻页：定位"下一页"链接后继续爬取
        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            # 构建完整 URL（处理相对路径）
            next_url = response.urljoin(next_page)
            yield scrapy.Request(
                url=next_url,
                callback=self.parse,  # 回调函数：拿到响应后交由 parse 处理
            )

    # 也可以一次性生成全部起始请求
    def start_requests(self):
        """重写 start_requests 以自定义初始请求"""
        for page in range(1, 11):
            yield scrapy.Request(
                url=f"https://example.com/movies?page={page}",
                callback=self.parse,
                # meta 可携带额外参数，回调中通过 response.meta 读取
                meta={"page": page},
            )
```

翻页有两种实现路径：在回调中根据"下一页"链接动态生成请求，适合页码未知的场景；在 `start_requests` 中静态枚举页码，适合分页规则已知的场景。示例中导入的 `LinkExtractor` 可在链接结构复杂时替代 CSS 选择器提取待爬链接。

### 3.4 带参数的爬虫

```python
import scrapy


class SearchSpider(scrapy.Spider):
    name = "search"

    def __init__(self, keyword=None, *args, **kwargs):
        """接收命令行参数"""
        super().__init__(*args, **kwargs)
        self.keyword = keyword

    def start_requests(self):
        url = f"https://example.com/search?q={self.keyword}"
        yield scrapy.Request(url, callback=self.parse)

    def parse(self, response):
        for item in response.css(".result-item"):
            yield {
                "keyword": self.keyword,
                "title": item.css("h3 a::text").get(),
                "url": item.css("h3 a::attr(href)").get(),
            }

# 运行：scrapy crawl search -a keyword=Python
```

`-a` 后的键值对会作为构造参数传入 Spider，因此需在 `__init__` 中声明对应形参。该机制使同一份 Spider 可服务于不同关键词或站点分区，无需复制代码。

### 3.5 爬虫实战：完整示例

```python
# spiders/douban_top250.py
import scrapy


class DoubanTop250Spider(scrapy.Spider):
    """列表页加翻页的完整示例"""
    name = "douban_top250"
    allowed_domains = ["movie.douban.com"]
    start_urls = ["https://movie.douban.com/top250"]

    def parse(self, response):
        """解析列表页"""
        for item in response.css(".item"):
            yield {
                "title": item.css(".title::text").get(),
                "rating": item.css(".rating_num::text").get(),
                "quote": item.css(".inq::text").get(),
                "url": item.css("a::attr(href)").get(),
            }

        # 翻页
        next_page = response.css("span.next a::attr(href)").get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)
            # response.follow 自动完成 URL 拼接，无需显式调用 urljoin
```

`response.follow` 是 `scrapy.Request` 的封装：接受相对路径、自动基于当前响应 URL 拼接，并可省略 `url` 关键字参数，是回调内生成后续请求的推荐写法。

**要点**：

- **要点**：Spider 的产出只有两类，Item（数据）与 Request（后续任务），不存在第三种出口。
- **要点**：`parse` 可拆分为多级回调，列表页用 `parse`、详情页用 `parse_detail`，通过 `callback` 显式绑定。
- **要点**：`allowed_domains` 仅对 `start_urls` 派生的请求生效，手动构造的跨域请求不受该限制。
- **要点**：`meta` 是随请求传递上下文的标准载体，回调内通过 `response.meta` 取回。
- **要点**：URL 拼接统一使用 `response.urljoin` 或 `response.follow`，避免手工字符串拼接产生错误路径。

---

## 4. Item 与条目管道

条目管道（Item Pipeline）是提取数据的后处理环节，职责包括清洗、校验、去重与持久化存储。数据在离开 Spider 之后、写入存储之前，全部经过该环节。

### 4.1 定义 Item（数据结构）

```python
# items.py
import scrapy


class MovieItem(scrapy.Item):
    """定义爬取的数据结构"""
    title = scrapy.Field()       # 电影名
    score = scrapy.Field()       # 评分
    year = scrapy.Field()        # 年份
    director = scrapy.Field()    # 导演
    url = scrapy.Field()         # 详情页 URL
    crawled_at = scrapy.Field()  # 抓取时间
```

Item 以 `scrapy.Field()` 声明字段集合，字段类型不做静态约束，但声明本身使数据结构显式化，便于管道与校验逻辑共享同一份契约。

### 4.2 在 Spider 中使用 Item

```python
from ..items import MovieItem
import scrapy
from datetime import datetime


class MovieSpider(scrapy.Spider):
    name = "movies"
    start_urls = ["https://example.com/movies"]

    def parse(self, response):
        for movie in response.css(".movie-item"):
            # 以 Item 替代字典承载数据
            item = MovieItem(
                title=movie.css(".title::text").get(),
                score=movie.css(".score::text").get(),
                year=movie.css(".year::text").get(),
                crawled_at=datetime.now().isoformat(),
            )
            yield item
```

字典与 Item 均可被管道接收。字典写法轻量，适合原型验证；Item 写法提供字段清单与统一访问接口，适合多管道协作与长期维护的项目。

### 4.3 编写 Pipeline

管道类实现以下方法的组合：`open_spider`（爬虫启动时执行一次）、`process_item`（每条数据执行一次）、`close_spider`（爬虫结束时执行一次）。

```python
# pipelines.py
import scrapy
import json
from itemadapter import ItemAdapter
from .items import MovieItem


class JsonPipeline:
    """保存到 JSON 文件"""

    def open_spider(self, spider):
        """爬虫启动时调用（打开文件）"""
        self.file = open("movies.json", "w", encoding="utf-8")
        self.file.write("[\n")
        self.first = True

    def close_spider(self, spider):
        """爬虫关闭时调用（写入收尾并关闭文件）"""
        self.file.write("\n]")
        self.file.close()

    def process_item(self, item, spider):
        """处理每条 Item（核心方法）"""
        if isinstance(item, MovieItem):
            line = json.dumps(dict(item), ensure_ascii=False)
            if not self.first:
                self.file.write(",\n")
            self.file.write(f"  {line}")
            self.first = False
        return item  # 必须返回 item，交由下一条管道处理


class PricePipeline:
    """数据清洗：规范化价格字段"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        # 清洗：移除价格中的货币符号并转换为 float
        if adapter.get("price"):
            adapter["price"] = float(
                adapter["price"].replace("¥", "").replace(",", "")
            )
        return item


class DuplicatesPipeline:
    """去重管道"""

    def __init__(self):
        self.seen = set()

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        # 以 URL 作为去重依据
        if adapter.get("url") in self.seen:
            raise scrapy.exceptions.DropItem(f"重复数据: {adapter['url']}")
        else:
            self.seen.add(adapter.get("url"))
            return item
```

三条管道的返回值语义决定数据流向：`process_item` 返回 item 表示继续传递；抛出 `DropItem` 表示丢弃该条数据并记录日志；抛出其他异常会导致该条数据被丢弃并计入失败统计。`ItemAdapter` 提供统一接口，使同一条管道可同时处理 Item 与字典。

### 4.4 启用 Pipeline

```python
# settings.py 中启用
ITEM_PIPELINES = {
    "my_spider.pipelines.DuplicatesPipeline": 100,  # 数值越小越先执行
    "my_spider.pipelines.PricePipeline": 200,
    "my_spider.pipelines.JsonPipeline": 300,
}
```

注册顺序即执行顺序，按本项目的设计约定如下：

| 管道 | 优先级数值 | 职责 |
| --- | --- | --- |
| DuplicatesPipeline | 100 | 去重过滤，尽早丢弃重复数据以减少后续开销 |
| PricePipeline | 200 | 字段清洗与类型规范化 |
| JsonPipeline | 300 | 持久化写入文件 |

**要点**：

- **要点**：管道链按优先级数值从小到大串行执行，去重与校验应前置于存储。
- **要点**：`process_item` 必须返回 item，遗漏返回会使下游管道收不到数据。
- **要点**：文件的打开与关闭放在 `open_spider` / `close_spider`，避免在每条数据上重复开销。
- **要点**：`DropItem` 是主动丢弃数据的规范手段，不属于异常失败。
- **要点**：Pipeline 未在 `ITEM_PIPELINES` 中注册则完全不生效，这是初次使用者最常见的失效原因。

---

## 5. 中间件体系

中间件是嵌入数据流的钩子。下载器中间件（Downloader Middleware）是使用频率最高的一类，用于在不修改 Spider 代码的前提下注入代理、替换请求头、集成浏览器渲染与自定义重试策略。

### 5.1 下载器中间件（Downloader Middleware）

介入位置为请求发送前与响应返回后，常用场景包括：配置代理、修改 User-Agent、集成 Playwright。

```python
# middlewares.py
import random


class RandomUserAgentMiddleware:
    """随机替换 User-Agent"""

    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ]

    def process_request(self, request, spider):
        """请求发送前调用"""
        ua = random.choice(self.user_agents)
        request.headers["User-Agent"] = ua
        return None  # 返回 None 表示继续执行后续中间件


class ProxyMiddleware:
    """代理中间件"""

    def process_request(self, request, spider):
        """为每个请求设置代理"""
        proxy = self.get_proxy()
        request.meta["proxy"] = proxy

    def get_proxy(self):
        """从代理池获取一个代理"""
        # 实际实现中可从 Redis、文件或代理服务商 API 获取
        return "http://127.0.0.1:7890"


class RetryMiddleware:
    """自定义重试中间件（Scrapy 已内置重试能力，此处用于演示钩子用法）"""

    def process_response(self, request, response, spider):
        """响应返回后调用"""
        if response.status in [403, 429]:
            # 命中封禁状态码，更换代理后重试
            new_request = request.copy()
            new_request.meta["proxy"] = "http://new-proxy:8080"
            return new_request  # 返回 Request 表示重新调度该请求
        return response  # 正常响应则原样返回

    def process_exception(self, request, exception, spider):
        """请求发生异常时调用"""
        print(f"请求异常: {request.url} - {exception}")
        return request  # 返回 Request 触发重试
```

三个钩子方法的返回值含义：

| 钩子方法 | 触发时机 | 可返回值 | 返回效果 |
| --- | --- | --- | --- |
| process_request | 请求发送前 | `None` | 继续执行下一个中间件，最终发出请求 |
| process_request | 请求发送前 | `Response` | 跳过下载，直接进入响应处理链 |
| process_request | 请求发送前 | `Request` | 替换原请求并重新入队 |
| process_response | 响应返回后 | `Response` | 响应继续向上传递 |
| process_response | 响应返回后 | `Request` | 丢弃当前响应，重新调度新请求 |
| process_exception | 请求抛出异常时 | `Request` / `Response` / `None` | 分别表示重试、直接给出结果、交由其他中间件处理 |

启用中间件：

```python
# settings.py
DOWNLOADER_MIDDLEWARES = {
    "my_spider.middlewares.RandomUserAgentMiddleware": 400,  # 数值控制执行顺序
    "my_spider.middlewares.ProxyMiddleware": 500,
    # 将内置中间件置为 None 表示关闭
    "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
}
```

数值遵循与管道一致的约定：越小越早执行。替换内置能力时，需显式将对应内置中间件设为 `None`，否则自定义逻辑会与内置逻辑叠加。

### 5.2 爬虫中间件（Spider Middleware）

爬虫中间件作用于 Spider 的输入与输出两侧：`process_start_requests` 在起始请求进入调度器前介入，`process_spider_input` 在响应交给回调前介入，`process_spider_output` 在回调产出结果后介入，`process_spider_exception` 处理回调抛出的异常。其编写方式与下载器中间件同构，注册项为 `SPIDER_MIDDLEWARES`，典型用途是统一清洗回调产出、拦截解析异常与统计各字段缺失率。

### 5.3 集成 Playwright 处理动态页面

Scrapy 通过 `scrapy-playwright` 与 Playwright 集成，由浏览器完成渲染后再将结果交回 Spider 解析。

```bash
pip install scrapy-playwright
playwright install chromium
```

```python
# settings.py
DOWNLOAD_HANDLERS = {
    "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
}
```

```python
# 在 Spider 中使用
import scrapy


class JSSpider(scrapy.Spider):
    name = "js_page"
    start_urls = ["https://example.com/dynamic-page"]

    def start_requests(self):
        yield scrapy.Request(
            url="https://example.com/dynamic-page",
            meta={
                "playwright": True,               # 该请求交由 Playwright 渲染
                "playwright_include_page": True,  # 同时在回调中提供 page 对象
            },
        )

    async def parse(self, response):
        # response 为 Playwright 渲染后的结果
        # 仍可直接使用 CSS / XPath 选择器提取
        title = response.css("h1::text").get()
        yield {"title": title}
```

渲染请求的耗时显著高于普通 HTTP 请求，应配合 `CONCURRENT_REQUESTS` 与 `DOWNLOAD_TIMEOUT` 下调并发、放宽超时。`scrapy-playwright` 依赖 asyncio 事件循环，需在 settings 中将 `TWISTED_REACTOR` 切换为 `AsyncioSelectorReactor` 才能正常工作。

**要点**：

- **要点**：下载器中间件覆盖代理、请求头与重试三类需求，是无需改动 Spider 的扩展入口。
- **要点**：钩子返回值决定后续流程，返回 `Request` 即重新调度，返回 `None` 即继续传递。
- **要点**：`scrapy-playwright` 用于 JS 渲染页面，代价是并发能力下降，宜仅对确需渲染的 URL 开启。
- **要点**：中间件必须注册进 `DOWNLOADER_MIDDLEWARES` 或 `SPIDER_MIDDLEWARES` 才会生效。

---

## 6. settings 与进阶用法

### 6.1 配置文件详解

`settings.py` 集中控制并发、延迟、重试、请求头、去重与限速策略，是性能调优的主要入口。

```python
# settings.py（常用配置）

# 并发
CONCURRENT_REQUESTS = 16              # 最大并发请求数
CONCURRENT_REQUESTS_PER_DOMAIN = 8    # 单个域名的最大并发数

# 下载
DOWNLOAD_DELAY = 0.5                  # 请求间隔（秒）
RANDOMIZE_DOWNLOAD_DELAY = True       # 随机化延迟，避免请求节奏过于规律

# 超时
DOWNLOAD_TIMEOUT = 15                 # 下载超时（秒）

# 重试
RETRY_ENABLED = True                  # 启用重试
RETRY_TIMES = 3                       # 重试次数
RETRY_HTTP_CODES = [500, 502, 503, 504, 403, 429]  # 触发重试的状态码

# 请求头
DEFAULT_REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 ...",
    "Accept": "text/html,application/json,*/*",
}

# 去重
DUPEFILTER_CLASS = "scrapy.dupefilters.RFPDupeFilter"  # 默认去重过滤器

# robots.txt
ROBOTSTXT_OBEY = False                # 是否遵守 robots.txt 声明

# 自动限速（避免被封）
AUTOTHROTTLE_ENABLED = True           # 启用自动限速
AUTOTHROTTLE_START_DELAY = 1.0        # 初始延迟
AUTOTHROTTLE_MAX_DELAY = 10.0         # 最大延迟
AUTOTHROTTLE_TARGET_CONCURRENCY = 5.0 # 单个域名的平均并发请求数
```

配置项说明：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| CONCURRENT_REQUESTS | 16 | 全局最大并发请求数 |
| CONCURRENT_REQUESTS_PER_DOMAIN | 8 | 单个域名的最大并发请求数 |
| DOWNLOAD_DELAY | 0 | 同一域名的请求间隔（秒） |
| RANDOMIZE_DOWNLOAD_DELAY | True | 将延迟随机化在 0.5–1.5 倍区间 |
| DOWNLOAD_TIMEOUT | 180 | 单个请求的下载超时（秒） |
| RETRY_ENABLED | True | 是否启用内置重试 |
| RETRY_TIMES | 2 | 重试次数 |
| RETRY_HTTP_CODES | 500, 502, 503, 504, 554 | 触发重试的响应状态码 |
| DUPEFILTER_CLASS | RFPDupeFilter | 去重过滤器实现类 |
| ROBOTSTXT_OBEY | False | 是否遵守目标站点的 robots.txt |
| AUTOTHROTTLE_ENABLED | False | 是否启用自动限速 |
| AUTOTHROTTLE_TARGET_CONCURRENCY | 8.0 | 自动限速追求的单个域名平均并发数 |
| ITEM_PIPELINES | 空 | 条目管道的注册表与执行优先级 |
| DOWNLOADER_MIDDLEWARES | 内置集合 | 下载器中间件注册表 |
| BOT_NAME | 空 | 用于在日志与请求头中标识爬虫来源 |

调优的基本判断顺序：先用 `AUTOTHROTTLE_ENABLED` 让框架自适应，再针对目标站点承载能力手动收紧并发，最后依据日志中的失败率与响应时间复核参数。

### 6.2 信号与事件

信号（Signals）机制允许在框架生命周期节点插入自定义逻辑。

```python
# 在 Spider 中监听生命周期与抓取事件
import scrapy
from scrapy import signals


class MySpider(scrapy.Spider):
    name = "my_spider"

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super().from_crawler(crawler, *args, **kwargs)
        # 注册信号处理器
        crawler.signals.connect(spider.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(spider.spider_closed, signal=signals.spider_closed)
        crawler.signals.connect(spider.item_scraped, signal=signals.item_scraped)
        return spider

    def spider_opened(self, spider):
        print(f"爬虫 {spider.name} 启动")

    def spider_closed(self, spider, reason):
        print(f"爬虫 {spider.name} 关闭，原因: {reason}")

    def item_scraped(self, item, response, spider):
        print(f"抓取到一条数据: {item}")
```

常用信号：

| 信号 | 触发时机 | 典型用途 |
| --- | --- | --- |
| spider_opened | 爬虫启动完成 | 初始化资源、记录起始时间 |
| spider_closed | 爬虫退出 | 释放资源、汇总统计并上报 |
| response_received | 收到响应、交给回调前 | 统计状态码分布、埋点监控 |
| item_scraped | Spider 产出数据、进入管道前 | 逐条记录进度 |
| item_pipeline_dropped | 数据被管道丢弃 | 统计去重与校验淘汰量 |

除 Spider 内部注册外，信号也可在项目级通过 `scrapy` 命令行与扩展（Extension）机制连接，用于实现跨爬虫复用的监控与统计能力。

**要点**：

- **要点**：并发参数与延迟参数需成对调整，单独提高并发而不清零延迟会放大排队。
- **要点**：将 403、429 纳入 `RETRY_HTTP_CODES` 属于短期手段，长期应配合代理与限速。
- **要点**：`ROBOTSTXT_OBEY` 决定起始请求是否受 robots.txt 约束，生产项目需按合规要求显式设置。
- **要点**：信号用于观测框架生命周期，业务数据处理仍应放在管道与中间件中。

---

## 7. Scrapy-Redis 分布式爬虫

### 7.1 适用场景与核心问题

当单机抓取速度无法满足数据量与时效要求时，可将任务拆分到多台机器并行执行。分布式方案要解决的核心问题有两个：多台机器如何共享"待爬取 URL 队列"，以及多台机器如何共享"已爬取 URL 记录"以保证全局去重。

Scrapy-Redis 的方案是把调度器（Scheduler）与去重过滤器（Dupe Filter）的状态从进程内存迁移到 Redis，使所有节点读写同一份队列与集合。

```text
              ┌───────────── Redis ──────────────┐
              │  URL 队列（共享待爬队列）         │
              │  去重集合（共享已爬记录）         │
              └──────┬──────────────┬────────────┘
                     │              │
              ┌──────▼────┐  ┌──────▼─────┐
              │ 爬虫节点1 │  │  爬虫节点2 │  ...
              │ (Scrapy)  │  │  (Scrapy)  │
              └───────────┘  └────────────┘
```

| 组件 | 单机 Scrapy 默认实现 | 分布式替换实现 |
| --- | --- | --- |
| 调度器 | 进程内存队列 | `scrapy_redis.scheduler.Scheduler` |
| 去重过滤器 | `RFPDupeFilter`（内存） | `scrapy_redis.dupefilter.RFPDupeFilter` |
| 起始 URL 来源 | `start_urls` 类属性 | Redis key（`redis_key`） |

### 7.2 安装与配置

```bash
pip install scrapy-redis
```

```python
# settings.py（用 Redis 替换 Scrapy 的默认调度器与去重器）

# 必要配置
SCHEDULER = "scrapy_redis.scheduler.Scheduler"              # 使用 Redis 调度器
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"  # 使用 Redis 去重

# Redis 连接
REDIS_HOST = "127.0.0.1"  # Redis 服务器地址
REDIS_PORT = 6379
REDIS_PARAMS = {
    "password": "your_password",  # 访问密码（如有）
    "db": 0,
}

# 可选配置
SCHEDULER_PERSIST = True   # 爬虫关闭后不清理 Redis 队列，下次运行继续消费
```

所有节点必须指向同一台 Redis 实例，且 Redis 服务需允许跨机器访问（`bind` 与防火墙配置）。`SCHEDULER_PERSIST = True` 支持断点续爬，代价是 Redis 中的队列与去重集合会长期驻留，需规划清理策略。

### 7.3 编写分布式爬虫

分布式爬虫与普通 Scrapy 爬虫的写法几乎一致，差别在于继承 `RedisSpider` 并以 `redis_key` 替代 `start_urls`。

```python
from scrapy_redis.spiders import RedisSpider


class DistributedSpider(RedisSpider):
    """分布式爬虫"""
    name = "distributed"
    allowed_domains = ["example.com"]

    # 不再使用 start_urls
    # 改为监听该 Redis key，由外部命令推送起始 URL
    redis_key = "distributed:start_urls"

    def parse(self, response):
        yield {"url": response.url, "title": response.css("title::text").get()}

        # 提取页面内的新链接继续爬取
        for href in response.css("a::attr(href)").getall():
            yield response.follow(href, callback=self.parse)
```

两种起始 URL 的提供方式：

方法一：向 Redis 队列推入 URL，节点自动消费。

```bash
# redis-cli 中执行
lpush distributed:start_urls "https://example.com"
```

方法二：由上游程序或调度脚本通过 Redis 客户端写入同一 key，适用于与已有数据生产链路对接的场景。

节点启动命令在所有机器上保持一致：

```bash
scrapy crawl distributed
```

`redis_key` 约定使用 `<爬虫名>:start_urls` 格式，便于与 scrapy-redis 默认监听队列（`<爬虫名>:requests`、`<爬虫名>:items`）区分，并避免多爬虫共用 key 造成任务串扰。

### 7.4 手动推入起始 URL

```bash
# 在所有爬虫节点启动后，向 Redis 推入起始 URL
redis-cli lpush distributed:start_urls "https://example.com/page/1"
redis-cli lpush distributed:start_urls "https://example.com/page/2"
redis-cli lpush distributed:start_urls "https://example.com/page/3"
```

所有爬虫节点从共享队列中取出 URL 各自抓取，写入的后续请求与已爬记录同样落在共享集合中，因此不会出现多节点重复抓取同一页面的情况。

**要点**：

- **要点**：Scrapy-Redis 只共享调度状态，解析与存储仍在各节点本地执行，数据库需承受多节点并发写入。
- **要点**：节点无需固定任务分配，空闲时自行从队列取任务，天然具备负载均衡能力。
- **要点**：起始 URL 是系统唯一的输入口，未推入 URL 时所有节点处于等待状态。
- **要点**：单机足以完成抓取量时不应引入分布式，额外组件会带来运维与一致性成本。

---

## 8. 学习建议与实践路径

1. **按工程化工具的定位使用 Scrapy**：在引入框架前，先用 requests 编写若干爬虫以理解完整流程。当需求进入规范化与规模化阶段时，框架收益才真正体现。
2. **先跑通，再读源码**：用 `scrapy startproject` 创建项目，编写最简爬虫，用 `scrapy crawl` 运行成功，再逐个深入组件的实现细节。
3. **以 settings.py 作为调优主入口**：大部分性能调整可通过配置完成，无需修改代码。
4. **下载器中间件是主要扩展点**：代理、User-Agent 轮换与 Playwright 集成均以中间件实现。
5. **分布式不是通用解法**：单机可完成的数据量无需引入分布式。分布式针对的是单机承载能力不足的场景，而不是技术栈完整性的追求。
6. **先以 `-o` 输出文件验证结果**：抓取结果先落文件确认可用，再补充 Pipeline 实现数据库持久化。

**要点**：

- **要点**：学习顺序为"跑通最小爬虫 → 掌握配置 → 编写管道与中间件 → 引入分布式"。
- **要点**：判断能力是否掌握的标准，是能否在不查示例的前提下完成"列表页 + 详情页 + 入库"的完整链路。
- **要点**：配置与中间件解决的是抓取行为的稳定性，代码结构解决的是可维护性，两者不可互相替代。

---

## 阶段小结

| 知识模块 | 核心要点 | 在爬虫中的作用 |
| --- | --- | --- |
| 核心架构 | 引擎、调度器、下载器、爬虫、条目管道五组件与两类中间件 | 明确各扩展点的作用位置，避免在错误的层次实现功能 |
| 项目结构与命令 | `startproject` / `genspider` / `crawl` 与标准目录约定 | 将抓取代码组织为可部署、可协作的工程 |
| Spider 编写 | `parse` 回调、`yield` Item 与 Request、翻页与参数化 | 承载具体的数据提取逻辑 |
| Item 与条目管道 | 数据结构定义、清洗去重、优先级注册 | 在数据落库前统一完成质量保障与持久化 |
| 下载器中间件 | `process_request` / `process_response` / `process_exception` 三类钩子 | 不改 Spider 代码即可注入代理、请求头与重试策略 |
| Playwright 集成 | `DOWNLOAD_HANDLERS` 与请求级 `meta` 开关 | 处理 JS 渲染后的动态页面 |
| settings 配置 | 并发、延迟、超时、重试、限速与 robots 配置 | 以声明式参数决定抓取强度与稳定性 |
| 信号与事件 | 生命周期与产出节点的订阅机制 | 实现监控、统计与资源管理 |
| Scrapy-Redis | 共享调度队列与全局去重集合 | 将抓取能力从单机扩展到多节点并行 |

---

## 常见问题与排查

| 现象 | 原因 | 处理方式 |
| --- | --- | --- |
| 爬虫立即结束且无任何输出 | `start_urls` 为空，或域名不在 `allowed_domains` 中被过滤 | 检查起始 URL 与域名白名单；查看日志中的 `offsite` 过滤计数 |
| 提示 `Spider not found` | `name` 与命令行参数不一致，或 Spider 文件不在 `spiders/` 包内 | 用 `scrapy list` 确认可见爬虫名，核对文件位置与包结构 |
| Pipeline 未生效 | 未在 `ITEM_PIPELINES` 中注册，或路径书写错误 | 检查注册键为"模块路径.类名"完整字符串，并核对优先级数值 |
| 数据被管道静默丢弃 | 上游管道抛出 `DropItem`，或 `process_item` 未返回 item | 查看 `item_dropped_count` 统计与日志原因字段，补齐返回值 |
| 动态页面选择器提取为空 | 目标内容由 JS 渲染，HTTP 响应中不含该节点 | 集成 `scrapy-playwright` 并在请求 `meta` 中开启渲染，或改用 `page` 对象提取 |
| 大量 403 / 429 响应 | 请求频率或特征被识别 | 启用 `AUTOTHROTTLE_ENABLED`、下调并发、增大 `DOWNLOAD_DELAY` 并配置代理轮换 |
| robots.txt 限制导致请求跳过 | `ROBOTSTXT_OBEY = True` 时遵循站点声明 | 保持对站点规则的尊重，仅在授权范围内调整抓取策略 |
| 分布式节点长时间空闲 | 未向 `redis_key` 推入起始 URL，或各节点连接的不是同一 Redis | 用 `redis-cli` 检查队列长度与连接地址，确认 `REDIS_HOST` 一致 |

---

## 下一阶段衔接

本阶段解决了"如何以框架规模化地抓取"，但尚未处理抓取过程中的对抗性问题：请求指纹识别、封禁判定、参数加密与响应混淆。第六阶段《反爬虫对抗与 JS 逆向》将在此之上补充身份伪装、频控规避与加密参数还原的实现细节，并把本阶段的下载器中间件作为落地这些策略的主要扩展点。完成两阶段后，第七阶段将进入数据存储与部署，把 Pipeline 的写入目标从文件切换到数据库与消息队列。

