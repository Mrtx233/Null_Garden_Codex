# Python 爬虫进阶理论知识体系总结

本文围绕 Python 爬虫进阶中的 7 个核心方向进行系统整理：

```text
1. requests
2. Session
3. Selenium
4. Playwright
5. requests / Selenium / Playwright 对比
6. Scrapy
7. 线程 / 进程 / 协程 / 异步
```

---

## 目录

1. requests
2. Session
3. Selenium
4. Playwright
5. requests、Selenium、Playwright 对比
6. Scrapy
7. 线程 / 进程 / 协程 / 异步
8. 总体选择路线
9. 最核心总结

---

# 1. requests

## 1.1 requests 的概念

`requests` 是 Python 中常用的 HTTP 请求库，用来向服务器发送 HTTP 请求，并接收服务器返回的响应。

它主要用于：

```text
1. 请求网页 HTML
2. 请求接口 API
3. 提交表单数据
4. 下载图片、文件、视频等资源
5. 携带 headers、cookies、params、data、json 等请求参数
```

`requests` 本质上是模拟客户端向服务器发 HTTP 请求。

但是需要注意：

```text
requests 不会执行 JavaScript
```

所以如果网页内容是通过 JS 动态渲染出来的，单独使用 `requests` 可能拿不到最终页面数据。

---

## 1.2 GET 和 POST 的区别

| 对比点 | GET | POST |
| --- | --- | --- |
| 主要用途 | 获取数据 | 提交数据 |
| 参数位置 | 通常放在 URL 查询字符串中 | 通常放在请求体 body 中 |
| 是否适合传大量数据 | 不适合 | 更适合 |
| 是否常用于搜索、列表页 | 常用 | 较少 |
| 是否常用于登录、提交表单 | 较少 | 常用 |
| 是否更容易被缓存 | 相对更容易 | 一般不缓存 |
| 爬虫常见场景 | 翻页、搜索、详情页请求 | 登录、接口提交、表单提交 |

---

### 1.2.1 GET

GET 请求通常用于获取资源。

常见场景：

```text
1. 打开新闻列表页
2. 打开商品详情页
3. 请求搜索结果
4. 翻页请求
5. 请求公开 API
```

GET 请求的参数通常放在 URL 后面，例如：

```text
https://example.com/search?keyword=python&page=1
```

在 `requests` 中，GET 查询参数通常通过 `params` 传递。

示例：

```python
import requests

url = "https://example.com/search"

params = {
    "keyword": "python",
    "page": 1
}

resp = requests.get(url, params=params)

print(resp.url)
print(resp.text)
```

---

### 1.2.2 POST

POST 请求通常用于提交数据。

常见场景：

```text
1. 登录
2. 注册
3. 提交评论
4. 提交搜索条件
5. 调用需要请求体的接口
6. 上传文件
```

POST 数据常见格式：

```text
1. 表单数据：data
2. JSON 数据：json
3. 文件上传：files
```

---

## 1.3 requests 常用参数详解

---

### 1.3.1 url

`url` 是请求地址。

爬虫中 URL 通常分为：

```text
1. 列表页 URL
2. 详情页 URL
3. 图片 URL
4. 接口 URL
5. 登录接口 URL
6. 分页接口 URL
```

示例：

```python
url = "https://example.com/api/list"
```

---

### 1.3.2 params

`params` 用于 GET 请求，把参数拼接到 URL 查询字符串中。

适合：

```text
1. 搜索关键词
2. 页码
3. 排序条件
4. 分类 ID
5. 时间范围
```

特点：

```text
1. 参数会出现在 URL 中
2. requests 会自动进行 URL 编码
3. 值为 None 的参数不会被加入 URL 查询字符串
```

示例：

```python
import requests

url = "https://example.com/search"

params = {
    "keyword": "python 爬虫",
    "page": 1
}

resp = requests.get(url, params=params)

print(resp.url)
```

