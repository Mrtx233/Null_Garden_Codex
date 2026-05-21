# Python 爬虫完整系统总结

本文系统整理 Python 爬虫的完整知识链路，包括网页加载流程、数据来源判断、DevTools 抓包、HTTP 协议、`requests` 请求、Cookie / Session、HTML / JSON 解析、并发提速、数据存储和常用代码模板。

---

## 目录

1. 网站的加载流程
2. 爬虫数据从哪里来
3. 页面源代码解析方式
4. Ajax 异步请求数据
5. 浏览器 DevTools 使用
6. HTTP 协议核心
7. Python requests 发请求
8. Cookie 和 Session 保持
9. 响应内容处理
10. 提高爬虫抓取效率
11. 数据存储
12. 爬虫排查思路
13. 常用代码模板
14. 总结

---

## 1. 网站的加载流程

浏览器打开一个网页时，并不是一次性把所有内容都拿回来，而是经历了一整套加载流程。

基本流程：

```text
1. 在地址栏输入网址
2. 浏览器访问对方服务器，发起第一次请求
3. 服务器返回一段内容，通常是 HTML 页面源代码
4. 浏览器解释执行 HTML
5. 浏览器继续加载页面中的 JS、CSS、图片、视频等资源
6. JS 脚本执行，完成页面特效、动态事件、异步数据加载等逻辑
7. 页面渲染完成，最终展示在用户面前
```

可以概括为：

```text
输入网址
    ↓
发起请求
    ↓
拿到 HTML
    ↓
解析 HTML
    ↓
加载 CSS / JS / 图片等资源
    ↓
执行 JS
    ↓
渲染页面
    ↓
用户看到完整页面
```

需要注意的是，有些网站会在用户操作时继续发送新请求。例如：

```text
搜索框输入
点击按钮
滚动加载
分页切换
视频播放
评论加载
```

这些操作都可能触发新的网络请求。

在浏览器中，可以通过开发者工具的 `Network` 面板观察整个网页加载过程。

强制刷新页面：

```text
Ctrl + Shift + R
```

这个操作会尽量忽略缓存，重新向服务器请求资源，做爬虫抓包时很常用。

---

## 2. 爬虫数据从哪里来

爬虫最重要的第一步不是写代码，而是判断数据来源。

常见数据来源主要有两种：

```text
1. 页面源代码
2. Ajax 异步请求
```

### 2.1 判断思路

```text
先看页面源代码里有没有目标数据

如果有：
    直接请求 HTML
    然后解析 HTML

如果没有：
    去 Network 里找 Ajax 接口
```

---

### 2.2 页面源代码中有数据

如果目标数据直接存在于 HTML 页面源代码中，爬虫流程比较简单：

```text
requests.get()
    ↓
获取页面源代码
    ↓
解析 HTML
    ↓
提取数据
    ↓
保存数据
```

示例代码：

```python
import requests

url = "https://example.com"
resp = requests.get(url)

html = resp.text
print(html)
```

拿到 HTML 后，需要选择合适的解析方式。

常见方案：

```text
re 正则表达式
BeautifulSoup / bs4
XPath / lxml.etree
```

---

### 2.3 页面源代码中没有数据

如果页面源代码中没有目标数据，但浏览器页面上能看到数据，大概率是 Ajax 异步加载。

处理思路：

```text
打开 DevTools
    ↓
进入 Network
    ↓
刷新页面
    ↓
查找返回目标数据的接口
    ↓
直接请求这个接口
    ↓
解析接口返回的 JSON
```

Ajax 接口返回的数据大多数是 JSON 格式。拿到 JSON 后，使用 Python 字典或列表处理即可。

示例代码：

```python
import requests

url = "https://example.com/api/list"
resp = requests.get(url)

data = resp.json()
print(data)
```

---

## 3. 页面源代码解析方式

当数据在 HTML 中时，重点就是解析 HTML。

常见解析方式：

