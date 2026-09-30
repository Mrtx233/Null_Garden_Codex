# Scrapy 基础入门完整总结

大家好，我是小马不起床。

爬虫系列的方法篇讲到了工程化。前几篇的手写爬虫适合学习与小任务，但当采集规模上升到成百上千个站点时，框架化是唯一可持续的路径。本文按"工程化思想 → 工作流程 → 项目构建 → Spider / Item / Pipeline → 登录与中间件 → 全站抓取 → 增量与分布式"的完整链路，系统梳理 Scrapy 入门到实战的核心知识，附全部代码模板，建议收藏。

---

## 目录

1. 爬虫工程化与 Scrapy 简介
2. Scrapy 核心工作流程
3. Scrapy 安装与版本建议
4. Scrapy 项目创建与目录结构
5. Spider 基础写法
6. Item 自定义数据结构
7. Pipeline 管道
8. 文件、MySQL、MongoDB 与图片保存
9. Request 对象与多级页面请求
10. Cookie 与模拟登录
11. DownloaderMiddleware 下载器中间件
12. SpiderMiddleware 爬虫中间件
13. 全站数据抓取
14. CrawlSpider 与 Rule
15. 增量式爬虫
16. 分布式爬虫与 scrapy-redis
17. 布隆过滤器
18. Scrapy 项目实战开发流程
19. 常用配置速查
20. 常用代码模板

---

## 1. 爬虫工程化与 Scrapy 简介

手写爬虫阶段，通常是单个脚本从头写到尾：

```text
发请求
-> 获取响应
-> 解析数据
-> 翻页或进入详情页
-> 保存数据
```

这种方式适合学习与小型任务，不适合规模化商用项目。原因如下：

- 代码呈线性流程，结构僵化。
- 各功能高度耦合。
- 请求、解析、存储、去重、异常处理混杂于同一文件。
- 共性逻辑无法复用。
- 当爬虫数量达到百级时，维护成本急剧上升。

爬虫工程化的核心思想是：

```text
将爬虫功能拆分为多个模块
每个模块只承担单一职责
模块之间通过框架调度协作
```

Scrapy 即为此类工程化爬虫框架。

Scrapy 官方定位：

```text
An open source and collaborative framework for extracting the data you need from websites.

In a fast, simple, yet extensible way.
```

其特点可归纳为：

- 执行速度快。
- 使用门槛低。
- 可扩展性强。
- 模块边界清晰。
- 适合批量开发爬虫项目。

官方文档：<https://docs.scrapy.org/en/latest/>

关于框架的学习路线，不建议一开始就深入研读源码。更合理的路径是：

```text
先掌握如何使用
-> 明确每个扩展点应填入什么代码
-> 再反过来理解源码与执行流程
```

---

## 2. Scrapy 核心工作流程

Scrapy 将手写爬虫中的各个核心步骤拆解为独立组件。

核心组件：

```text
Engine      引擎
Scheduler   调度器
Downloader  下载器
Spider      爬虫
Pipeline    管道
Middleware  中间件
```

### 2.1 Scrapy 整体流程

Scrapy 的工作流程可概括为：

1. Spider 生成起始 `Request` 对象，交给调度器。
2. Engine 从 Scheduler 中取出请求，交给 Downloader。
3. Downloader 发送请求，获取响应，封装为 `Response` 对象。
4. Engine 将 `Response` 交给 Spider。
5. Spider 在 `parse()` 或其他回调函数中解析数据。
6. 若解析出数据，交给 Pipeline 保存或处理。
7. 若解析出新的 URL，构造新的 `Request`，再次交给 Scheduler。
8. 重复以上过程，直至没有新的请求。

流程示意：

```text
Spider
  -> Request
  -> Scheduler
  -> Engine
  -> Downloader
  -> Response
  -> Engine
  -> Spider.parse()
      -> Item / dict -> Pipeline
      -> Request     -> Scheduler
```

### 2.2 各组件职责

### Engine 引擎

Engine 是 Scrapy 的核心，负责调度全部组件。

可理解为总指挥，其职责是裁决：

```text
谁该执行
数据该交给谁
请求从哪里来
响应到哪里去
```

### Scheduler 调度器

调度器本质是一个请求队列。

职责：

- 存放待发送的请求。
- 决定下一个抓取的 URL。
- 对请求进行去重。

普通 Scrapy 中，调度器由本机内存或磁盘维护；分布式场景下，调度器可移交 Redis 承担。

### Downloader 下载器

下载器负责实际发送网络请求。

可粗略类比于：

```python
requests.get(url)
```

区别在于 Scrapy 下载器返回的是框架统一的 `Response` 对象。

### Spider 爬虫

Spider 是开发者编写代码最集中的位置。

职责：

- 定义起始 URL。
- 解析 `Response`。
- 提取数据。
- 构造新的请求。

### Pipeline 管道

Pipeline 负责处理 Spider 提取出的数据。

职责：

- 保存文件。
- 写入 MySQL。
- 写入 MongoDB。
- 下载图片。
- 清洗数据。
- 数据去重。

### Middleware 中间件

中间件负责在请求或响应的流转过程中插入扩展逻辑。

常见用途：

- 随机 User-Agent。
- 设置代理。
- 处理 Cookie。
- 重试失败请求。
- 拦截异常响应。