---

### 1.3.3 data

`data` 用于提交表单数据，通常用于 POST 请求。

适合：

```text
1. 登录表单
2. 搜索表单
3. 评论表单
4. 普通 application/x-www-form-urlencoded 请求
```

特点：

```text
1. 数据放在请求体中
2. 通常用于表单提交
3. 服务端通过表单字段接收
```

示例：

```python
import requests

url = "https://example.com/login"

data = {
    "username": "alex",
    "password": "123456"
}

resp = requests.post(url, data=data)

print(resp.text)
```

---

### 1.3.4 json

`json` 用于提交 JSON 格式数据。

适合：

```text
1. JSON API
2. 前后端分离接口
3. 移动端接口
4. Ajax 接口
```

`data` 和 `json` 的区别：

```text
data：提交表单格式数据
json：提交 JSON 格式数据
```

当接口请求头中要求：

```text
Content-Type: application/json
```

通常使用 `json` 参数更合适。

示例：

```python
import requests

url = "https://example.com/api/login"

data = {
    "userName": "alex",
    "password": "123456"
}

resp = requests.post(url, json=data)

print(resp.text)
```

---

### 1.3.5 headers

`headers` 是请求头，用来告诉服务器客户端的信息。

常见 headers：

```text
User-Agent：客户端类型，例如浏览器信息
Referer：请求来源页面
Accept：客户端可以接收的数据类型
Accept-Language：语言偏好
Content-Type：请求体数据类型
Authorization：认证信息
Cookie：携带 cookie 信息
```

爬虫中常见用途：

```text
1. 模拟浏览器请求
2. 指定请求数据类型
3. 携带认证 token
4. 指定来源页面
5. 降低被直接拒绝的概率
```

示例：

```python
headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://example.com/"
}
```

---

### 1.3.6 cookies

`cookies` 用于携带用户状态信息。

常见作用：

```text
1. 保存登录状态
2. 保存用户身份
3. 保存访问偏好
4. 保存服务端下发的会话标识
```

爬虫中常见场景：

```text
1. 登录后访问个人中心
2. 访问需要权限的页面
3. 保持同一个用户状态
4. 访问需要 Cookie 验证的接口
```

示例：

```python
cookies = {
    "sessionid": "xxxxxx"
}

resp = requests.get(url, cookies=cookies)
```

---

### 1.3.7 timeout

`timeout` 用于设置请求超时时间。

作用：

```text
1. 防止请求长时间卡住
2. 提高爬虫稳定性
3. 方便异常处理和重试
```

生产代码中通常建议设置 `timeout`。

示例：

```python
resp = requests.get(url, timeout=10)
```

也可以分别设置连接超时和读取超时：

```python
resp = requests.get(url, timeout=(3, 10))
```

---

### 1.3.8 proxies

`proxies` 用于设置代理。

常见用途：

```text
1. 通过代理服务器发送请求
2. 控制请求出口 IP
3. 访问需要特定网络环境的资源
```

示例：

```python
proxies = {
    "http": "http://127.0.0.1:7897",
    "https": "http://127.0.0.1:7897"
}

resp = requests.get(url, proxies=proxies)
```

---

### 1.3.9 verify

`verify` 用于控制 HTTPS 证书校验。

常见取值：

```text
verify=True：默认，验证 SSL 证书
verify=False：不验证 SSL 证书
```

注意：

```text
verify=False 可能带来安全风险
```

示例：

```python
resp = requests.get(url, verify=False)
```

---

### 1.3.10 allow_redirects

`allow_redirects` 用于控制是否允许重定向。

常见场景：

```text
1. 登录后跳转
2. HTTP 跳转 HTTPS
3. 短链接跳转
4. 页面 301 / 302 跳转
```

示例：

```python
resp = requests.get(url, allow_redirects=False)

print(resp.status_code)
print(resp.headers.get("Location"))
```

---