```text
1. re 正则表达式
2. BeautifulSoup / bs4
3. XPath / lxml
```

---

## 3.1 re 正则表达式

正则表达式是一门独立的小语言，用来从字符串中匹配内容。

### 3.1.1 常见元字符

```text
.      匹配除了换行符以外的任意内容
\w     匹配数字、字母、下划线
\d     匹配数字
```

### 3.1.2 常见量词

```text
+      前面的内容匹配 1 次或多次
*      前面的内容匹配 0 次或多次
?      前面的内容匹配 0 次或 1 次
```

默认情况下，`+`、`*`、`?` 往往会产生贪婪匹配。

---

### 3.1.3 贪婪匹配

贪婪匹配会尽可能多地匹配内容。

```regex
.*
```

例如：

```html
<div>第一个</div><div>第二个</div>
```

如果使用：

```regex
<div>.*</div>
```

可能会从第一个 `<div>` 一直匹配到最后一个 `</div>`。

---

### 3.1.4 惰性匹配

惰性匹配会尽可能少地匹配内容。

```regex
.*?
```

爬虫中更常用：

```regex
<div>(.*?)</div>
```

---

### 3.1.5 写正则的技巧

常用技巧：

```text
独一无二的头
    +
.*?
    +
不会影响匹配结果的结尾
```

也就是说，尽量找一个稳定且唯一的开头，再配合惰性匹配和稳定的结尾。

---

### 3.1.6 Python re 模块

```python
import re

html = 'jquery({"name":"alex"})'

obj = re.compile(r"jquery\((?P<data>.*?)\)", re.S)
ret = obj.search(html)

print(ret.group("data"))
```

说明：

```text
re.compile()       预加载正则
(?P<data>.*?)      命名分组
re.S               让 . 可以匹配换行符
.search()          从字符串中搜索第一个匹配结果
.group("data")     根据分组名取内容
```

适用场景：

```text
页面结构简单
目标内容前后特征明显
接口返回的是 JSONP 或混杂字符串
```

不适合场景：

```text
HTML 结构复杂
标签嵌套多
页面格式经常变化
```

---

## 3.2 BeautifulSoup 解析

安装：

```bash
pip install bs4
```

基本使用：

```python
from bs4 import BeautifulSoup

html = """
<html>
    <body>
        <div class="item">内容1</div>
        <div class="item">内容2</div>
    </body>
</html>
"""

soup = BeautifulSoup(html, "html.parser")

item = soup.find("div", attrs={"class": "item"})
items = soup.find_all("div", attrs={"class": "item"})

print(item.text)

for i in items:
    print(i.text)
```

常用方法：

```python
soup.find(标签名, attrs={属性名: 属性值})       # 返回第一个找到的内容
soup.find_all(标签名, attrs={属性名: 属性值})   # 返回所有找到的内容

soup.select_one(选择器)                         # 根据 CSS 选择器找第一个
soup.select(选择器)                             # 根据 CSS 选择器找所有
```

示例：

```python
title = soup.select_one("div.item").text
items = soup.select("div.item")
```

适用场景：

```text
HTML 或 XML 不太规则
想用标签、属性、CSS 选择器快速提取内容
对解析容错要求比较高
```

---

## 3.3 XPath 解析

安装：

```bash
pip install lxml
```

基本使用：

```python
from lxml import etree

html = """
<html>
    <body>
        <div class="item">
            <span>内容1</span>
        </div>
    </body>
</html>
"""

tree = etree.HTML(html)
ret = tree.xpath("//div[@class='item']/span/text()")

print(ret)
```

基础语法：

```text
//标签                 全页面查找某个标签
./                    从当前标签内部继续查找
//标签[@属性='值']      根据属性筛选标签
//标签/text()          提取当前标签的儿子文本
//标签//text()         提取当前标签的子子孙孙文本
//标签/*/text()        提取孙子辈文本，* 表示任意标签
//*[@class='xxx']      查找任意 class 等于 xxx 的标签
//标签/@属性名          获取标签上的属性值
```

