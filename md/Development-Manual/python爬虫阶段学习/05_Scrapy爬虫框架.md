# 第五阶段：Scrapy 爬虫框架（工程化）

> 前面的阶段都是"造轮子"，Scrapy 是爬虫界的 Django —— 一个**工业级的爬虫框架**。
> 你只需要定义"怎么提取数据"，剩下的并发、调度、去重、管道，框架都帮你做了。

---

## 目录

1. [Scrapy 核心架构](#1-scrapy-核心架构)
2. [安装与创建项目](#2-安装与创建项目)
3. [Spider — 编写爬虫](#3-spider--编写爬虫)
4. [Item Pipeline — 数据处理管道](#4-item-pipeline--数据处理管道)
5. [爬虫中间件与下载器中间件](#5-爬虫中间件与下载器中间件)
6. [Scrapy 进阶用法](#6-scrapy-进阶用法)
7. [分布式爬虫 — Scrapy-Redis](#7-分布式爬虫--scrapy-redis)

---

## 1. Scrapy 核心架构

### 1.1 五大组件

```
                    ┌──────────────────────┐
                    │   Spider (爬虫)       │
                    │   你的代码在这里       │
                    └──────────┬───────────┘
                               │ yield Request / Item
                               ▼
┌──────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  Scheduler   │◄──│  Engine (引擎)        │──►│  Downloader  │
│  (调度器)     │   │  核心调度器           │   │  (下载器)     │
│  请求队列     │──►│                      │◄──│  发请求       │
└──────────────┘   └──────┬───────────────┘   └──────────────┘
                          │ Item
                          ▼
               ┌──────────────────────┐
               │  Item Pipeline       │
               │  (管道：清洗/保存)    │
               │  数据库 / CSV / JSON │
               └──────────────────────┘

还有两个中间件（钩子）：
  - Downloader Middleware：在请求发送前/响应返回后做处理
  - Spider Middleware：在 Spider 处理前/处理后做处理
```

**核心流程（一句话）：**

```text
Spider 说要抓某个 URL → Engine 告诉 Scheduler 收下 → Scheduler 排队 →
轮到该请求了 → Engine 交给 Downloader 发请求 → 拿到响应 → Engine 交给 Spider 解析 →
Spider 提取出数据 (Item) 或新的 URL (Request) →
Item 走 Pipeline 保存 / Request 送回 Scheduler 排队
```

### 1.2 Scrapy 的优势

```python
"""
为什么用 Scrapy？

从零写的爬虫                          Scrapy
───────────────                      ──────
你得自己管理请求队列                    ✅ 内置 Scheduler
你得自己实现并发                       ✅ 内置协程并发（Twisted）
你得自己处理去重                       ✅ 内置去重（RFPDupeFilter）
你得自己写重试逻辑                     ✅ 内置重试中间件
你得自己处理编码                       ✅ 自动检测编码
你得自己考虑数据管道                     ✅ Pipeline 分离
你要自己加代理                         ✅ Downloader Middleware
你得自己部署                           ✅ Scrapyd / 命令行运行
"""
```

---

## 2. 安装与创建项目

### 2.1 安装

```bash
pip install scrapy
```

### 2.2 创建项目

```bash
# 创建项目
scrapy startproject my_spider

# 目录结构
cd my_spider
tree
```

```
my_spider/
├── scrapy.cfg               # 项目配置文件
└── my_spider/
    ├── __init__.py
    ├── items.py              # 定义数据结构
    ├── middlewares.py         # 中间件
    ├── pipelines.py           # 管道（数据清洗 + 存储）
    ├── settings.py            # 项目设置
    └── spiders/               # 你的爬虫放这里
        ├── __init__.py
        └── example.py
```

### 2.3 创建爬虫

```bash
# 方式 1：命令行创建
cd my_spider
scrapy genspider example example.com

# 方式 2：手动创建（在 spiders/ 下新建 .py 文件）
```

---

## 3. Spider — 编写爬虫

### 3.1 最基本的爬虫

```python
# my_spider/spiders/example.py
import scrapy


class ExampleSpider(scrapy.Spider):
    """最基本的爬虫"""
    name = "example"                 # 爬虫名字（唯一标识，运行用这个）
    allowed_domains = ["example.com"]  # 允许爬取的域名（防止爬偏）
    start_urls = ["https://example.com"]  # 起始 URL 列表

    def parse(self, response):
        """解析响应（默认回调函数）"""
        title = response.css("h1::text").get()
        content = response.css(".content::text").get()

        # yield 返回字典（最简单的数据输出方式）
        yield {
            "title": title,
            "content": content,
        }
```

### 3.2 运行爬虫

```bash
# 运行爬虫
scrapy crawl example

# 保存结果到 JSON
scrapy crawl example -o output.json

# 保存结果到 CSV
scrapy crawl example -o output.csv

# 保存结果到 JSON Lines（每行一个 JSON，适合大数据）
scrapy crawl example -o output.jl
```

### 3.3 翻页爬虫

```python
import scrapy
from scrapy.linkextractors import LinkExtractor


class MovieSpider(scrapy.Spider):
    name = "movies"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com/movies?page=1"]

    def parse(self, response):
        """提取当前页的电影数据"""
        # 提取电影列表
        for movie in response.css(".movie-item"):
            yield {
                "title": movie.css(".title::text").get(),
                "score": movie.css(".score::text").get(),
                "url": response.urljoin(movie.css("a::attr(href)").get()),
            }

        # 翻页：找到"下一页"的链接，继续爬
        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            # 构建完整的 URL（处理相对路径）
            next_url = response.urljoin(next_page)
            yield scrapy.Request(
                url=next_url,
                callback=self.parse,  # 回调函数，拿到响应后调用 parse
            )

    # ── 也可以一次性全部生成 ──
    def start_requests(self):
        """重写 start_requests 可以自定义初始请求"""
        for page in range(1, 11):
            yield scrapy.Request(
                url=f"https://example.com/movies?page={page}",
                callback=self.parse,
                # 可以传额外参数
                meta={"page": page},
            )
```

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

### 3.5 爬虫实战：完整示例

```python
# spiders/douban_top250.py
import scrapy


class DoubanTop250Spider(scrapy.Spider):
    """豆瓣电影 Top250 爬虫"""
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
            # response.follow 自动处理 URL 拼接，不需要 urljoin
```

---

## 4. Item Pipeline — 数据处理管道

> Pipeline 是对提取的数据做"后处理"的地方：清洗、验证、去重、存数据库。

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
            # 用 Item 替代字典
            item = MovieItem(
                title=movie.css(".title::text").get(),
                score=movie.css(".score::text").get(),
                year=movie.css(".year::text").get(),
                crawled_at=datetime.now().isoformat(),
            )
            yield item
```

### 4.3 编写 Pipeline

```python
# pipelines.py
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
        """爬虫关闭时调用（关闭文件）"""
        self.file.write("\n]")
        self.file.close()

    def process_item(self, item, spider):
        """处理每个 Item（核心方法）"""
        if isinstance(item, MovieItem):
            line = json.dumps(dict(item), ensure_ascii=False)
            if not self.first:
                self.file.write(",\n")
            self.file.write(f"  {line}")
            self.first = False
        return item  # 必须返回 item，交给下一个 pipeline


class PricePipeline:
    """数据处理：清洗价格"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        # 清洗：去掉价格中的货币符号，转为 float
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
        # 用 URL 作为去重依据
        if adapter.get("url") in self.seen:
            raise scrapy.exceptions.DropItem(f"重复: {adapter['url']}")
        else:
            self.seen.add(adapter.get("url"))
            return item
```

### 4.4 启用 Pipeline

```python
# settings.py 中启用
ITEM_PIPELINES = {
    "my_spider.pipelines.DuplicatesPipeline": 100,  # 数字越小越先执行
    "my_spider.pipelines.PricePipeline": 200,
    "my_spider.pipelines.JsonPipeline": 300,
}
```

---

## 5. 爬虫中间件与下载器中间件

### 5.1 Downloader Middleware（最常用）

> 在请求发送前 / 响应返回后插一脚。常用于：加代理、改 User-Agent、集成 Playwright。

```python
# middlewares.py
import random


class RandomUserAgentMiddleware:
    """随机更换 User-Agent"""

    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ]

    def process_request(self, request, spider):
        """在请求发送前调用"""
        ua = random.choice(self.user_agents)
        request.headers["User-Agent"] = ua
        return None  # 返回 None，继续执行


class ProxyMiddleware:
    """代理中间件"""

    def process_request(self, request, spider):
        """给每个请求设置代理"""
        proxy = self.get_proxy()
        request.meta["proxy"] = proxy

    def get_proxy(self):
        """从代理池获取一个代理"""
        # 这里可以从 Redis/文件/API 获取代理
        return "http://127.0.0.1:7890"


class RetryMiddleware:
    """自定义重试中间件（Scrapy 内置了重试，这里只是示例）"""

    def process_response(self, request, response, spider):
        """响应返回后调用"""
        if response.status in [403, 429]:
            # 被屏蔽了，换个代理重试
            new_request = request.copy()
            new_request.meta["proxy"] = "http://new-proxy:8080"
            return new_request  # 返回 Request 会重新调度
        return response  # 正常就返回 Response

    def process_exception(self, request, exception, spider):
        """请求发生异常时调用"""
        print(f"请求异常: {request.url} - {exception}")
        return request  # 重试
```

**启用中间件：**

```python
# settings.py
DOWNLOADER_MIDDLEWARES = {
    "my_spider.middlewares.RandomUserAgentMiddleware": 400,  # 数字控制执行顺序
    "my_spider.middlewares.ProxyMiddleware": 500,
    # 可以关闭内置的中间件
    "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
}
```

### 5.2 集成 Playwright（处理动态页面）

> Scrapy 配合 `scrapy-playwright` 可以无缝集成 Playwright。

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
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
}
```

```python
# 在 spider 中使用
import scrapy


class JSSpider(scrapy.Spider):
    name = "js_page"
    start_urls = ["https://example.com/dynamic-page"]

    def start_requests(self):
        yield scrapy.Request(
            url="https://example.com/dynamic-page",
            meta={
                "playwright": True,  # 用 Playwright 渲染
                "playwright_include_page": True,
            },
        )

    async def parse(self, response):
        # response 是 Playwright 渲染后的结果
        # 可以直接用 CSS/XPath 提取
        title = response.css("h1::text").get()
        yield {"title": title}
```

---

## 6. Scrapy 进阶用法

### 6.1 设置文件详解

```python
# settings.py（常用配置）

# ── 并发 ──
CONCURRENT_REQUESTS = 16              # 最大并发请求数
CONCURRENT_REQUESTS_PER_DOMAIN = 8    # 每个域名最大并发

# ── 下载 ──
DOWNLOAD_DELAY = 0.5                  # 请求间隔（秒）
RANDOMIZE_DOWNLOAD_DELAY = True       # 随机化延迟（避免规律被封）

# ── 超时 ──
DOWNLOAD_TIMEOUT = 15                 # 下载超时（秒）

# ── 重试 ──
RETRY_ENABLED = True                  # 启用重试
RETRY_TIMES = 3                       # 重试次数
RETRY_HTTP_CODES = [500, 502, 503, 504, 403, 429]  # 哪些状态码触犯重试

# ── 请求头 ──
DEFAULT_REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 ...",
    "Accept": "text/html,application/json,*/*",
}

# ── 去重 ──
DUPEFILTER_CLASS = "scrapy.dupefilters.RFPDupeFilter"  # 默认去重

# ── robots.txt ──
ROBOTSTXT_OBEY = False                # 是否遵守 robots.txt

# ── 自动限速（避免被封）──
AUTOTHROTTLE_ENABLED = True           # 启用自动限速
AUTOTHROTTLE_START_DELAY = 1.0        # 初始延迟
AUTOTHROTTLE_MAX_DELAY = 10.0         # 最大延迟
AUTOTHROTTLE_TARGET_CONCURRENCY = 5.0 # 平均每秒请求数
```

### 6.2 信号与事件

```python
# 可以在 Spider 中监听各种事件
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

---

## 7. 分布式爬虫 — Scrapy-Redis

### 7.1 什么是分布式爬虫？

> 一台机器爬太慢 → 多台机器一起爬。
> 核心问题：多台机器怎么共享"哪些 URL 已经爬过"和"还有哪些 URL 要爬"？

```
              ┌───────────── Redis ─────────────┐
              │  URL 队列 (共享待爬队列)          │
              │  去重集合 (共享已爬记录)           │
              └──────┬──────────────┬───────────┘
                     │              │
              ┌──────▼────┐  ┌─────▼─────┐
              │ 爬虫节点 1 │  │ 爬虫节点 2 │  ...
              │ (Scrapy)  │  │ (Scrapy)  │
              └───────────┘  └───────────┘
```

### 7.2 安装与配置

```bash
pip install scrapy-redis
```

```python
# settings.py（用 Redis 替换 Scrapy 的默认调度器和去重器）

# ── 必须的配置 ──
SCHEDULER = "scrapy_redis.scheduler.Scheduler"          # 使用 Redis 调度器
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"  # 使用 Redis 去重

# ── Redis 连接 ──
REDIS_HOST = "127.0.0.1"  # Redis 服务器地址
REDIS_PORT = 6379
REDIS_PARAMS = {
    "password": "your_password",  # 如有密码
    "db": 0,
}

# ── 可选 ──
SCHEDULER_PERSIST = True   # 爬虫关闭后不清理 Redis 队列（下次接着爬）
```

### 7.3 编写分布式爬虫

```python
# 和普通 Scrapy 爬虫几乎一样，只是继承 RedisSpider
from scrapy_redis.spiders import RedisSpider


class DistributedSpider(RedisSpider):
    """分布式爬虫"""
    name = "distributed"
    allowed_domains = ["example.com"]

    # 不再使用 start_urls
    # Redis key，通过 Redis 命令推送起始 URL
    redis_key = "spider:start_urls"

    def parse(self, response):
        yield {"url": response.url, "title": response.css("title::text").get()}

        # 提取新链接继续爬
        for href in response.css("a::attr(href)").getall():
            yield response.follow(href, callback=self.parse)


# 启动方式 1：在 Redis 中 push 起始 URL
# redis-cli> lpush spider:start_urls "https://example.com"

# 启动方式 2：手动添加
# from scrapy_redis.spiders import RedisSpider
# spider = DistributedSpider()
# spider.redis_key = "spider:start_urls"

# 运行（在所有节点上执行）：
# scrapy crawl distributed
```

### 7.4 手动推入起始 URL

```bash
# 在所有爬虫节点启动后，向 Redis 推入起始 URL
redis-cli lpush spider:start_urls "https://example.com/page/1"
redis-cli lpush spider:start_urls "https://example.com/page/2"
redis-cli lpush spider:start_urls "https://example.com/page/3"
```

所有爬虫节点会从 Redis 队列里取 URL，各自抓取，共享去重。

---

## 学习建议

1. **Scrapy 是工程化工具**：别急着上 Scrapy，先用 requests 写几个爬虫理解流程。Scrapy 是在你需要"规范化和规模化"时才需要的。

2. **先跑通，再看源码**：用 `scrapy startproject` 创建项目 → 写一个最简单的爬虫 → `scrapy crawl` 跑起来 → 再深入理解组件。

3. **settings.py 是你的朋友**：大部分性能调优都在 settings 里，不用改代码。

4. **Downloader Middleware 是钩子主力**：加代理、改 UA、集成 Playwright，都用中间件。

5. **分布式不是银弹**：如果你一台机器就能爬完所有数据，不需要分布式。分布式解决的是"量大到一台机器扛不住"的问题，不是"我想学分布式"的问题。

6. **先用 `-o` 输出文件**：抓取结果先用 `-o output.json` 保存文件，等需要持久化时再加 Pipeline 存数据库。