### 1.3.11 stream

`stream=True` 表示流式下载。

适合：

```text
1. 下载大文件
2. 下载图片
3. 下载视频
4. 分块读取响应内容
```

特点：

```text
1. 不会一次性把响应体全部加载到内存
2. 可以边下载边写入文件
3. 适合大文件场景
```

示例：

```python
import requests

url = "https://example.com/file.zip"

resp = requests.get(url, stream=True)

with open("file.zip", "wb") as f:
    for chunk in resp.iter_content(chunk_size=8192):
        if chunk:
            f.write(chunk)
```

---

## 1.4 Response 响应对象

`requests` 请求后会返回 `Response` 对象。

常用属性和方法：

```text
response.status_code：状态码
response.text：字符串形式响应内容
response.content：二进制响应内容
response.json()：把 JSON 响应转成 Python 对象
response.headers：响应头
response.cookies：响应 cookie
response.url：最终请求 URL
response.history：重定向历史
response.encoding：响应编码
response.raise_for_status()：状态码异常检查
```

注意点：

```text
1. response.text 适合 HTML、文本
2. response.content 适合图片、文件、二进制内容
3. response.json() 适合 JSON 接口
4. response.status_code 只代表 HTTP 状态，不代表业务一定成功
```

示例：

```python
import requests

resp = requests.get("https://example.com")

print(resp.status_code)
print(resp.headers)
print(resp.text)

resp.raise_for_status()
```

---

# 2. Session

## 2.1 Session 的概念

`Session` 是 `requests` 中用于保持会话状态的对象。

它的核心作用：

```text
1. 复用 TCP 连接
2. 自动保存和携带 cookies
3. 统一设置 headers
4. 统一设置认证信息
5. 统一设置代理等配置
6. 让多次请求看起来来自同一个客户端会话
```

---

## 2.2 Session 和普通 requests 请求的区别

| 对比点 | 普通 requests.get/post | requests.Session |
| --- | --- | --- |
| Cookie 保存 | 不自动跨请求长期保存 | 自动在 Session 内保持 |
| 连接复用 | 较弱 | 支持连接池复用 |
| 登录状态保持 | 手动传 cookie | 自动维护 cookie |
| 公共 headers | 每次请求都要传 | 可以统一设置 |
| 适合场景 | 单次请求 | 多次连续请求、登录后请求 |

---

## 2.3 会话保持

会话保持指客户端和服务器之间在多次请求中保持同一用户状态。

常见流程：

```text
1. 第一次请求登录接口
2. 服务器返回 Set-Cookie
3. Session 自动保存 cookie
4. 后续请求自动携带 cookie
5. 服务器识别为同一个用户
```

会话保持常用于：

```text
1. 登录后访问个人中心
2. 翻页抓取需要登录的数据
3. 连续访问同一网站多个页面
4. 保持购物车、用户偏好、身份状态
```

---

## 2.4 Cookie 更新机制

Cookie 的更新通常来自服务器响应头中的：

```text
Set-Cookie
```

Session 内部会根据响应自动更新自己的 cookie jar。

常见情况：

```text
1. 登录成功后服务端下发新 cookie
2. 访问某页面后服务端刷新 sessionid
3. token 过期后服务端重新设置 cookie
4. 风控系统下发新的追踪 cookie
```

注意：

```text
1. Session 自动维护的是 cookie
2. 不一定自动维护 token
3. 如果 token 在 HTML 或 JSON 中，需要自己解析并更新
4. 如果 cookie 失效，需要重新登录或重新获取
```

---

## 2.5 Session 中常见配置

常见配置包括：

```python
session.headers.update(...)
session.cookies
session.auth
session.proxies
session.verify
session.params
```

适合统一配置：

```text
1. User-Agent
2. Authorization
3. Cookie
4. 代理
5. SSL 验证
6. 公共查询参数
```

示例：