示例 HTML：

```html
<div>
    你好
    <span>你不好</span>
    <p>你才好</p>
    <div>
        <span>哈哈哈</span>
    </div>
</div>
```

提取方式：

```python
tree.xpath("//div/text()")      # 只取儿子文本
tree.xpath("//div//text()")     # 取子子孙孙所有文本
tree.xpath("//div/*/text()")    # 取孙子辈文本
```

获取属性：

```python
hrefs = tree.xpath("//a/@href")
```

适用场景：

```text
HTML 结构比较清晰
需要精准定位标签层级
页面结构稳定
```

---

## 4. Ajax 异步请求数据

Ajax 请求的数据通常不在页面源代码里，而是页面加载后由 JS 再发请求获取。

典型现象：

```text
浏览器页面上能看到数据
右键查看网页源代码找不到数据
Network 中有接口返回 JSON
```

处理步骤：

```text
1. 打开浏览器开发者工具
2. 进入 Network
3. 刷新页面
4. 观察请求列表
5. 找到返回目标数据的请求
6. 查看请求 URL、请求方式、请求头、请求参数
7. 用 requests 模拟该请求
```

如果找到了接口，就不需要解析页面源代码，直接请求接口即可。

示例代码：

```python
import requests

url = "https://example.com/api/data"

headers = {
    "User-Agent": "Mozilla/5.0"
}

params = {
    "page": 1
}

resp = requests.get(url, headers=headers, params=params)
data = resp.json()

print(data)
```

---

## 5. 浏览器 DevTools 使用

浏览器开发者工具是爬虫分析中最重要的工具之一。

---

## 5.1 Elements 元素面板

`Elements` 显示的是当前页面实时结构。

它看到的是：

```text
HTML 经过浏览器解析
    ↓
JS 执行
    ↓
用户操作
    ↓
页面动态变化之后的结构
```

注意：不要只看 `Elements` 就直接写 XPath。

原因：

```text
Elements 是浏览器运行后的 DOM
requests.get() 拿到的是原始页面源代码
两者结构可能不一样
```

正确做法：

```text
Elements 可以做参考
但最终要结合 requests 拿到的源代码来写 XPath 或 bs4 解析
```

---

## 5.2 Console 控制台

`Console` 的作用：

```text
查看页面输出
测试 JS 代码
调用页面中的函数
配合 debugger 动态插入代码
观察变量值
```

后续做 JS 逆向时，`Console` 是非常常用的调试位置。

---

## 5.3 Sources 源代码面板

`Sources` 可以查看页面加载的所有资源：

```text
HTML
JS
CSS
图片
其他静态资源
```

它也是调试 JS 最常用的位置，可以：

```text
格式化 JS
下断点
单步调试
查看调用栈
修改局部代码观察结果
```

---

## 5.4 Network 网络面板

`Network` 负责抓包，是爬虫中使用频率最高的面板。

### General

```text
Request URL      请求地址
Request Method   请求方式
Status Code      状态码
Remote Address   服务器地址
```

### Headers

可以看请求头和响应头。

重点关注：

```text
User-Agent
Referer
Cookie
Content-Type
Set-Cookie
```

### Payload

查看请求参数。

可能出现：

```text
Query String Parameters
Form Data
Request Payload
```

### Preview

适合查看 JSON 的结构化预览。

### Response

查看服务器返回的原始内容。

调试时，如果 `Preview` 看不清楚，就看 `Response`。

---

## 5.5 Application 应用面板

`Application` 主要看浏览器本地存储。

常用位置：

```text
Cookie
Local Storage
Session Storage
```

常见操作：

```text
查看登录态
查看 token
删除缓存
删除 cookie
分析本地存储中是否保存了关键参数
```

---

## 6. HTTP 协议核心

