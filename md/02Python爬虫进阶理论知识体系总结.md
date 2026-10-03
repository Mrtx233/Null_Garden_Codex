---
title: "Python 爬虫进阶理论知识体系总结"
description: "本文是《Python 爬虫完整知识体系总结》的进阶篇，围绕爬虫进阶中的七个核心方向系统展开：requests、Session、Selenium、Playwright、三大工具横向对比、Scrapy，以及线程 / 进程 / 协程 / 异步并发模型。全文侧重理论框架与工具选型逻辑，建议配合前篇的实战模板一起食用，效果更佳。"
tags:
  - "Python"
  - "爬虫"
  - "异步并发"
---

# Python 爬虫进阶理论知识体系总结

大家好，我是小马不起床。

本文是《Python 爬虫完整知识体系总结》的进阶篇，围绕爬虫进阶中的七个核心方向系统展开：requests、Session、Selenium、Playwright、三大工具横向对比、Scrapy，以及线程 / 进程 / 协程 / 异步并发模型。全文侧重理论框架与工具选型逻辑，建议配合前篇的实战模板一起食用，效果更佳。

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
9. 核心总结

---

# 1. requests

## 1.1 requests 的概念

`requests` 是 Python 生态中广泛使用的 HTTP 请求库，用于向服务器发送 HTTP 请求并接收响应。

主要应用场景：

```text
1. 请求网页 HTML
2. 请求接口 API
3. 提交表单数据
4. 下载图片、文件、视频等资源
5. 携带 headers、cookies、params、data、json 等请求参数
```

`requests` 的技术本质是模拟客户端向服务器发送 HTTP 请求。

需要特别指出的是：

```text
requests 不具备 JavaScript 执行能力
```

因此，当网页内容依赖 JS 动态渲染时，单独使用 `requests` 无法获取最终渲染后的页面数据。

---

## 1.2 GET 和 POST 的区别

| 对比点 | GET | POST |
| --- | --- | --- |
| 主要用途 | 获取数据 | 提交数据 |
| 参数位置 | 通常位于 URL 查询字符串中 | 通常位于请求体 body 中 |
| 是否适合传输大量数据 | 不适合 | 更适合 |
| 是否常用于搜索、列表页 | 常用 | 较少 |
| 是否常用于登录、表单提交 | 较少 | 常用 |
| 是否更容易被缓存 | 相对更容易 | 一般不缓存 |
| 爬虫常见场景 | 翻页、搜索、详情页请求 | 登录、接口提交、表单提交 |

---

### 1.2.1 GET

GET 请求通常用于获取资源。

常见场景：

```text
1. 访问新闻列表页
2. 访问商品详情页
3. 请求搜索结果
4. 分页请求
5. 请求公开 API
```

GET 请求的参数通常附加于 URL 之后，例如：

```text
https://example.com/search?keyword=python&page=1
```

在 `requests` 中，GET 查询参数通过 `params` 传递。

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
4. 提交检索条件
5. 调用需要请求体的接口
6. 上传文件
```

POST 数据的常见格式：

```text
1. 表单数据：data
2. JSON 数据：json
3. 文件上传：files
```

---

## 1.3 requests 常用参数详解

---

### 1.3.1 url

`url` 为请求地址。

爬虫场景中 URL 通常分为：

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

`params` 用于 GET 请求，将参数拼接至 URL 查询字符串。

适用场景：

```text
1. 搜索关键词
2. 页码
3. 排序条件
4. 分类 ID
5. 时间范围
```

特性说明：

```text
1. 参数会体现在 URL 中
2. requests 会自动执行 URL 编码
3. 值为 None 的参数不会加入 URL 查询字符串
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

`data` 用于提交表单数据，通常配合 POST 请求使用。

适用场景：

```text
1. 登录表单
2. 搜索表单
3. 评论表单
4. 常规 application/x-www-form-urlencoded 请求
```

特性说明：

```text
1. 数据位于请求体中
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

适用场景：

```text
1. JSON API
2. 前后端分离接口
3. 移动端接口
4. Ajax 接口
```

`data` 与 `json` 的核心区别：

```text
data：提交表单格式数据
json：提交 JSON 格式数据
```

当接口要求请求头为：

```text
Content-Type: application/json
```

时，通常应使用 `json` 参数。

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

`headers` 为请求头，用于向服务器声明客户端信息。

常见 headers：

```text
User-Agent：客户端类型，例如浏览器信息
Referer：请求来源页面
Accept：客户端可接收的数据类型
Accept-Language：语言偏好
Content-Type：请求体数据类型
Authorization：认证信息
Cookie：携带 cookie 信息
```

爬虫中的常见用途：

```text
1. 模拟浏览器请求
2. 指定请求数据类型
3. 携带认证 token
4. 声明来源页面
5. 降低请求被直接拒绝的概率
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