```python
import requests

session = requests.Session()

session.headers.update({
    "User-Agent": "Mozilla/5.0"
})

session.proxies.update({
    "http": "http://127.0.0.1:7897",
    "https": "http://127.0.0.1:7897"
})

resp = session.get("https://example.com")
print(resp.text)
```

---

## 2.6 Session 适合的爬虫场景

```text
1. 需要登录的网站
2. 多页连续抓取
3. 接口依赖 cookie 状态
4. 网站根据 sessionid 判断用户
5. 需要复用连接提高性能
6. 请求之间存在前后依赖关系
```

---

# 3. Selenium

## 3.1 Selenium 的概念

Selenium 是浏览器自动化工具，核心是通过 WebDriver 控制真实浏览器完成操作。

它可以模拟用户行为：

```text
1. 打开网页
2. 点击按钮
3. 输入文本
4. 提交表单
5. 滚动页面
6. 切换窗口
7. 处理 iframe
8. 获取动态渲染后的 DOM
```

---

## 3.2 Selenium 的核心组成

```text
1. WebDriver：浏览器驱动接口
2. Browser Driver：具体浏览器驱动，例如 ChromeDriver、GeckoDriver
3. Browser：真实浏览器，例如 Chrome、Firefox、Edge
4. WebElement：页面元素对象
5. Locator：元素定位方式
6. Wait：等待机制
7. ActionChains：复杂用户动作
```

---

## 3.3 Selenium 的元素定位方式

常见定位方式：

```text
1. id
2. name
3. class name
4. tag name
5. link text
6. partial link text
7. css selector
8. xpath
```

示例：

```python
from selenium.webdriver.common.by import By

driver.find_element(By.ID, "username")
driver.find_element(By.NAME, "password")
driver.find_element(By.CSS_SELECTOR, "div.item")
driver.find_element(By.XPATH, "//div[@class='item']")
```

---

## 3.4 Selenium 的等待机制

动态网页中，元素可能不是页面加载完成后立刻出现。

常见等待方式：

```text
1. 强制等待：time.sleep
2. 隐式等待：implicitly_wait
3. 显式等待：WebDriverWait
```

推荐使用：

```text
显式等待
```

因为显式等待可以等待某个具体条件成立，例如：

```text
1. 元素出现
2. 元素可点击
3. 元素可见
4. URL 改变
5. 页面标题变化
```

示例：

```python
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, "div.item"))
)
```

---

## 3.5 Selenium 适合的爬虫场景

```text
1. 页面由 JavaScript 动态渲染
2. requests 拿不到完整数据
3. 需要点击、输入、登录、滑动
4. 需要处理 iframe
5. 需要执行浏览器 JS
6. 需要模拟真实用户操作流程
```

---

## 3.6 Selenium 的优点

```text
1. 能操作真实浏览器
2. 能获取 JS 渲染后的页面
3. 能模拟用户行为
4. 支持多浏览器
5. 适合复杂交互页面
6. 学习资料丰富
```

---

## 3.7 Selenium 的缺点

```text
1. 速度比 requests 慢
2. 资源消耗大
3. 并发能力弱
4. 稳定性依赖等待机制
5. 部署浏览器环境较麻烦
6. 页面元素变化容易导致脚本失效
```

---

# 4. Playwright

## 4.1 Playwright 的概念

Playwright 是现代浏览器自动化工具，可以控制 Chromium、Firefox、WebKit 等浏览器，支持同步和异步 Python API。

它常用于：

```text
1. 自动化测试
2. 动态网页爬虫
3. 页面截图
4. PDF 生成
5. 网络请求监听
6. 登录状态复用
7. 多浏览器自动化
```

---

## 4.2 Playwright 的核心对象

```text
1. Browser：浏览器实例
2. BrowserContext：浏览器上下文
3. Page：页面标签页
4. Locator：元素定位器
5. Route：网络拦截对象
6. Request / Response：浏览器网络请求和响应
```