爬虫本质上就是模拟浏览器发送 HTTP 请求并处理 HTTP 响应。

---

## 6.1 请求数据包结构

HTTP 请求大致分为：

```text
请求行
请求头
空行
请求体
```

### 请求行

请求行包含：

```text
请求方式 URL HTTP版本
```

例如：

```http
GET /index.html HTTP/1.1
```

### 请求头

请求头包含浏览器、来源、Cookie、数据类型等信息。

### 空行

空行用于分隔请求头和请求体。

### 请求体

POST 请求通常会有请求体，GET 请求一般没有请求体。

---

## 6.2 请求方式

### GET

GET 请求通常直接通过 URL 和查询参数发送数据。

```text
https://example.com/list?page=1&size=20
```

特点：

```text
参数通常放在 URL 上
请求体一般为空
常用于获取数据
```

### POST

POST 请求通常把参数放在请求体里。

特点：

```text
参数可能是表单
参数可能是 JSON
常用于登录、提交表单、复杂查询等
```

---

## 6.3 POST 参数类型

POST 请求中，参数主要有两类：

```text
Form Data
Request Payload
```

---

### 6.3.1 Form Data

请求头通常是：

```text
Content-Type: application/x-www-form-urlencoded
```

请求体格式：

```text
key1=value1&key2=value2
```

在 DevTools 中通常显示为：

```text
Form Data
```

用 `requests` 时传字典给 `data`：

```python
data = {
    "username": "alex",
    "password": "123456"
}

resp = requests.post(url, data=data, headers=headers)
```

---

### 6.3.2 Request Payload

请求头通常是：

```text
Content-Type: application/json
```

请求体格式：

```json
{"userName":"alex","password":"123456"}
```

在 DevTools 中通常显示为：

```text
Request Payload
```

用 `requests` 时，可以传 JSON 字符串：

```python
import json
import requests

data = {
    "userName": "alex",
    "password": "123456"
}

resp = requests.post(
    url,
    data=json.dumps(data, separators=(",", ":")),
    headers={
        "Content-Type": "application/json"
    }
)
```

也可以使用 `json=` 参数：

```python
resp = requests.post(url, json=data, headers=headers)
```

但做逆向时，如果目标站对 JSON 字符串格式很敏感，建议按抓包结果手动控制 `json.dumps()` 的格式。

---

## 6.4 常见请求头

### User-Agent

表示用户设备和浏览器版本。

```text
User-Agent: Mozilla/5.0 ...
```

很多网站会检查 `User-Agent`。如果不带，可能直接被识别为脚本。

---

### Accept

表示客户端希望接收什么类型的数据。

```text
Accept: application/json, text/plain, */*
```

---

### Accept-Encoding

表示希望服务器用什么压缩方式返回内容。

```text
Accept-Encoding: gzip, deflate, br
```

---

### Content-Type

通常出现在 POST 请求中，表示请求体的数据类型。

常见值：

```text
application/x-www-form-urlencoded
application/json
```

---

### Referer

表示当前请求是从哪个页面发起的。

它常用于防盗链和来源检测。

判断网站是否检测 `Referer` 的简单方法：

```text
把资源 URL 直接丢到浏览器地址栏

如果出现 403：
    很可能是检测了 Referer
```

---

### Cookie

`Cookie` 用于保持会话状态。

服务器返回数据时，可以通过响应头：

```text
Set-Cookie
```

让浏览器保存 Cookie。后续浏览器访问同一网站时，会自动携带这些 Cookie。

Cookie 也可能参与：

```text
加密参数
登录校验
风控识别
```

---

## 6.5 响应数据包结构

HTTP 响应大致分为：

```text
状态行
响应头
空行
响应体
```

### 状态行

包含：

```text
HTTP 版本
状态码
状态描述
```

### 响应头

服务器返回的附加信息。

常见响应头：

```text
Location
Set-Cookie
Content-Type
```

### 响应体