主要作用：

```text
1. 维持登录状态
2. 标识用户身份
3. 保存访问偏好
4. 保存服务端下发的会话标识
```

爬虫中的常见场景：

```text
1. 登录后访问个人中心
2. 访问需要权限的页面
3. 保持同一用户状态
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
1. 避免请求长时间阻塞
2. 提升爬虫稳定性
3. 便于异常处理与重试控制
```

生产环境代码中应显式设置 `timeout`。

示例：

```python
resp = requests.get(url, timeout=10)
```

也可分别设置连接超时与读取超时：

```python
resp = requests.get(url, timeout=(3, 10))
```

---

### 1.3.8 proxies

`proxies` 用于配置代理。

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

风险提示：

```text
verify=False 会带来中间人攻击等安全隐患，仅建议在受控环境下临时调试使用
```

示例：

```python
resp = requests.get(url, verify=False)
```

---

### 1.3.10 allow_redirects

`allow_redirects` 用于控制是否跟随重定向。

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

`stream=True` 表示启用流式下载。

适用场景：

```text
1. 下载大文件
2. 下载图片
3. 下载视频
4. 分块读取响应内容
```

特性说明：

```text
1. 不会一次性将响应体全部加载至内存
2. 支持边下载边写入文件
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

`requests` 请求完成后返回 `Response` 对象。

常用属性与方法：

```text
response.status_code：状态码
response.text：字符串形式响应内容
response.content：二进制响应内容
response.json()：将 JSON 响应转换为 Python 对象
response.headers：响应头
response.cookies：响应 cookie
response.url：最终请求 URL
response.history：重定向历史
response.encoding：响应编码
response.raise_for_status()：状态码异常检查
```

使用要点：

```text
1. response.text 适合 HTML、文本
2. response.content 适合图片、文件、二进制内容
3. response.json() 适合 JSON 接口
4. response.status_code 仅反映 HTTP 层面状态，不代表业务层面必然成功
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

`Session` 是 `requests` 中用于维持会话状态的对象。

核心价值：

```text
1. 复用 TCP 连接
2. 自动保存并携带 cookies
3. 统一配置 headers
4. 统一配置认证信息
5. 统一配置代理等参数
6. 使多次请求呈现为来自同一客户端会话
```

---

## 2.2 Session 与普通 requests 请求的区别

| 对比点 | 普通 requests.get/post | requests.Session |
| --- | --- | --- |
| Cookie 保存 | 不自动跨请求持久保存 | 在 Session 内自动保持 |
| 连接复用 | 能力较弱 | 支持连接池复用 |
| 登录状态维持 | 需手动传递 cookie | 自动维护 cookie |
| 公共 headers | 每次请求均需传递 | 可统一设置 |
| 适用场景 | 单次请求 | 多次连续请求、登录后请求 |

---

## 2.3 会话保持

会话保持指客户端与服务器在多次请求之间维持同一用户状态的机制。

典型流程：

```text
1. 首次请求登录接口
2. 服务器返回 Set-Cookie
3. Session 自动保存 cookie
4. 后续请求自动携带 cookie
5. 服务器识别为同一用户
```

会话保持的典型应用：

```text
1. 登录后访问个人中心
2. 分页抓取需要登录的数据
3. 连续访问同一站点的多个页面
4. 维持购物车、用户偏好、身份状态
```

---

## 2.4 Cookie 更新机制

Cookie 的更新通常源于服务器响应头中的：

```text
Set-Cookie
```

Session 内部会依据响应自动更新其 cookie jar。

常见情形：

```text
1. 登录成功后服务端下发新 cookie
2. 访问特定页面后服务端刷新 sessionid
3. token 过期后服务端重新设置 cookie
4. 风控系统下发新的追踪 cookie
```

注意事项：

```text
1. Session 自动维护的对象是 cookie
2. 不保证自动维护 token
3. 若 token 位于 HTML 或 JSON 中，需自行解析并更新
4. 若 cookie 失效，需重新登录或重新获取
```

---

## 2.5 Session 常见配置

常用配置项：

```python
session.headers.update(...)
session.cookies
session.auth
session.proxies
session.verify
session.params
```

适合统一配置的内容：

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

## 2.6 Session 适用的爬虫场景