---

## 4.3 BrowserContext

`BrowserContext` 是 Playwright 很重要的概念。

可以理解为：

```text
一个独立的浏览器用户环境
```

每个 context 有独立的：

```text
1. cookies
2. localStorage
3. sessionStorage
4. 权限配置
5. 代理配置
6. 视口配置
```

---

## 4.4 Playwright 的自动等待

Playwright 的一个核心优势是自动等待。

它在执行点击、输入等动作前，会自动检查元素是否：

```text
1. 存在
2. 可见
3. 稳定
4. 可接收事件
5. 可用
```

如果条件不满足，会自动等待；如果超时，会抛出错误。

---

## 4.5 Locator 定位器

Playwright 推荐使用 Locator。

常见定位方式：

```text
1. get_by_role
2. get_by_text
3. get_by_label
4. get_by_placeholder
5. get_by_alt_text
6. get_by_title
7. get_by_test_id
8. css selector
9. xpath
```

示例：

```python
page.get_by_text("登录").click()
page.locator("div.item").click()
page.locator("//div[@class='item']").click()
```

---

## 4.6 网络监听与拦截

Playwright 可以监听和修改浏览器网络流量。

常见用途：

```text
1. 捕获接口请求
2. 捕获接口响应
3. 分析 Ajax 数据
4. 拦截图片、字体等资源
5. 修改请求头
6. Mock 接口数据
```

示例：

```python
def handle_response(response):
    if "/api/" in response.url:
        print(response.url, response.status)

page.on("response", handle_response)
```

---

## 4.7 Playwright 适合的爬虫场景

```text
1. 现代前端框架页面
2. SPA 单页应用
3. JS 动态渲染数据
4. 需要监听 Ajax 接口
5. 需要保存和复用登录态
6. 需要截图或生成 PDF
7. 需要更稳定的自动等待
8. 需要同时支持 Chromium / Firefox / WebKit
```

---

## 4.8 Playwright 的优点

```text
1. 自动等待机制强
2. 定位器能力强
3. 支持同步和异步 API
4. 支持多浏览器引擎
5. BrowserContext 隔离能力好
6. 网络监听和拦截能力强
7. 对现代动态页面支持好
8. 稳定性通常优于传统 Selenium 脚本
```

---

## 4.9 Playwright 的缺点

```text
1. 比 requests 慢
2. 资源消耗比 requests 大
3. 部署需要安装浏览器依赖
4. 对纯静态页面属于“杀鸡用牛刀”
5. 学习成本高于 requests
6. 大规模采集时需要更复杂的资源调度
```

---

# 5. requests、Selenium、Playwright 对比

## 5.1 核心定位对比

| 工具 | 本质 | 是否运行 JS | 是否打开浏览器 | 主要用途 |
| --- | --- | --- | --- | --- |
| requests | HTTP 请求库 | 否 | 否 | 静态页面、接口请求 |
| Selenium | 浏览器自动化工具 | 是 | 是 | 复杂浏览器交互 |
| Playwright | 现代浏览器自动化工具 | 是 | 是 | 动态页面、网络监听、自动化测试 |

---

## 5.2 使用场景对比

### requests 适合

```text
1. 静态网页
2. 直接返回 HTML 的页面
3. JSON API 接口
4. 图片、文件下载
5. 高并发采集
6. 请求逻辑简单的网站
```

### Selenium 适合

```text
1. 需要真实浏览器环境
2. 需要点击、输入、滑动
3. 页面通过 JS 渲染
4. 需要处理复杂登录流程
5. 老项目或已有 Selenium 自动化基础
```

### Playwright 适合

```text
1. 现代动态网页
2. SPA 前端应用
3. 需要自动等待
4. 需要监听 Ajax 请求
5. 需要隔离多个账号状态
6. 需要更稳定的浏览器自动化
```

---

## 5.3 优缺点对比