---

## 3. Scrapy 安装与版本建议

本文推荐的参考版本：

```text
scrapy       2.11.2
scrapy-redis 0.9.1
```

安装 Scrapy：

```bash
pip install scrapy==2.11.2
```

下载缓慢时，可切换国内镜像源：

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple scrapy==2.11.2
```

安装失败的排查顺序：

1. 升级 pip。
2. 重新安装。
3. 依据报错处理依赖。
4. Windows 旧系统建议升级 Python 与系统运行环境。

安装 scrapy-redis：

```bash
pip install scrapy-redis==0.9.1
```

---

## 4. Scrapy 项目创建与目录结构

### 4.1 创建项目

```bash
scrapy startproject 项目名称
```

示例：

```bash
scrapy startproject mySpider_2
```

项目结构：

```text
mySpider_2
├── mySpider_2
│   ├── __init__.py
│   ├── items.py          定义数据结构
│   ├── middlewares.py    中间件
│   ├── pipelines.py      管道
│   ├── settings.py       配置文件
│   └── spiders           爬虫目录
│       └── __init__.py
└── scrapy.cfg            项目配置文件
```

### 4.2 创建爬虫

先进入项目目录：

```bash
cd mySpider_2
```

创建普通 Spider：

```bash
scrapy genspider 爬虫名称 允许抓取的域名
```

示例：

```bash
scrapy genspider youxi 4399.com
```

创建后新增文件：

```text
mySpider_2/spiders/youxi.py
```

### 4.3 启动爬虫

```bash
scrapy crawl 爬虫名称
```

示例：

```bash
scrapy crawl youxi
```

---

## 5. Spider 基础写法

一个基础 Spider 示例：

```python
import scrapy

class YouxiSpider(scrapy.Spider):
    name = "youxi"
    allowed_domains = ["4399.com"]
    start_urls = ["http://www.4399.com/flash/"]

    def parse(self, response, **kwargs):
        li_list = response.xpath("//ul[@class='n-game cf']/li")

        for li in li_list:
            name = li.xpath("./a/b/text()").extract_first()
            category = li.xpath("./em/a/text()").extract_first()
            date = li.xpath("./em/text()").extract_first()

            yield {
                "name": name,
                "category": category,
                "date": date
            }
```

### 5.1 Spider 常用属性

```python
name = "youxi"
```

爬虫名称，启动时使用：

```bash
scrapy crawl youxi
```

```python
allowed_domains = ["4399.com"]
```

允许抓取的域名范围。

```python
start_urls = ["http://www.4399.com/flash/"]
```

起始 URL 列表。

### 5.2 response 常用方法

```python
response.text       # 页面源代码，字符串
response.body       # 响应字节
response.url        # 当前响应对应的 URL
response.xpath()    # XPath 提取
response.css()      # CSS 选择器提取
response.json()     # JSON 响应转 Python 对象
```

### 5.3 extract 与 extract_first

```python
response.xpath("//title/text()").extract()
```

返回列表。

```python
response.xpath("//title/text()").extract_first()
```

返回第一个结果，取不到时返回 `None`。

### 5.4 parse 返回值约束

Spider 中 `yield` 或 `return` 的内容仅限于：

```text
dict
Item
Request
None
```

常见用法：

```python
yield item
yield {"name": name}
yield scrapy.Request(url=url, callback=self.parse_detail)
```

返回其他类型（如普通字符串、数字）将直接导致报错。

---

## 6. Item 自定义数据结构

直接 `yield dict` 虽然便捷，但字段完全依赖手写，数据量大时容易出现 key 拼写错误。

Scrapy 提供 `Item` 用于提前声明数据结构。

### 6.1 定义 Item

在 `items.py` 中：

```python
import scrapy

class GameItem(scrapy.Item):
    name = scrapy.Field()
    category = scrapy.Field()
    date = scrapy.Field()
```

### 6.2 在 Spider 中使用 Item

```python
from mySpider_2.items import GameItem

item = GameItem()
item["name"] = name
item["category"] = category
item["date"] = date

yield item
```

Item 的价值：

- 字段定义清晰。
- 管道中处理逻辑统一。
- 适合多人协作。
- 适合大型项目。

---

## 7. Pipeline 管道

Pipeline 负责接收 Spider 提交的数据，并进行保存或处理。

基础写法：

```python
class Myspider2Pipeline:
    def process_item(self, item, spider):
        print(item)
        return item
```

约束说明：

- `process_item()` 方法名固定，不可修改。
- 处理完成后必须 `return item`，数据才能继续传递给后续管道。

### 7.1 启用 Pipeline

在 `settings.py` 中：

```python
ITEM_PIPELINES = {
    "mySpider_2.pipelines.Myspider2Pipeline": 300,
}
```

末尾数字为优先级。

规则：

```text
数值越小，越先执行
```

多个管道可同时启用，按优先级串联：

```python
ITEM_PIPELINES = {
    "project.pipelines.FilePipeline": 300,
    "project.pipelines.MySQLPipeline": 301,
    "project.pipelines.MongoPipeline": 302,
}
```

### 7.2 Pipeline 生命周期

Pipeline 常用三个钩子方法：

```python
open_spider(self, spider)
process_item(self, item, spider)
close_spider(self, spider)
```

含义：

```text
open_spider   爬虫启动时执行一次
process_item  每处理一条数据执行一次
close_spider  爬虫结束时执行一次
```

标准用法：

- `open_spider()` 中打开文件、建立数据库连接。
- `process_item()` 中写入数据。
- `close_spider()` 中关闭文件、释放连接。

---

## 8. 文件、MySQL、MongoDB 与图片保存

## 8.1 保存到文本或 CSV

不应为每条数据单独 `open()` 一次文件：

```python
class FilePipeline:
    def process_item(self, item, spider):
        with open("data.txt", "a", encoding="utf-8") as f:
            f.write(str(item) + "\n")
        return item