```text
1. 需要登录的网站
2. 多页连续抓取
3. 接口依赖 cookie 状态
4. 站点依据 sessionid 识别用户
5. 需要复用连接以提升性能
6. 请求之间存在前后依赖关系
```

---

# 3. Selenium

## 3.1 Selenium 的概念

Selenium 是浏览器自动化工具，其核心机制是通过 WebDriver 控制真实浏览器完成任务。

支持的用户行为模拟：

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
7. ActionChains：复合用户动作
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

在动态网页中，元素往往不会在页面加载完成时立即可用。

常见等待方式：

```text
1. 强制等待：time.sleep
2. 隐式等待：implicitly_wait
3. 显式等待：WebDriverWait
```

工程实践推荐：

```text
显式等待
```

原因是显式等待可针对具体条件进行等待，例如：

```text
1. 元素出现
2. 元素可点击
3. 元素可见
4. URL 变化
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

## 3.5 Selenium 适用的爬虫场景

```text
1. 页面由 JavaScript 动态渲染
2. requests 无法获取完整数据
3. 需要点击、输入、登录、滑动等交互
4. 需要处理 iframe
5. 需要执行浏览器 JS
6. 需要模拟真实用户操作流程
```

---

## 3.6 Selenium 的优点

```text
1. 可操作真实浏览器
2. 可获取 JS 渲染后的页面
3. 可完整模拟用户行为
4. 支持多浏览器
5. 适合复杂交互页面
6. 生态成熟，学习资料丰富
```

---

## 3.7 Selenium 的缺点

```text
1. 速度显著低于 requests
2. 资源消耗大
3. 并发能力弱
4. 稳定性高度依赖等待机制
5. 浏览器环境部署成本较高
6. 页面元素变动容易导致脚本失效
```

---

# 4. Playwright

## 4.1 Playwright 的概念

Playwright 是现代浏览器自动化工具，可控制 Chromium、Firefox、WebKit 等浏览器内核，并同时提供同步与异步 Python API。

典型用途：

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
6. Request / Response：浏览器网络请求与响应
```

---

## 4.3 BrowserContext

`BrowserContext` 是 Playwright 的核心概念之一，可理解为：

```text
一个独立的浏览器用户环境
```

每个 context 拥有相互独立的：

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

Playwright 的关键优势之一是自动等待机制。

在执行点击、输入等动作前，Playwright 会自动校验元素是否满足：

```text
1. 存在
2. 可见
3. 稳定
4. 可接收事件
5. 可用
```

条件不满足时自动等待，超出时限则抛出错误。

---

## 4.5 Locator 定位器

Playwright 推荐使用 Locator 进行元素定位。

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

Playwright 支持监听和修改浏览器网络流量。

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

## 4.7 Playwright 适用的爬虫场景

```text
1. 现代前端框架页面
2. SPA 单页应用
3. JS 动态渲染数据
4. 需要监听 Ajax 接口
5. 需要保存和复用登录态
6. 需要截图或生成 PDF
7. 需要更可靠的自动等待能力
8. 需要同时支持 Chromium / Firefox / WebKit
```

---

## 4.8 Playwright 的优点

```text
1. 自动等待机制完善
2. 定位器能力强
3. 同步与异步 API 兼备
4. 支持多浏览器引擎
5. BrowserContext 隔离能力优秀
6. 网络监听与拦截能力突出
7. 对现代动态页面适配良好
8. 稳定性通常优于传统 Selenium 脚本
```

---

## 4.9 Playwright 的缺点

```text
1. 速度低于 requests
2. 资源消耗高于 requests
3. 部署需要安装浏览器依赖
4. 用于纯静态页面属于能力冗余
5. 学习成本高于 requests
6. 大规模采集时需要更复杂的资源调度
```

---

# 5. requests、Selenium、Playwright 对比

## 5.1 核心定位对比