| 工具 | 优点 | 缺点 |
| --- | --- | --- |
| requests | 快、轻量、并发强、适合接口 | 不执行 JS，复杂交互弱 |
| Selenium | 真实浏览器、生态成熟、能模拟用户操作 | 慢、重、等待处理麻烦 |
| Playwright | 自动等待强、网络能力强、上下文隔离好 | 仍然较重，部署依赖浏览器 |

---

## 5.4 性能对比

一般性能顺序：

```text
requests > Playwright > Selenium
```

原因：

```text
requests：只发 HTTP 请求，不渲染页面
Playwright：打开浏览器，但自动等待和协议设计较现代
Selenium：通过 WebDriver 控制浏览器，交互链路较重
```

实际性能还取决于：

```text
1. 页面复杂度
2. 网络延迟
3. 是否加载图片、字体、视频
4. 是否启用无头模式
5. 并发数量
6. 等待策略
```

---

## 5.5 选择建议

```text
能用接口就不要解析 HTML
能用 requests 就不要开浏览器
requests 拿不到数据时，再考虑 Playwright / Selenium
新项目动态网页优先考虑 Playwright
已有 Selenium 项目或兼容需求再用 Selenium
大型规则化采集考虑 Scrapy
```

---

# 6. Scrapy

## 6.1 Scrapy 的概念

Scrapy 是 Python 中专业的爬虫框架。

它不是单纯的请求库，而是一个完整的爬虫系统。

它包含：

```text
1. 请求调度
2. 下载器
3. 解析器
4. 数据封装
5. 数据清洗
6. 数据存储
7. 中间件
8. 去重
9. 并发
10. 日志
11. 配置管理
```

---

## 6.2 Scrapy 核心组件

### 6.2.1 Engine

Engine 是执行引擎，负责协调各组件。

作用：

```text
1. 控制请求流转
2. 控制响应流转
3. 调度 Spider、Scheduler、Downloader、Pipeline
```

---

### 6.2.2 Spider

Spider 是爬虫逻辑主体。

负责：

```text
1. 定义起始 URL
2. 解析响应
3. 提取数据
4. 生成新的请求
```

---

### 6.2.3 Scheduler

Scheduler 是调度器。

负责：

```text
1. 接收请求
2. 请求排队
3. 请求去重
4. 决定下一个请求
```

---

### 6.2.4 Downloader

Downloader 是下载器。

负责：

```text
1. 发送 HTTP 请求
2. 获取网页响应
3. 把 Response 返回给 Engine
```

---

### 6.2.5 Item

Item 是结构化数据对象。

用于定义要爬取的数据字段，例如：

```text
title
url
price
author
publish_time
```

---

### 6.2.6 Item Pipeline

Pipeline 用于处理 Spider 提取出来的数据。

常见操作：

```text
1. 数据清洗
2. 数据校验
3. 数据去重
4. 保存 JSON
5. 保存 CSV
6. 保存数据库
```

---

### 6.2.7 Downloader Middleware

下载器中间件位于 Engine 和 Downloader 之间。

常见用途：

```text
1. 修改请求头
2. 设置代理
3. 处理重试
4. 处理响应
5. 过滤请求
6. 添加 cookie
```

---

### 6.2.8 Spider Middleware

Spider 中间件位于 Engine 和 Spider 之间。

常见用途：

```text
1. 处理 Spider 输入
2. 处理 Spider 输出
3. 修改 items
4. 修改 requests
5. 捕获 Spider 异常
```

---

## 6.3 Scrapy 的数据流

Scrapy 基本流程：

```text
1. Spider 生成初始 Request
2. Engine 把 Request 交给 Scheduler
3. Scheduler 按规则调度 Request
4. Engine 把 Request 交给 Downloader
5. Downloader 下载页面并返回 Response
6. Engine 把 Response 交给 Spider
7. Spider 解析 Response
8. Spider 产出 Item 或新的 Request
9. Item 进入 Pipeline
10. 新 Request 回到 Scheduler
11. 循环执行，直到没有请求
```