```

推荐借助生命周期钩子复用文件句柄：

```python
class FilePipeline:
    def open_spider(self, spider):
        self.f = open("data.txt", "a", encoding="utf-8")

    def process_item(self, item, spider):
        self.f.write(f"{item['name']},{item['category']},{item['date']}\n")
        return item

    def close_spider(self, spider):
        self.f.close()
```

## 8.2 保存到 MySQL

先在 `settings.py` 中集中配置数据库参数：

```python
MYSQL_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "test123456",
    "database": "spider",
}
```

Pipeline 实现：

```python
import pymysql
from project.settings import MYSQL_CONFIG as mysql

class MySQLPipeline:
    def open_spider(self, spider):
        self.conn = pymysql.connect(
            host=mysql["host"],
            port=mysql["port"],
            user=mysql["user"],
            password=mysql["password"],
            database=mysql["database"],
            charset="utf8mb4"
        )

    def process_item(self, item, spider):
        try:
            cursor = self.conn.cursor()
            sql = "insert into game(name, category, date) values(%s, %s, %s)"
            cursor.execute(sql, (item["name"], item["category"], item["date"]))
            self.conn.commit()
            spider.logger.info(f"保存数据成功: {item}")
        except Exception as e:
            self.conn.rollback()
            spider.logger.error(f"保存数据库失败: {e}, 数据: {item}")
        return item

    def close_spider(self, spider):
        self.conn.close()
```

关键点：

- 连接在 `open_spider()` 中建立。
- 写入在 `process_item()` 中完成。
- 成功后 `commit()`。
- 失败后 `rollback()`。
- 连接在 `close_spider()` 中释放。

## 8.3 保存到 MongoDB

配置：

```python
MONGO_CONFIG = {
    "host": "localhost",
    "port": 27017,
    "db": "python"
}
```

Pipeline 实现：

```python
import pymongo
from project.settings import MONGO_CONFIG as mongo

class MongoPipeline:
    def open_spider(self, spider):
        self.client = pymongo.MongoClient(
            host=mongo["host"],
            port=mongo["port"]
        )
        db = self.client[mongo["db"]]
        self.collection = db["game"]

    def process_item(self, item, spider):
        self.collection.insert_one(dict(item))
        return item

    def close_spider(self, spider):
        self.client.close()
```

## 8.4 使用 ImagesPipeline 下载图片

安装图片处理依赖：

```bash
pip install pillow
```

Spider 中提取图片地址：

```python
import scrapy

class ZolSpider(scrapy.Spider):
    name = "zol"
    allowed_domains = ["zol.com.cn"]
    start_urls = ["https://desk.zol.com.cn/dongman/"]

    def parse(self, resp, **kwargs):
        a_list = resp.xpath("//*[@class='pic-list2  clearfix']/li/a")
        for a in a_list:
            href = a.xpath("./@href").extract_first()
            if href.endswith(".exe"):
                continue

            href = resp.urljoin(href)

            yield scrapy.Request(
                url=href,
                callback=self.parse_detail
            )

    def parse_detail(self, resp, **kwargs):
        img_src = resp.xpath("//*[@id='bigImg']/@src").extract_first()
        yield {"img_src": img_src}
```

Pipeline 实现：

```python
import scrapy
from scrapy.pipelines.images import ImagesPipeline

class MyImagePipeline(ImagesPipeline):
    def get_media_requests(self, item, info):
        url = item["img_src"]
        yield scrapy.Request(url=url, meta={"img_url": url})

    def file_path(self, request, response=None, info=None, *, item=None):
        folder = "dongman/imgs"
        filename = request.meta["img_url"].split("/")[-1]
        return folder + "/" + filename

    def item_completed(self, results, item, info):
        return item
```

`settings.py`：

```python
ITEM_PIPELINES = {
    "tu.pipelines.MyImagePipeline": 300,
}

IMAGES_STORE = "./images"
MEDIA_ALLOW_REDIRECTS = True
```

说明：

- `get_media_requests()` 负责发起下载请求。
- `file_path()` 决定图片保存路径。
- `item_completed()` 在下载完成后执行。
- `IMAGES_STORE` 为图片保存根目录。

---

## 9. Request 对象与多级页面请求

Spider 中若需请求详情页、下一页或接口，应 `yield scrapy.Request()`。

常见参数：

```python
scrapy.Request(
    url=url,
    method="GET",
    callback=self.parse_detail,
    errback=self.error_back,
    headers=headers,
    cookies=cookies,
    meta={"key": "value"},
    dont_filter=False
)
```

参数说明：

```text
url          请求地址
method       请求方式
callback     请求成功后的回调函数
errback      请求失败后的回调函数
headers      请求头
cookies      Cookie 字典
meta         请求之间传递数据
dont_filter  是否跳过框架去重，默认 False
```

### 9.1 URL 拼接

Python 通用方式：

```python
from urllib.parse import urljoin