真正返回的内容，例如：

```text
HTML
JSON
图片字节
文件字节
```

---

## 6.6 常见状态码

### 200

请求成功。

注意：

```text
200 只代表 HTTP 层面成功，返回内容不一定是你想要的数据。
```

---

### 302

重定向。

响应头中通常有：

```text
Location
```

表示新的跳转地址。

---

### 403

服务器拒绝访问。

常见原因：

```text
权限不够
请求头不完整
Cookie 不正确
Referer 不正确
被反爬识别
```

---

### 404

资源不存在。

常见原因：

```text
URL 写错
接口路径错
参数拼接错
```

---

### 500

服务器内部错误。

可能原因：

```text
服务器代码本身有 bug
你传递的参数导致服务器报错
请求格式不符合服务器预期
```

---

## 7. Python requests 发请求

安装：

```bash
pip install requests
```

导入：

```python
import requests
```

---

## 7.1 GET 请求

```python
import requests

url = "https://example.com/list"

params = {
    "page": 1,
    "size": 20
}

headers = {
    "User-Agent": "Mozilla/5.0"
}

resp = requests.get(url, params=params, headers=headers)

print(resp.text)
```

说明：

```text
url      请求地址
params   自动拼到 URL 后面的查询参数
headers  请求头
```

最终效果类似：

```text
https://example.com/list?page=1&size=20
```

---

## 7.2 POST 表单请求

对应 DevTools 中的：

```text
Form Data
Content-Type: application/x-www-form-urlencoded
```

代码：

```python
import requests

url = "https://example.com/login"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded"
}

data = {
    "username": "alex",
    "password": "123456"
}

resp = requests.post(url, data=data, headers=headers)

print(resp.text)
```

---

## 7.3 POST JSON 请求

对应 DevTools 中的：

```text
Request Payload
Content-Type: application/json
```

代码：

```python
import json
import requests

url = "https://example.com/api/login"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/json"
}

data = {
    "userName": "alex",
    "password": "123456"
}

json_str = json.dumps(data, separators=(",", ":"))
resp = requests.post(url, data=json_str, headers=headers)

print(resp.text)
```

`json.dumps()` 默认会生成带空格的字符串：

```json
{"userName": "alex", "password": "123456"}
```

使用：

```python
json.dumps(data, separators=(",", ":"))
```

可以生成更紧凑的 JSON：

```json
{"userName":"alex","password":"123456"}
```

有些网站对签名、加密、请求体原文比较敏感，这种细节可能会影响请求结果。

---

## 8. Cookie 和 Session 保持

---

## 8.1 Cookie 的基本逻辑

Cookie 的作用是保持会话状态。

流程：

```text
第一次请求
    ↓
服务器响应 Set-Cookie
    ↓
浏览器保存 Cookie
    ↓
后续请求自动携带 Cookie
```

在爬虫中，如果每次都用 `requests.get()`，Cookie 不一定能自动保持完整会话。

此时可以使用：

```python
requests.session()
```

---

## 8.2 requests.session

```python
import requests

session = requests.session()

session.headers = {
    "User-Agent": "Mozilla/5.0"
}

resp1 = session.get("https://example.com")
resp2 = session.get("https://example.com/user")

print(resp2.text)
```

`session` 的好处：

```text
自动保持服务器通过 Set-Cookie 返回的 Cookie
可以统一设置请求头
后续请求复用同一个会话
```

---

## 8.3 注意 JS 生成的 Cookie

`session` 只能自动处理服务器响应头中的：

```text
Set-Cookie
```

如果 Cookie 是 JS 在浏览器里生成的，`session` 不会自动帮你生成。

这种情况需要：

```text
分析 JS
    ↓
执行 JS 生成 cookie 值
    ↓
手动更新到 session.cookies
```

示例：

```python
cookie_value = "通过 JS 计算出来的值"

session.cookies.update({
    "key": cookie_value
})

resp = session.get(url)
```