流程图：

```text
Spider
  ↓ 生成 Request
Engine
  ↓
Scheduler
  ↓
Engine
  ↓
Downloader
  ↓ 返回 Response
Engine
  ↓
Spider
  ↓
Item / New Request
  ↓
Pipeline / Scheduler
```

---

## 6.4 Scrapy 的特点

```text
1. 框架化
2. 异步并发
3. 自动调度
4. 自动去重
5. 支持中间件扩展
6. 支持管道处理数据
7. 适合大型爬虫项目
```

---

## 6.5 Scrapy 适合的场景

```text
1. 大规模列表页采集
2. 多层级详情页采集
3. 需要请求调度
4. 需要自动去重
5. 需要数据管道
6. 需要中间件统一处理代理、headers、重试
7. 需要长期维护的爬虫项目
```

---

## 6.6 Scrapy 不太适合的场景

```text
1. 只爬一个简单页面
2. 临时小脚本
3. 强 JS 动态渲染页面
4. 需要大量真实浏览器交互
```

对于 JS 动态页面，常见处理方式：

```text
1. 找真实接口，用 Scrapy 请求接口
2. Scrapy + Playwright
3. Scrapy + Selenium
4. 使用浏览器自动化拿到数据后再交给 Scrapy 管道处理
```

---

# 7. 线程 / 进程 / 协程 / 异步

## 7.1 并发和并行

### 7.1.1 并发

并发是指多个任务在同一时间段内交替执行。

重点是：

```text
看起来同时进行
```

---

### 7.1.2 并行

并行是指多个任务在同一时刻真正同时执行。

重点是：

```text
真正同时运行
```

---

### 7.1.3 并发和并行的区别

```text
并发：任务交替执行
并行：任务同时执行
```

---

## 7.2 线程

线程是进程中的执行单元。

特点：

```text
1. 一个进程可以有多个线程
2. 多个线程共享同一进程的内存
3. 创建成本低于进程
4. 适合 I/O 密集型任务
```

爬虫中的 I/O 密集型任务包括：

```text
1. 网络请求
2. 文件读写
3. 等待服务器响应
```

---

## 7.3 GIL

GIL 是 CPython 中的全局解释器锁。

影响：

```text
1. 同一时刻通常只有一个线程执行 Python 字节码
2. 多线程不适合 CPU 密集型计算
3. 多线程仍然适合 I/O 密集型任务
```

CPU 密集型任务：

```text
1. 大量数学计算
2. 图像处理
3. 加密解密
4. 数据压缩
```

---

## 7.4 进程

进程是系统资源分配的基本单位。

特点：

```text
1. 每个进程有独立内存空间
2. 进程之间互不影响
3. 创建成本高于线程
4. 可以利用多核 CPU
5. 适合 CPU 密集型任务
```

---

## 7.5 协程

协程是一种用户态的轻量级并发方式。

特点：

```text
1. 单线程内切换任务
2. 由程序主动让出控制权
3. 切换成本低
4. 适合大量 I/O 等待任务
5. 通常配合 async / await 使用
```

协程不是操作系统线程。

它依赖事件循环调度。

---

## 7.6 异步

异步是一种编程模型。

核心思想：

```text
任务遇到 I/O 等待时，不阻塞整个程序，而是让出执行权，去执行其他任务
```

Python 中常用：

```text
asyncio
async def
await
aiohttp
httpx.AsyncClient
```

---

## 7.7 线程、进程、协程对比