new_url = urljoin(response.url, href)
```

Scrapy 内置方式：

```python
new_url = response.urljoin(href)
```

---

## 10. Cookie 与模拟登录

requests 体系中可通过 `session` 保持 Cookie，Scrapy 同样能自动管理 Cookie，但多数场景仍需开发者介入登录流程。

常见方案有三种：

1. 直接复用浏览器中的 Cookie。
2. 使用 Scrapy 完成完整登录流程。
3. 在 `settings.py` 中配置默认 Cookie。

## 10.1 重写 start_requests

Scrapy 默认根据 `start_urls` 自动创建起始请求。

若在请求起始页之前必须先登录或先获取验证码，则需要重写：

```python
def start_requests(self):
    yield scrapy.Request(
        url=self.start_urls[0],
        callback=self.parse
    )
```

## 10.2 方案一：复用浏览器 Cookie

```python
import scrapy

class DengSpider(scrapy.Spider):
    name = "deng"
    allowed_domains = ["woaidu.cc"]
    start_urls = ["http://www.woaidu.cc/bookcase.php"]

    def start_requests(self):
        cookies = "username=User; token=xxx"
        cookie_dict = {}

        for item in cookies.split("; "):
            k, v = item.split("=", 1)
            cookie_dict[k] = v

        yield scrapy.Request(
            url=self.start_urls[0],
            cookies=cookie_dict,
            callback=self.parse
        )

    def parse(self, resp, **kwargs):
        print(resp.text)
```

注意：

```text
Scrapy 中 Cookie 通过 cookies 参数传递，推荐传字典。
```

## 10.3 方案二：完整登录流程

若登录依赖验证码、用户名与密码，可先请求验证码，再提交登录表单。

```python
import scrapy
from urllib.parse import urlencode

class LoginSpider(scrapy.Spider):
    name = "login"
    allowed_domains = ["woaidu.cc"]
    start_urls = ["http://www.woaidu.cc/bookcase.php"]

    def start_requests(self):
        code_url = "http://www.woaidu.cc/code.php"
        yield scrapy.Request(
            url=code_url,
            dont_filter=True,
            callback=self.parse_code
        )

    def parse_code(self, resp):
        code = "识别出来的验证码"

        data = {
            "LoginForm[username]": "用户名",
            "LoginForm[password]": "密码",
            "LoginForm[captcha]": code,
            "action": "login",
            "submit": "登录"
        }

        yield scrapy.Request(
            url="http://www.woaidu.cc/login.php",
            method="POST",
            body=urlencode(data, encoding="utf-8"),
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
            callback=self.parse_login
        )

    def parse_login(self, resp):
        yield scrapy.Request(
            url=self.start_urls[0],
            callback=self.parse
        )

    def parse(self, resp, **kwargs):
        print(resp.text)
```

更推荐使用 `FormRequest`：

```python
yield scrapy.FormRequest(
    url="http://www.woaidu.cc/login.php",
    formdata=data,
    callback=self.parse_login
)
```

两者区别：

- `scrapy.Request(..., body=...)` 的 `body` 需要字符串或字节，需自行编码。
- `scrapy.FormRequest(..., formdata=...)` 可直接传字典，更为简洁。

## 10.4 方案三：settings 中配置 Cookie

在 `settings.py` 中：

```python
COOKIES_ENABLED = False

DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en",
    "Cookie": "xxxxxx",
    "User-Agent": "Mozilla/5.0"
}
```

注意：

```text
将 Cookie 写入 DEFAULT_REQUEST_HEADERS 时，通常应将 COOKIES_ENABLED 设置为 False。
否则 Scrapy 的 CookieMiddleware 可能对 Cookie 进行额外处理或覆盖。
```

---

## 11. DownloaderMiddleware 下载器中间件

下载器中间件位于：

```text
Engine 与 Downloader 之间
```

其能力是在请求到达下载器之前、响应返回引擎之前插入处理逻辑。

流程：

```text
Engine
-> process_request
-> Downloader
-> process_response
-> Engine
```

### 11.1 基础写法

```python
class MyDownloaderMiddleware:
    def process_request(self, request, spider):
        return None

    def process_response(self, request, response, spider):
        return response

    def process_exception(self, request, exception, spider):
        pass
```

启用中间件：

```python
DOWNLOADER_MIDDLEWARES = {
    "project.middlewares.MyDownloaderMiddleware": 543,
}
```

优先级规则与 Pipeline 一致：数值越小越先执行。

### 11.2 process_request 返回值

`process_request(request, spider)` 在请求到达下载器之前调用。

返回值语义：

```text
return None
    不拦截，请求继续向后传递。

return request
    拦截当前请求，并将返回的新请求重新交给调度器。

return response
    直接返回响应，下载器不再发送该请求。
```

### 11.3 process_response 返回值

`process_response(request, response, spider)` 在响应离开下载器后调用。

返回值语义：

```text
return response
    响应继续向后传递。