| 工具 | 本质 | 是否执行 JS | 是否打开浏览器 | 主要用途 |
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
2. 需要点击、输入、滑动等交互
3. 页面通过 JS 渲染
4. 需要处理复杂登录流程
5. 存量项目或已有 Selenium 自动化基础
```

### Playwright 适合

```text
1. 现代动态网页
2. SPA 前端应用
3. 需要自动等待能力
4. 需要监听 Ajax 请求
5. 需要隔离多账号状态
6. 需要更高稳定性的浏览器自动化
```

---

## 5.3 优缺点对比

| 工具 | 优点 | 缺点 |
| --- | --- | --- |
| requests | 快速、轻量、并发能力强、适合接口 | 不执行 JS，复杂交互能力弱 |
| Selenium | 真实浏览器、生态成熟、可模拟用户操作 | 速度慢、资源重、等待处理繁琐 |
| Playwright | 自动等待强、网络能力强、上下文隔离优秀 | 资源开销仍然较大，部署依赖浏览器 |

---

## 5.4 性能对比

一般性能排序：

```text
requests > Playwright > Selenium
```

原因分析：

```text
requests：仅发送 HTTP 请求，不渲染页面
Playwright：启动浏览器，但协议设计与等待机制更为现代
Selenium：经由 WebDriver 控制浏览器，交互链路开销较大
```

实际性能还取决于以下因素：

```text
1. 页面复杂度
2. 网络延迟
3. 是否加载图片、字体、视频
4. 是否启用无头模式
5. 并发数量
6. 等待策略
```

---

## 5.5 选型建议

```text
能够使用接口时，优先请求接口而非解析 HTML；
能够使用 requests 解决时，不引入浏览器自动化；
requests 无法获取数据时，再考虑 Playwright / Selenium；
新项目的动态网页场景优先考虑 Playwright；
存量 Selenium 项目或存在兼容性要求时选用 Selenium；
大规模、规则化采集考虑 Scrapy。
```

---

# 6. Scrapy

## 6.1 Scrapy 的概念

Scrapy 是 Python 生态中专业的爬虫框架。

它并非单纯的请求库，而是一套完整的爬虫系统，内置能力涵盖：

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

Engine 为执行引擎，负责协调各组件工作。

职责：

```text
1. 控制请求流转
2. 控制响应流转
3. 调度 Spider、Scheduler、Downloader、Pipeline
```

---

### 6.2.2 Spider

Spider 是爬虫逻辑的主体。

职责：

```text
1. 定义起始 URL
2. 解析响应
3. 提取数据
4. 生成新的请求
```

---

### 6.2.3 Scheduler

Scheduler 为调度器。

职责：

```text
1. 接收请求
2. 请求排队
3. 请求去重
4. 决定下一个待执行请求
```

---

### 6.2.4 Downloader

Downloader 为下载器。

职责：

```text
1. 发送 HTTP 请求
2. 获取网页响应
3. 将 Response 返回给 Engine
```

---

### 6.2.5 Item

Item 为结构化数据对象，用于定义采集目标的数据字段，例如：

```text
title
url
price
author
publish_time
```

---

### 6.2.6 Item Pipeline

Pipeline 负责处理 Spider 提取出的数据。

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

下载器中间件位于 Engine 与 Downloader 之间。

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

Spider 中间件位于 Engine 与 Spider 之间。

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

Scrapy 基本工作流程：

```text
1. Spider 生成初始 Request
2. Engine 将 Request 提交给 Scheduler
3. Scheduler 按规则调度 Request
4. Engine 将 Request 交给 Downloader
5. Downloader 下载页面并返回 Response
6. Engine 将 Response 交给 Spider
7. Spider 解析 Response
8. Spider 产出 Item 或新的 Request
9. Item 进入 Pipeline
10. 新 Request 返回 Scheduler
11. 循环执行，直至队列清空
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

## 6.5 Scrapy 适用的场景

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

## 6.6 Scrapy 不适用的场景

```text
1. 仅采集单个简单页面的需求
2. 临时性小型脚本
3. 强 JS 动态渲染页面
4. 依赖大量真实浏览器交互的场景
```

针对 JS 动态页面，常见处理方案：

```text
1. 定位真实接口，由 Scrapy 直接请求接口
2. Scrapy + Playwright
3. Scrapy + Selenium
4. 通过浏览器自动化获取数据后，交由 Scrapy 管道处理
```

---

# 7. 线程 / 进程 / 协程 / 异步

## 7.1 并发和并行

### 7.1.1 并发

并发指多个任务在同一时间段内交替执行。

核心特征：

```text
宏观上同时进行
```

---

### 7.1.2 并行

并行指多个任务在同一时刻真正同时执行。

核心特征：

```text
物理上同时运行
```

---

### 7.1.3 并发与并行的区别

```text
并发：任务交替执行
并行：任务同时执行
```

---

## 7.2 线程

线程是进程内的执行单元。

特点：

```text
1. 一个进程可包含多个线程
2. 多线程共享同一进程的内存空间
3. 创建成本低于进程
4. 适合 I/O 密集型任务
```

爬虫场景中的 I/O 密集型任务包括：

```text
1. 网络请求
2. 文件读写
3. 等待服务器响应
```

---

## 7.3 GIL

GIL 是 CPython 解释器中的全局解释器锁。

影响：