| 对比点 | 线程 | 进程 | 协程 |
| --- | --- | --- | --- |
| 调度者 | 操作系统 | 操作系统 | 程序 / 事件循环 |
| 内存 | 同进程线程共享内存 | 进程间内存隔离 | 通常单线程共享内存 |
| 创建成本 | 中等 | 高 | 低 |
| 切换成本 | 中等 | 高 | 低 |
| 是否适合 I/O 密集 | 适合 | 一般 | 很适合 |
| 是否适合 CPU 密集 | 不太适合 | 适合 | 不适合 |
| 是否能利用多核 | 受 GIL 限制 | 可以 | 单线程下不可以 |
| 爬虫使用场景 | 多请求并发 | CPU 解析 / 计算 | 高并发异步请求 |

---

## 7.8 爬虫中如何选择并发模型

### 7.8.1 requests + 多线程

适合：

```text
1. 普通网页请求
2. 接口请求
3. I/O 等待较多
4. 代码复杂度不想太高
```

特点：

```text
简单实用，适合初中级爬虫
```

---

### 7.8.2 requests + 多进程

适合：

```text
1. 页面解析非常耗 CPU
2. 数据处理计算量大
3. 多核 CPU 利用
```

不适合：

```text
大量简单网络请求
```

因为进程创建和通信成本较高。

---

### 7.8.3 aiohttp / httpx + asyncio

适合：

```text
1. 大量接口请求
2. 高并发 I/O
3. 请求量很大
4. 对性能要求高
```

特点：

```text
性能强，但代码复杂度更高
```

---

### 7.8.4 Scrapy

适合：

```text
1. 大型爬虫项目
2. 规则化页面
3. 多页面、多层级抓取
4. 需要调度、去重、管道、中间件
```

Scrapy 本身已经是异步非阻塞模型，不需要自己手写线程池。

---

### 7.8.5 Selenium / Playwright 并发

浏览器自动化并发要谨慎。

原因：

```text
1. 浏览器资源消耗大
2. 每个页面都占内存和 CPU
3. 并发过高容易崩溃
4. 更适合少量复杂页面
```

Playwright 可以通过多个 context 或多个 page 做一定并发，但仍然比纯 HTTP 请求重很多。

---

# 8. 总体选择路线

## 8.1 第一优先级：找接口

```text
页面数据来自接口时，优先请求接口
```

工具：

```text
requests
httpx
aiohttp
Scrapy
```

---

## 8.2 第二优先级：解析 HTML

```text
页面直接返回完整 HTML 时，用 requests + 解析库
```

常用组合：

```text
requests + BeautifulSoup
requests + lxml
requests + parsel
```

---

## 8.3 第三优先级：浏览器自动化

```text
页面必须 JS 渲染或必须交互时，再使用浏览器自动化
```

工具选择：

```text
新项目：Playwright
旧项目或已有代码：Selenium
```

---

## 8.4 第四优先级：框架化

```text
项目变大、页面变多、需要长期维护时，使用 Scrapy
```

---

# 9. 最核心总结

## 9.1 工具总结

```text
requests：
轻量 HTTP 请求库，适合静态页面和接口。

Session：
用于会话保持、cookie 自动维护、连接复用。

Selenium：
真实浏览器自动化，适合复杂交互和 JS 页面，但较慢较重。

Playwright：
现代浏览器自动化工具，自动等待强，网络监听强，适合现代动态网页。

Scrapy：
专业爬虫框架，适合大型、规则化、可维护的爬虫项目。
```

---

## 9.2 并发模型总结

```text
线程：
适合 I/O 密集型爬虫。

进程：
适合 CPU 密集型任务。

协程 / 异步：
适合高并发 I/O 请求。
```

---

## 9.3 工具选择口诀

```text
能用接口就用 requests；
需要会话就用 Session；
需要浏览器就用 Playwright / Selenium；
项目变大就用 Scrapy；
请求量大再考虑线程、协程或 Scrapy 的异步调度。
```

---

## 9.4 最终一句话

> 爬虫进阶的核心不是记住某一个库，而是根据数据来源、页面复杂度、请求规模和维护成本，选择最合适的工具组合。