return request
    响应被拦截，请求重新回到调度器。
```

### 11.4 随机 User-Agent

`settings.py`：

```python
USER_AGENT_LIST = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/70.0 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 Chrome/55.0 Safari/537.36",
]
```

中间件实现：

```python
from random import choice
from project.settings import USER_AGENT_LIST

class RandomUserAgentMiddleware:
    def process_request(self, request, spider):
        ua = choice(USER_AGENT_LIST)
        request.headers["User-Agent"] = ua
        return None
```

启用：

```python
DOWNLOADER_MIDDLEWARES = {
    "project.middlewares.RandomUserAgentMiddleware": 543,
}
```

### 11.5 设置代理

免费代理示例：

```python
from random import choice

PROXY_LIST = [
    "127.0.0.1:7890",
]

class ProxyMiddleware:
    def process_request(self, request, spider):
        proxy = choice(PROXY_LIST)
        request.meta["proxy"] = "http://" + proxy
        return None

    def process_response(self, request, response, spider):
        if response.status != 200:
            request.dont_filter = True
            return request
        return response

    def process_exception(self, request, exception, spider):
        request.dont_filter = True
        return request
```

收费代理通常需要认证：

```python
from w3lib.http import basic_auth_header

class MoneyProxyMiddleware:
    def process_request(self, request, spider):
        request.meta["proxy"] = "http://代理地址:端口"
        request.headers["Proxy-Authorization"] = basic_auth_header(
            username="用户名",
            password="密码"
        )
        request.headers["Connection"] = "close"
        return None

    def process_response(self, request, response, spider):
        if response.status != 200:
            request.dont_filter = True
            return request
        return response
```

失败重试的两个细节值得注意：`dont_filter = True` 用于跳过框架去重，避免重试请求被直接过滤；代理失效时应结合响应状态与异常钩子共同处理。

---

## 12. SpiderMiddleware 爬虫中间件

爬虫中间件位于：

```text
Engine 与 Spider 之间
```

常用方法：

```python
def process_spider_input(self, response, spider):
    return None

def process_spider_output(self, response, result, spider):
    for i in result:
        yield i

def process_spider_exception(self, response, exception, spider):
    pass

def process_start_requests(self, start_requests, spider):
    for r in start_requests:
        yield r
```

用途：

- 处理进入 Spider 前的响应。
- 处理 Spider 输出的 item 或 request。
- 捕获 Spider 中的异常。
- 处理起始请求。

实践建议：SpiderMiddleware 掌握概念即可，实际项目中 DownloaderMiddleware 的使用频率显著更高。

---

## 13. 全站数据抓取

全站抓取的核心逻辑是：

```text
从列表页提取详情页链接
-> 请求详情页
-> 解析详情页数据
-> 提取下一页链接
-> 继续请求下一页
```

Scrapy 中可用普通 Spider 实现，也可使用 CrawlSpider。

## 13.1 普通 Spider 全站抓取

示例：抓取二手车列表与详情页。

```python
import scrapy
from scrapy.linkextractors import LinkExtractor

class ErshouSpider(scrapy.Spider):
    name = "ershou"
    allowed_domains = ["che168.com"]
    start_urls = ["https://www.che168.com/china/a0_0msdgscncgpi1ltocsp1exx0/"]

    def parse(self, resp, **kwargs):
        le = LinkExtractor(
            restrict_xpaths=("//ul[@class='viewlist_ul']/li/a",),
            deny_domains=("topicm.che168.com",)
        )
        links = le.extract_links(resp)

        for link in links:
            yield scrapy.Request(
                url=link.url,
                callback=self.parse_detail
            )

        page_le = LinkExtractor(
            restrict_xpaths=("//div[@id='listpagination']/a",)
        )
        pages = page_le.extract_links(resp)

        for page in pages:
            yield scrapy.Request(
                url=page.url,
                callback=self.parse
            )

    def parse_detail(self, resp, **kwargs):
        title = resp.xpath("/html/body/div[5]/div[2]/h3/text()").extract_first()
        print(title)
```

### 13.2 控制访问频率

全站抓取容易触发验证或封禁，必须控制请求频率。

`settings.py`：

```python
DOWNLOAD_DELAY = 3
```

## 13.3 LinkExtractor

`LinkExtractor` 是链接提取器，可从响应页面中批量提取 URL。

常用参数：

```text
allow             正则，提取符合规则的链接
deny              正则，排除符合规则的链接
allow_domains     只提取指定域名
deny_domains      排除指定域名
restrict_xpaths   只从指定 XPath 范围提取
restrict_css      只从指定 CSS 选择器范围提取
tags              从哪些标签提取，默认 a、area
attrs             从哪些属性提取，默认 href
```

示例：

```python
le = LinkExtractor(
    restrict_xpaths=("//ul[@class='viewlist_ul']/li/a",),
    deny_domains=("topicm.che168.com",)
)

links = le.extract_links(response)
```

说明：提取到重复 URL 时，Scrapy 框架会默认自动去重。

---

## 14. CrawlSpider 与 Rule

`CrawlSpider` 是 Scrapy 内置的全站抓取 Spider，更适合按规则自动提取链接。

### 14.1 创建 CrawlSpider

```bash
scrapy genspider -t crawl ershouche che168.com
```

`-t crawl` 表示使用 crawl 模板。

### 14.2 CrawlSpider 示例

```python
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule

class ErshoucheSpider(CrawlSpider):
    name = "ershouche"
    allowed_domains = ["che168.com", "autohome.com.cn"]
    start_urls = ["https://www.che168.com/beijing/a0_0msdgscncgpi1ltocsp1exx0/"]

    detail_le = LinkExtractor(
        restrict_xpaths=("//ul[@class='viewlist_ul']/li/a",),
        deny_domains=("topicm.che168.com",)
    )

    page_le = LinkExtractor(
        restrict_xpaths=("//div[@id='listpagination']/a",)
    )

    rules = (
        Rule(page_le, follow=True),
        Rule(detail_le, callback="parse_item", follow=False),
    )

    def parse_item(self, response):
        print(response.url)
```

### 14.3 Rule 参数理解

```python
Rule(link_extractor, callback=None, follow=None)
```

常见参数：

```text
link_extractor  链接提取规则
callback        请求成功后的解析函数
follow          是否继续在该响应中按 rules 提取链接
```

示例：

```python
Rule(page_le, follow=True)
```

表示：提取分页链接，并继续在分页页面中按规则提取。

```python
Rule(detail_le, callback="parse_item", follow=False)
```

表示：提取详情页链接，进入详情页后执行 `parse_item`，但不再从详情页扩散。

---

## 15. 增量式爬虫

增量式爬虫的定义：

```text
爬虫可反复运行
每次只保存新数据
旧数据自动过滤
```

其核心只有一个词：

```text
去重
```

去重的两个方向：

1. URL 去重。
2. 数据内容去重。

### 15.1 URL 去重

可使用 Redis 集合记录已抓取的 URL。

```python
import scrapy
import redis
import re
import json

class WangyiSpider(scrapy.Spider):
    name = "wangyi"
    allowed_domains = ["163.com"]
    start_urls = ["https://news.163.com/special/cm_guonei/?callback=data_callback"]

    re_obj = re.compile(r"data_callback\((?P<code>.*)\)", re.S)
    conn = redis.Redis(
        host="127.0.0.1",
        port=6379,
        db=3,
        password="123456",
        decode_responses=True
    )

    def parse(self, resp, **kwargs):
        code = self.re_obj.search(resp.text).group("code")
        news_list = json.loads(code)

        for news in news_list:
            tlink = news.get("tlink")

            if self.conn.sismember("wangyi:news:urls", tlink):
                print("URL 已抓取过，跳过:", tlink)
            else:
                yield scrapy.Request(
                    url=tlink,
                    callback=self.parse_detail
                )

    def parse_detail(self, resp):
        title = resp.xpath("//h1[@class='post_title']//text()").extract()
        body = resp.xpath("//div[@class='post_body']//text()").extract()

        self.conn.sadd("wangyi:news:urls", resp.url)

        yield {
            "url": resp.url,
            "title": title,
            "body": body
        }
```

### 15.2 数据内容去重

在 Pipeline 中依据 item 内容去重：

```python
import json
from redis import Redis

class NewsPipeline:
    def open_spider(self, spider):
        self.red = Redis(password="123456", db=3)

    def process_item(self, item, spider):
        data = json.dumps(dict(item), ensure_ascii=False)
        result = self.red.sadd("wangyi:news:items", data)

        if result:
            print("存入数据库", item.get("title"))
        else:
            print("数据已存在", item.get("title"))

        return item

    def close_spider(self, spider):
        self.red.close()
```

数据量较大时，可先计算内容 MD5，仅将 MD5 存入 Redis 集合，以降低存储压力。

---

## 16. 分布式爬虫与 scrapy-redis

分布式爬虫的定义：

```text
多台机器或多个爬虫节点
共同抓取同一批资源
共享请求队列
共享去重逻辑
```

普通 Scrapy 的调度器与去重集合位于本机内存，多机器之间无法共享。因此分布式改造的关键是把以下两项移到公共服务中：

- 请求队列
- 去重集合

公共服务通常由 Redis 承担。

`scrapy-redis` 的工作本质：

```text
重写 Scrapy 调度器
将请求队列放入 Redis
将去重逻辑放入 Redis
使多个爬虫节点共享调度与去重
```

## 16.1 scrapy-redis 工作流程

1. 爬虫从 `redis_key` 获取起始 URL。
2. 起始 URL 进入 Redis 请求队列。
3. 调度器从 Redis 请求队列中取出请求。
4. 下载器发送请求，Spider 解析响应。
5. Spider 产生的新请求先经 Redis 去重集合判断。
6. 未抓过的请求放入 Redis 请求队列。
7. 多个节点共同消费 Redis 请求队列。

## 16.2 安装

```bash
pip install scrapy-redis==0.9.1
```

## 16.3 修改 Spider

普通 Spider：

```python
import scrapy

class ShuSpider(scrapy.Spider):
    name = "shu"
    start_urls = ["https://example.com"]
```

分布式 Spider：

```python
from scrapy_redis.spiders import RedisSpider