如果请求后又生成新 Cookie，也需要继续更新：

```python
new_cookie_value = "新的 JS 计算结果"

session.cookies.update({
    "key": new_cookie_value
})
```

---

## 9. 响应内容处理

`requests` 常用的响应读取方式有三个：

```text
resp.text
resp.json()
resp.content
```

---

## 9.1 resp.text

读取文本内容。

```python
resp = requests.get(url)

print(resp.text)
```

适合：

```text
HTML
文本
JSON 字符串初步查看
```

---

## 9.2 resp.json()

把 JSON 字符串直接转成 Python 字典或列表。

```python
resp = requests.get(url)

data = resp.json()

print(data)
```

注意：不要在没确认返回内容是 JSON 时，上来就调用 `resp.json()`。

正确调试习惯：

```python
resp = requests.get(url)
print(resp.text)

# 确认确实是 JSON 后，再使用
data = resp.json()
```

如果 `resp.json()` 报错，第一时间应该打印：

```python
print(resp.text)
```

而不是先怀疑 Python 或 `requests`。

---

## 9.3 resp.content

读取字节内容。

```python
resp = requests.get(url)
content = resp.content
```

适合：

```text
图片
视频
音频
压缩包
PDF
其他二进制文件
```

下载文件：

```python
import requests

url = "https://example.com/a.jpg"
resp = requests.get(url)

with open("a.jpg", "wb") as f:
    f.write(resp.content)
```

---

## 9.4 一定要学会溯源

一句重要的话：

```text
一定要学会溯源
```

意思是：代码出问题时，不要只看最终报错，要往前找数据来源。

排查顺序：

```text
请求 URL 对不对
请求方式对不对
请求头对不对
参数位置对不对
参数格式对不对
Cookie 对不对
响应内容到底是什么
解析方式是否匹配响应内容
```

---

## 10. 提高爬虫抓取效率

当请求数量变多时，单线程爬虫会比较慢。

常见提速方式：

```text
多线程
多进程
协程
```

---

## 10.1 多线程

多线程适合大量相同或相似的 IO 任务，例如批量请求网页、批量下载图片。

### threading.Thread

```python
from threading import Thread

def task(url):
    print("抓取", url)

if __name__ == "__main__":
    t = Thread(target=task, args=("https://example.com",))
    t.start()
```

### ThreadPoolExecutor

更推荐使用线程池：

```python
from concurrent.futures import ThreadPoolExecutor

def task(url):
    print("抓取", url)

urls = [
    "https://example.com/1",
    "https://example.com/2",
    "https://example.com/3",
]

with ThreadPoolExecutor(10) as pool:
    for url in urls:
        pool.submit(task, url)
```

特点：

```text
适合网络请求这种 IO 密集型任务
使用简单
可以控制并发数量
```

---

## 10.2 多进程

多进程可以同时开启多个任务，更倾向于任务之间相互独立，或者 CPU 密集型任务。

```python
from multiprocessing import Process

def task(url):
    print("抓取", url)

if __name__ == "__main__":
    p = Process(target=task, args=("https://example.com",))
    p.start()
```

特点：

```text
进程之间更独立
开销比线程大
适合重计算或独立任务
```

---

## 10.3 协程

协程的核心思想：

```text
当一个任务遇到 IO 等待时，切换到其他任务执行
尽量让线程不要闲着
```

爬虫中常用：

```python
import asyncio
import aiohttp
import aiofiles
```

安装：

```bash
pip install aiohttp aiofiles
```

基本模板：

```python
import asyncio
import aiohttp

async def fetch(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            text = await resp.text(encoding="utf-8")
            print(text)

async def main():
    tasks = []

    for i in range(10):
        url = f"https://example.com/page/{i}"
        task = asyncio.create_task(fetch(url))
        tasks.append(task)

    await asyncio.wait(tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

下载文件：

```python
import asyncio
import aiohttp
import aiofiles