```text
1. 同一时刻通常仅有一个线程执行 Python 字节码
2. 多线程不适用于 CPU 密集型计算
3. 多线程仍然适用于 I/O 密集型任务
```

CPU 密集型任务的典型形态：

```text
1. 大规模数值计算
2. 图像处理
3. 加解密运算
4. 数据压缩
```

---

## 7.4 进程

进程是操作系统资源分配的基本单位。

特点：

```text
1. 每个进程拥有独立的内存空间
2. 进程之间相互隔离
3. 创建成本高于线程
4. 可利用多核 CPU
5. 适合 CPU 密集型任务
```

---

## 7.5 协程

协程是运行在用户态的轻量级并发机制。

特点：

```text
1. 在单线程内切换任务
2. 由程序主动让出控制权
3. 切换成本极低
4. 适合大规模 I/O 等待任务
5. 通常配合 async / await 使用
```

需要明确：协程并非操作系统线程，其调度依赖事件循环。

---

## 7.6 异步

异步是一种编程模型。

核心思想：

```text
任务在 I/O 等待期间不阻塞整个程序，而是让出执行权，转由其他任务执行
```

Python 中的常用组件：

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
| 能否利用多核 | 受 GIL 限制 | 可以 | 单线程下不可以 |
| 爬虫应用场景 | 多请求并发 | CPU 解析 / 计算 | 高并发异步请求 |

---

## 7.8 爬虫中并发模型的选择

### 7.8.1 requests + 多线程

适合：

```text
1. 常规网页请求
2. 接口请求
3. I/O 等待占主导的场景
4. 希望控制实现复杂度的场景
```

特点：

```text
实现简单、工程实用性强，适合初中级爬虫
```

---

### 7.8.2 requests + 多进程

适合：

```text
1. 页面解析 CPU 开销显著
2. 数据处理计算量大
3. 需要利用多核 CPU
```

不适合：

```text
大量简单网络请求
```

原因是进程创建与通信成本较高。

---

### 7.8.3 aiohttp / httpx + asyncio

适合：

```text
1. 大规模接口请求
2. 高并发 I/O
3. 请求量极大
4. 对性能要求较高
```

特点：

```text
性能突出，但代码复杂度相应上升
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

Scrapy 本身即采用异步非阻塞模型，无需手动管理线程池。

---

### 7.8.5 Selenium / Playwright 并发

浏览器自动化的并发能力需要审慎评估。

原因：

```text
1. 浏览器资源消耗大
2. 每个页面均占用内存与 CPU
3. 并发度过高容易引发崩溃
4. 更适合少量复杂页面场景
```

Playwright 可通过多 context 或多 page 实现一定程度的并发，但其资源开销仍显著高于纯 HTTP 请求。

---

# 8. 总体选择路线

## 8.1 第一优先级：定位接口

```text
页面数据来源于接口时，优先请求接口
```

可用工具：

```text
requests
httpx
aiohttp
Scrapy
```

---

## 8.2 第二优先级：解析 HTML

```text
页面直接返回完整 HTML 时，采用 requests + 解析库
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
页面必须依赖 JS 渲染或必须交互时，再引入浏览器自动化
```

工具选择：

```text
新项目：Playwright
存量项目或已有代码：Selenium
```

---

## 8.4 第四优先级：框架化

```text
项目规模扩大、页面数量增多、需要长期维护时，采用 Scrapy
```

---

# 9. 核心总结

## 9.1 工具总结

```text
requests：
轻量 HTTP 请求库，适合静态页面与接口请求。

Session：
用于会话保持、cookie 自动维护与连接复用。

Selenium：
真实浏览器自动化方案，适合复杂交互与 JS 页面，但速度较慢、开销较大。

Playwright：
现代浏览器自动化工具，自动等待与网络监听能力突出，适合现代动态网页。

Scrapy：
专业爬虫框架，适合大型、规则化、可持续维护的爬虫项目。
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

## 9.3 选型原则

```text
能够使用接口时，选择 requests；
需要会话保持时，使用 Session；
需要浏览器环境时，选择 Playwright 或 Selenium；
项目规模化后，引入 Scrapy；
请求量上升时，再考虑线程、协程或 Scrapy 的异步调度。
```

---

## 9.4 最后一点体会

> 爬虫进阶的核心不是记住某一个库，而是能够根据数据来源、页面复杂度、请求规模和维护成本，选择最合适的工具组合。

以上是本篇的全部内容，工具对比和选型路线建议重点消化。如果对你有帮助，欢迎点赞、收藏、转发；有问题也欢迎评论区交流。我是小马不起床，我们下期见。