class ShuSpider(RedisSpider):
    name = "shu"
    allowed_domains = ["example.com"]

    redis_key = "shu:start_urls"

    def parse(self, response):
        pass
```

三处变化：

- 继承 `RedisSpider`。
- 注释或删除 `start_urls`。
- 添加 `redis_key`。

启动后，爬虫会等待 Redis 中被推入起始 URL。

向 Redis 推入起始 URL：

```bash
lpush shu:start_urls https://example.com
```

## 16.4 settings 配置

```python
REDIS_HOST = "127.0.0.1"
REDIS_PORT = 6379
REDIS_DB = 8
REDIS_PARAMS = {
    "password": "123456"
}

SCHEDULER = "scrapy_redis.scheduler.Scheduler"
SCHEDULER_PERSIST = True
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"

ITEM_PIPELINES = {
    "shu.pipelines.ShuPipeline": 300,
    "scrapy_redis.pipelines.RedisPipeline": 301,
}
```

配置说明：

```text
REDIS_HOST / REDIS_PORT / REDIS_DB / REDIS_PARAMS
    Redis 连接信息。

SCHEDULER
    使用 scrapy-redis 的调度器。

SCHEDULER_PERSIST
    True 表示爬虫关闭时保留请求队列与去重记录。
    False 表示关闭时清理。

DUPEFILTER_CLASS
    使用 scrapy-redis 的去重类。

RedisPipeline
    scrapy-redis 提供的数据存储管道，将 item 存入 Redis。
```

---

## 17. 布隆过滤器

当请求量极大时，以 Redis set 存储全部请求指纹会带来显著的内存压力。

布隆过滤器的价值在于以更省空间的方式回答：

```text
某个数据是否可能存在
```

基本原理：

1. 准备一个很长的 bit 数组。
2. 对数据执行多个 hash 算法。
3. 根据 hash 结果将数组对应位置标记为 1。
4. 查询时再次执行 hash。
5. 若所有位置均为 1，判定为可能存在。
6. 若任一位置为 0，判定为一定不存在。

特性：

- 空间占用小。
- 查询速度快。
- 存在"误判为有"的可能。
- 不会"误判为无"。

安装：

```bash
pip install scrapy_redis_bloomfilter
```

配置：

```python
DUPEFILTER_CLASS = "scrapy_redis_bloomfilter.dupefilter.RFPDupeFilter"

BLOOMFILTER_HASH_NUMBER = 6
BLOOMFILTER_BIT = 30
```

说明：

```text
BLOOMFILTER_HASH_NUMBER
    hash 函数个数，默认 6。

BLOOMFILTER_BIT
    bit 数组规模参数，默认 30，约占 128MB 内存，可支撑亿级去重。
```

---

## 18. Scrapy 项目实战开发流程

标准开发流程：

1. 创建项目。

```bash
scrapy startproject project_name
```

2. 进入项目目录。

```bash
cd project_name
```

3. 创建爬虫。

```bash
scrapy genspider spider_name domain.com
```

4. 分析目标网站。

```text
数据位于 HTML 还是 Ajax 接口？
是否需要登录？
是否需要 Cookie？
是否有分页？
是否有详情页？
是否需要全站抓取？
```

5. 在 `items.py` 中定义数据结构。

```python
class DemoItem(scrapy.Item):
    title = scrapy.Field()
    url = scrapy.Field()
```

6. 在 Spider 中解析数据或继续发起请求。

```python
yield item
yield scrapy.Request(url=detail_url, callback=self.parse_detail)
```

7. 在 Pipeline 中保存数据。

```python
def process_item(self, item, spider):
    return item
```

8. 在 `settings.py` 中启用 Pipeline。

```python
ITEM_PIPELINES = {
    "project.pipelines.DemoPipeline": 300,
}
```

9. 按需配置中间件、延迟、UA、代理、Cookie。

10. 启动爬虫。

```bash
scrapy crawl spider_name
```

---

## 19. 常用配置速查

### 19.1 基础配置

```python
ROBOTSTXT_OBEY = False
LOG_LEVEL = "WARNING"
DOWNLOAD_DELAY = 3
USER_AGENT = "Mozilla/5.0"
```

### 19.2 Pipeline 配置

```python
ITEM_PIPELINES = {
    "project.pipelines.FilePipeline": 300,
    "project.pipelines.MySQLPipeline": 301,
}
```

### 19.3 中间件配置

```python
DOWNLOADER_MIDDLEWARES = {
    "project.middlewares.RandomUserAgentMiddleware": 543,
    "project.middlewares.ProxyMiddleware": 544,
}
```

### 19.4 Cookie 配置

```python
COOKIES_ENABLED = False

DEFAULT_REQUEST_HEADERS = {
    "Cookie": "xxx",
    "User-Agent": "Mozilla/5.0"
}
```

### 19.5 图片下载配置

```python
ITEM_PIPELINES = {
    "project.pipelines.MyImagePipeline": 300,
}

IMAGES_STORE = "./images"
MEDIA_ALLOW_REDIRECTS = True
```

### 19.6 scrapy-redis 配置

```python
REDIS_HOST = "127.0.0.1"
REDIS_PORT = 6379
REDIS_DB = 8
REDIS_PARAMS = {
    "password": "123456"
}