async def download(url, filename):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            content = await resp.content.read()

            async with aiofiles.open(filename, mode="wb") as f:
                await f.write(content)

async def main():
    tasks = [
        asyncio.create_task(download("https://example.com/a.jpg", "a.jpg")),
        asyncio.create_task(download("https://example.com/b.jpg", "b.jpg")),
    ]

    await asyncio.wait(tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

老写法：

```python
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
```

现代 Python 更常用：

```python
asyncio.run(main())
```

---

## 11. 数据存储

爬到数据后，要根据数据类型选择保存方式。

常见方式：

```text
CSV
MySQL
文件下载
```

---

## 11.1 CSV 存储

CSV 本质是文本，不要把它直接当成 Excel。

简单写法：

```python
import csv

data = [
    ["name", "age"],
    ["alex", 18],
    ["wusir", 20],
]

with open("data.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(data)
```

字典写法：

```python
import csv

rows = [
    {"name": "alex", "age": 18},
    {"name": "wusir", "age": 20},
]

with open("data.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "age"])
    writer.writeheader()
    writer.writerows(rows)
```

---

## 11.2 MySQL 存储

安装：

```bash
pip install pymysql
```

基本模板：

```python
import pymysql

conn = pymysql.connect(
    host="地址",
    port=3306,
    user="用户名",
    password="密码",
    database="连接哪个库",
    charset="utf8mb4"
)

try:
    cursor = conn.cursor()

    sql = "insert into 表名(字段1, 字段2) values(%s, %s)"
    cursor.execute(sql, ("参数1", "参数2"))

    conn.commit()
except Exception as e:
    conn.rollback()
    print(e)
finally:
    cursor.close()
    conn.close()
```

关键点：

```text
execute() 负责执行 SQL
参数不要手动拼接，使用 %s 占位
conn.commit() 提交事务，不提交默认不写入数据库
出错时使用 conn.rollback() 回滚
最后关闭游标和连接
```

---

## 11.3 下载文件

下载图片、视频、压缩包等二进制文件时，使用 `wb`。

```python
import requests

url = "https://example.com/file.zip"
resp = requests.get(url)

with open("file.zip", "wb") as f:
    f.write(resp.content)
```

核心：

```text
文本数据      -> w / encoding
二进制数据    -> wb
```

---

## 12. 爬虫排查思路

爬虫问题通常不是“代码写错”这么简单，更多时候是请求和浏览器不一致。

建议按下面顺序排查。

---

## 12.1 先确认数据来源

```text
页面源代码里有吗？
Network 接口里有吗？
是不是 JS 运行后才出现？
是不是用户操作后才请求？
```

---

## 12.2 再确认请求信息

```text
URL 是否一致
GET / POST 是否一致
Query 参数是否一致
Form Data 或 Request Payload 是否一致
Content-Type 是否一致
```

---

## 12.3 再确认请求头

重点看：

```text
User-Agent
Referer
Cookie
Content-Type
Accept
```

---

## 12.4 再确认响应内容

不要上来就解析。

先打印：

```python
print(resp.status_code)
print(resp.text)
```

然后判断：

```text
是不是登录页？
是不是验证码页？
是不是 403？
是不是空数据？
是不是接口报错？
是不是返回 HTML 而不是 JSON？
```

---

## 12.5 最后再看解析逻辑

```text
正则是否贪婪过头？
XPath 是否基于 Elements 写错了？
bs4 选择器是否匹配不到？
JSON 字段路径是否变了？
```

---

## 13. 常用代码模板

---

## 13.1 GET 请求模板

```python
import requests

url = "https://example.com/api"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://example.com/"
}

params = {
    "page": 1
}

resp = requests.get(url, params=params, headers=headers)

print(resp.status_code)
print(resp.text)
```

---

## 13.2 POST Form Data 模板

```python
import requests

url = "https://example.com/login"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/x-www-form-urlencoded"
}

data = {
    "username": "alex",
    "password": "123456"
}

resp = requests.post(url, data=data, headers=headers)

print(resp.status_code)
print(resp.text)
```

---

## 13.3 POST JSON 模板

```python
import json
import requests

url = "https://example.com/api/login"

headers = {
    "User-Agent": "Mozilla/5.0",
    "Content-Type": "application/json"
}

data = {
    "userName": "alex",
    "password": "123456"
}

resp = requests.post(
    url,
    data=json.dumps(data, separators=(",", ":")),
    headers=headers
)

print(resp.status_code)
print(resp.text)
```

---

## 13.4 Session 模板

```python
import requests

session = requests.session()

session.headers = {
    "User-Agent": "Mozilla/5.0"
}

resp = session.get("https://example.com")
print(resp.text)

session.cookies.update({
    "token": "手动计算或获取到的 cookie 值"
})

resp = session.get("https://example.com/user")
print(resp.text)
```

---

## 13.5 XPath 模板

```python
import requests
from lxml import etree

url = "https://example.com"
resp = requests.get(url)

tree = etree.HTML(resp.text)

items = tree.xpath("//div[@class='item']")

for item in items:
    title = item.xpath("./a/text()")
    href = item.xpath("./a/@href")

    title = title[0] if title else ""
    href = href[0] if href else ""

    print(title, href)
```

---

## 13.6 bs4 模板

```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com"
resp = requests.get(url)

soup = BeautifulSoup(resp.text, "html.parser")

items = soup.select("div.item")

for item in items:
    title = item.select_one("a")

    if title:
        print(title.text, title.get("href"))
```

---

## 13.7 正则模板

```python
import re
import requests

url = "https://example.com"
resp = requests.get(url)

obj = re.compile(r'<div class="item">(?P<title>.*?)</div>', re.S)

for match in obj.finditer(resp.text):
    title = match.group("title")
    print(title)
```

---

## 13.8 线程池模板

```python
import requests
from concurrent.futures import ThreadPoolExecutor

def fetch(url):
    resp = requests.get(url)
    print(url, resp.status_code)

urls = [
    "https://example.com/1",
    "https://example.com/2",
    "https://example.com/3",
]

with ThreadPoolExecutor(10) as pool:
    for url in urls:
        pool.submit(fetch, url)
```

---

## 13.9 协程模板

```python
import asyncio
import aiohttp

async def fetch(session, url):
    async with session.get(url) as resp:
        text = await resp.text()
        print(url, len(text))

async def main():
    urls = [
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
    ]

    async with aiohttp.ClientSession() as session:
        tasks = []

        for url in urls:
            tasks.append(asyncio.create_task(fetch(session, url)))

        await asyncio.wait(tasks)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 14. 总结

这份笔记的核心脉络可以整理为：

```text
网页如何加载
    ↓
数据在哪里
    ↓
如何用 DevTools 定位请求
    ↓
如何理解 HTTP 请求和响应
    ↓
如何用 requests 模拟请求
    ↓
如何保持 Cookie 和 Session
    ↓
如何解析 HTML 或 JSON
    ↓
如何提高抓取效率
    ↓
如何保存数据
```

真正写爬虫时，不要一上来就写代码。更稳的流程是：

```text
1. 打开网页，观察数据是否直接在页面源代码中
2. 如果不在源代码中，去 Network 找 Ajax 接口
3. 确认请求方式、URL、参数、请求头、Cookie
4. 用 requests 模拟请求
5. 先打印 resp.text，确认响应内容正确
6. 根据响应格式选择 json()、XPath、bs4 或正则解析
7. 数据量大时使用线程池、进程或协程提速
8. 最终保存到 CSV、MySQL 或文件
```

最重要的一句话：

> 爬虫的本质不是“复制浏览器请求”，而是理解浏览器到底发了什么，再用 Python 稳定复现这个过程。