SCHEDULER = "scrapy_redis.scheduler.Scheduler"
SCHEDULER_PERSIST = True
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
```

---

## 20. 常用代码模板

## 20.1 普通 Spider 模板

```python
import scrapy

class DemoSpider(scrapy.Spider):
    name = "demo"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com"]

    def parse(self, response, **kwargs):
        title = response.xpath("//title/text()").extract_first()

        yield {
            "title": title,
            "url": response.url
        }
```

## 20.2 多级页面模板

```python
import scrapy

class DemoSpider(scrapy.Spider):
    name = "demo"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com/list"]

    def parse(self, response, **kwargs):
        hrefs = response.xpath("//a/@href").extract()

        for href in hrefs:
            url = response.urljoin(href)
            yield scrapy.Request(
                url=url,
                callback=self.parse_detail
            )

    def parse_detail(self, response, **kwargs):
        title = response.xpath("//h1/text()").extract_first()
        yield {
            "title": title,
            "url": response.url
        }
```

## 20.3 Item 模板

```python
import scrapy

class DemoItem(scrapy.Item):
    title = scrapy.Field()
    url = scrapy.Field()
```

使用：

```python
from project.items import DemoItem

item = DemoItem()
item["title"] = title
item["url"] = response.url
yield item
```

## 20.4 Pipeline 模板

```python
class DemoPipeline:
    def open_spider(self, spider):
        self.f = open("data.txt", "a", encoding="utf-8")

    def process_item(self, item, spider):
        self.f.write(str(dict(item)) + "\n")
        return item

    def close_spider(self, spider):
        self.f.close()
```

## 20.5 登录 FormRequest 模板

```python
import scrapy

class LoginSpider(scrapy.Spider):
    name = "login"
    allowed_domains = ["example.com"]

    def start_requests(self):
        yield scrapy.FormRequest(
            url="https://example.com/login",
            formdata={
                "username": "用户名",
                "password": "密码"
            },
            callback=self.after_login
        )

    def after_login(self, response):
        yield scrapy.Request(
            url="https://example.com/user",
            callback=self.parse_user
        )

    def parse_user(self, response):
        print(response.text)
```

## 20.6 DownloaderMiddleware 模板

```python
class DemoDownloaderMiddleware:
    def process_request(self, request, spider):
        request.headers["User-Agent"] = "Mozilla/5.0"
        return None

    def process_response(self, request, response, spider):
        if response.status != 200:
            request.dont_filter = True
            return request
        return response

    def process_exception(self, request, exception, spider):
        request.dont_filter = True
        return request
```

## 20.7 CrawlSpider 模板

```python
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule

class DemoCrawlSpider(CrawlSpider):
    name = "demo_crawl"
    allowed_domains = ["example.com"]
    start_urls = ["https://example.com/list"]

    page_le = LinkExtractor(restrict_xpaths=("//div[@class='page']/a",))
    detail_le = LinkExtractor(restrict_xpaths=("//ul[@class='list']/li/a",))

    rules = (
        Rule(page_le, follow=True),
        Rule(detail_le, callback="parse_item", follow=False),
    )

    def parse_item(self, response):
        title = response.xpath("//h1/text()").extract_first()
        yield {
            "title": title,
            "url": response.url
        }
```

## 20.8 RedisSpider 模板

```python
from scrapy_redis.spiders import RedisSpider

class DemoRedisSpider(RedisSpider):
    name = "demo_redis"
    allowed_domains = ["example.com"]
    redis_key = "demo:start_urls"

    def parse(self, response):
        title = response.xpath("//title/text()").extract_first()
        yield {
            "title": title,
            "url": response.url
        }
```

推入起始 URL：

```bash
lpush demo:start_urls https://example.com
```

---

## 总结

本文的完整脉络：

```text
Scrapy 工程化思想
-> Scrapy 工作流程
-> 项目创建与 Spider 编写
-> Item 规范数据结构
-> Pipeline 保存数据
-> Request 实现多级抓取
-> Cookie 与模拟登录
-> DownloaderMiddleware 处理 UA 与代理
-> LinkExtractor / CrawlSpider 抓取全站
-> Redis 实现增量与分布式
```

实际开发 Scrapy 项目时，可按以下顺序推进：

1. 先判断数据来源与请求逻辑。
2. 再创建项目与 Spider。
3. 用 `response.xpath()`、`response.css()` 或 `response.json()` 提取数据。
4. 数据字段较多时定义 Item。
5. 需要持久化时编写 Pipeline。
6. 需要登录时重写 `start_requests()` 或使用 `FormRequest`。
7. 需要统一处理请求时编写 DownloaderMiddleware。
8. 需要全站抓取时优先考虑 `LinkExtractor` 与 `CrawlSpider`。
9. 需要增量或分布式时引入 Redis 与 scrapy-redis。

Scrapy 的关键不在于记住全部 API，而在于理解数据在框架中的流向：`Request` 从 Spider 出发，经 Scheduler 与 Downloader 变为 `Response`，再回到 Spider，最终以 `Item` 形态交给 Pipeline。

以上是本篇的全部内容，工程化组件职责与分布式改造三处变化是理解重点。觉得有帮助，欢迎点赞、收藏、转发；Scrapy 相关的问题也欢迎评论区交流。我是小马不起床，我们下期见。
