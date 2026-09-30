# Python 爬虫完整知识体系总结

大家好，我是小马不起床。

爬虫的本质并非"复制浏览器请求"，而是准确理解浏览器发出的每一次请求，并用 Python 稳定、可复现地还原这一过程。本文按照"加载原理 → 数据定位 → 协议理解 → 请求模拟 → 数据解析 → 效率优化 → 数据存储 → 问题排查"的完整链路，系统梳理 Python 爬虫的核心知识体系，建议收藏反复查阅。

---

## 目录

1. 网站的加载流程
2. 爬虫数据的来源定位
3. 页面源代码的三种解析方式
4. Ajax 异步请求数据
5. 浏览器 DevTools 的使用
6. HTTP 协议核心
7. 使用 requests 发送请求
8. Cookie 与 Session 的会话保持
9. 响应内容的处理
10. 抓取效率优化
11. 数据存储
12. 爬虫问题排查思路
13. 常用代码模板
14. 总结

---

## 1. 网站的加载流程

浏览器访问网页并非一次性获取全部内容，而是遵循一套完整的加载流程：

```text
1. 用户在地址栏输入网址
2. 浏览器向目标服务器发起首次请求
3. 服务器返回 HTML 页面源代码
4. 浏览器解析并执行 HTML
5. 浏览器继续加载页面中的 JS、CSS、图片、视频等资源
6. JS 脚本执行，完成页面交互、动态事件与异步数据加载
7. 页面渲染完成，呈现给用户
```

概括如下：

```text
输入网址
    ↓
发起请求
    ↓
获取 HTML
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

需要特别关注的是，许多网站会在用户交互过程中持续发起新的请求，典型场景包括：

```text
搜索输入
按钮点击
滚动加载
分页切换
视频播放
评论加载
```

上述操作均可能触发新的网络请求，这也是部分数据无法从首次响应中获得的原因。

在浏览器中，可通过开发者工具的 `Network` 面板观察完整的加载过程。强制刷新页面：

```text
Ctrl + Shift + R
```

该操作会忽略本地缓存并重新向服务器请求资源，是抓包分析时的标准动作。

---

## 2. 爬虫数据的来源定位

爬虫工作的第一步不是编写代码，而是判定数据来源。常见来源只有两种：

```text
1. 页面源代码
2. Ajax 异步请求
```

### 2.1 判定原则

```text
首先检查页面源代码中是否存在目标数据

若存在：
    直接请求 HTML
    解析 HTML 提取数据

若不存在：
    进入 Network 面板定位 Ajax 接口
```

---

### 2.2 数据存在于页面源代码

当目标数据直接包含在 HTML 源代码中时，爬虫流程相对直接：

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

获取 HTML 后，需要选择合适的解析方式，常见方案为：

```text
re 正则表达式
BeautifulSoup / bs4
XPath / lxml
```

---

### 2.3 数据不存在于页面源代码

若页面源代码中没有目标数据，但浏览器渲染后的页面可以显示，则基本可以判定为 Ajax 异步加载。

处理思路：

```text
打开 DevTools
    ↓
进入 Network 面板
    ↓
刷新页面
    ↓
定位返回目标数据的接口
    ↓
直接请求该接口
    ↓
解析接口返回的 JSON
```

Ajax 接口的返回数据通常为 JSON 格式，可直接使用 Python 的字典与列表结构进行处理。

示例代码：

```python
import requests

url = "https://example.com/api/list"
resp = requests.get(url)

data = resp.json()
print(data)
```

---

## 3. 页面源代码的三种解析方式

当数据位于 HTML 中时，核心工作即为解析。主流方案：

```text
1. re 正则表达式
2. BeautifulSoup / bs4
3. XPath / lxml
```

---

## 3.1 re 正则表达式

正则表达式是用于在字符串中匹配内容的独立描述语言。

### 3.1.1 常见元字符

```text
.      匹配除换行符以外的任意字符
\w     匹配数字、字母、下划线
\d     匹配数字
```

### 3.1.2 常见量词

```text
+      前面的内容匹配 1 次或多次
*      前面的内容匹配 0 次或多次
?      前面的内容匹配 0 次或 1 次
```

默认情况下，`+`、`*`、`?` 均执行贪婪匹配。

---

### 3.1.3 贪婪匹配

贪婪匹配会尽可能多地匹配内容。以模式：

```regex
.*
```

为例，对于：

```html
<div>第一个</div><div>第二个</div>
```

使用：

```regex
<div>.*</div>
```

将从第一个 `<div>` 一直匹配至最后一个 `</div>`，导致结果超出预期。

---

### 3.1.4 惰性匹配

惰性匹配会尽可能少地匹配内容：

```regex
.*?
```

爬虫场景中更常用的写法：

```regex
<div>(.*?)</div>
```

---

### 3.1.5 正则编写技巧

推荐模式：

```text
具备唯一性的起始特征
    +
.*?
    +
不影响匹配结果的结束特征
```

即优先选取稳定且唯一的起始位置，配合惰性匹配与稳定的结束位置。

---

### 3.1.6 Python re 模块

```python
import re

html = 'jquery({"name":"alex"})'

obj = re.compile(r"jquery\((?P<data>.*?)\)", re.S)
ret = obj.search(html)

print(ret.group("data"))
```

要点说明：

```text
re.compile()       预编译正则表达式
(?P<data>.*?)      命名分组
re.S               使 . 可以匹配换行符
.search()          从字符串中检索首个匹配结果
.group("data")     按分组名提取内容
```

适用场景：

```text
页面结构简单
目标内容前后特征明显
接口返回 JSONP 或混杂字符串
```

不适用场景：

```text
HTML 结构复杂
标签嵌套层级多
页面格式频繁变更
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
soup.find(标签名, attrs={属性名: 属性值})       # 返回首个匹配结果
soup.find_all(标签名, attrs={属性名: 属性值})   # 返回全部匹配结果

soup.select_one(选择器)                         # 按 CSS 选择器返回首个结果
soup.select(选择器)                             # 按 CSS 选择器返回全部结果
```

示例：

```python
title = soup.select_one("div.item").text
items = soup.select("div.item")
```

适用场景：

```text
HTML 或 XML 结构不规范
需要按标签、属性、CSS 选择器快速提取
对解析容错能力要求较高
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
//标签                 全页面查找指定标签
./                    从当前节点内部继续查找
//标签[@属性='值']      按属性筛选标签
//标签/text()          提取当前标签的直接子节点文本
//标签//text()         提取当前标签的全部后代文本
//标签/*/text()        提取子一级的孙辈文本，* 表示任意标签
//*[@class='xxx']      查找任意 class 等于 xxx 的标签
//标签/@属性名          获取标签的属性值
```

示例 HTML：

```html
<div>
    文本一
    <span>文本二</span>
    <p>文本三</p>
    <div>
        <span>文本四</span>
    </div>
</div>
```

提取方式：

```python
tree.xpath("//div/text()")      # 仅提取直接子节点文本
tree.xpath("//div//text()")     # 提取全部后代文本
tree.xpath("//div/*/text()")    # 提取孙辈节点文本
```

获取属性：

```python
hrefs = tree.xpath("//a/@href")
```

适用场景：

```text
HTML 结构清晰
需要精准定位标签层级
页面结构稳定
```

---

## 4. Ajax 异步请求数据

Ajax 请求的数据通常不在页面源代码中，而是页面加载完成后由 JS 发起二次请求获取。

典型特征：

```text
浏览器页面上可见目标数据
查看网页源代码找不到该数据
Network 中存在返回 JSON 的接口请求
```

处理步骤：

```text
1. 打开浏览器开发者工具
2. 进入 Network 面板
3. 刷新页面
4. 观察请求列表
5. 定位返回目标数据的请求
6. 检查请求 URL、请求方式、请求头、请求参数
7. 使用 requests 复现该请求
```

一旦定位到接口，即可跳过页面解析环节，直接请求接口获取结构化数据，这是效率最高的采集路径。

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

## 5. 浏览器 DevTools 的使用

浏览器开发者工具是爬虫分析工作中最重要的基础设施。

---

## 5.1 Elements 元素面板

`Elements` 展示的是页面当前的实时 DOM 结构，即：

```text
HTML 经过浏览器解析
    ↓
JS 执行
    ↓
用户操作
    ↓
页面动态变化之后的结构
```

重要提醒：不应直接依据 `Elements` 编写 XPath。

原因：

```text
Elements 呈现的是浏览器运行后的 DOM
requests.get() 获取的是原始页面源代码
两者结构可能不一致
```

正确做法：

```text
Elements 可作为结构参考
最终解析规则必须基于 requests 获取的源代码进行验证与编写
```

---

## 5.2 Console 控制台

`Console` 的主要用途：

```text
查看页面输出
测试 JS 代码
调用页面内的函数
配合 debugger 动态注入代码
观察变量取值
```

在后续的 JS 逆向工作中，`Console` 是最高频的调试入口。

---

## 5.3 Sources 源代码面板

`Sources` 可查看页面加载的全部资源：

```text
HTML
JS
CSS
图片
其他静态资源
```

该面板也是 JS 调试的主战场，支持：

```text
格式化 JS
设置断点
单步调试
查看调用栈
修改局部代码并观察结果
```

---

## 5.4 Network 网络面板

`Network` 承担抓包分析职能，是爬虫工作中使用频率最高的面板。

### General

```text
Request URL      请求地址
Request Method   请求方式
Status Code      状态码
Remote Address   服务器地址
```

### Headers

用于查看请求头与响应头，重点关注：

```text
User-Agent
Referer
Cookie
Content-Type
Set-Cookie
```

### Payload

用于查看请求参数，可能呈现为：

```text
Query String Parameters
Form Data
Request Payload
```

### Preview

适合查看 JSON 的结构化预览。

### Response

查看服务器返回的原始内容。当 `Preview` 展示不完整时，应切换至 `Response` 核对原始数据。

---

## 5.5 Application 应用面板

`Application` 用于查看浏览器本地存储，常用位置：

```text
Cookie
Local Storage
Session Storage
```

典型操作：

```text
查看登录态
查看 token
清除缓存
清除 cookie
分析本地存储中是否保存了关键参数
```

---

## 6. HTTP 协议核心

爬虫的技术本质即为模拟浏览器发送 HTTP 请求并处理 HTTP 响应，因此协议理解是必备基础。

---

## 6.1 请求数据包结构

HTTP 请求由四部分构成：

```text
请求行
请求头
空行
请求体
```

### 请求行

请求行包含三项信息：

```text
请求方式 URL HTTP版本
```

例如：

```http
GET /index.html HTTP/1.1
```

### 请求头

请求头携带客户端标识、来源页面、会话凭证、数据类型等元信息。

### 空行

空行用于分隔请求头与请求体。

### 请求体

POST 请求通常包含请求体，GET 请求一般没有请求体。

---

## 6.2 请求方式

### GET

GET 请求通过 URL 及查询参数传递数据：

```text
https://example.com/list?page=1&size=20
```

特征：

```text
参数通常位于 URL 中
请求体一般为空
语义上用于获取数据
```

### POST

POST 请求将参数置于请求体中。

特征：

```text
参数可以是表单
参数可以是 JSON
常用于登录、表单提交、复杂查询等场景
```

---

## 6.3 POST 参数类型

POST 请求的参数主要分为两类：

```text
Form Data
Request Payload
```

---

### 6.3.1 Form Data

请求头特征：

```text
Content-Type: application/x-www-form-urlencoded
```

请求体格式：

```text
key1=value1&key2=value2
```

在 DevTools 中显示为：

```text
Form Data
```

使用 `requests` 时，将字典传入 `data` 参数：

```python
data = {
    "username": "alex",
    "password": "123456"
}

resp = requests.post(url, data=data, headers=headers)
```

---

### 6.3.2 Request Payload

请求头特征：

```text
Content-Type: application/json
```

请求体格式：

```json
{"userName":"alex","password":"123456"}
```

在 DevTools 中显示为：

```text
Request Payload
```

使用 `requests` 时，可传入 JSON 字符串：

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

也可直接使用 `json=` 参数：

```python
resp = requests.post(url, json=data, headers=headers)
```

需要说明的是：在逆向场景中，若目标站点对 JSON 字符串格式敏感，建议依据抓包结果手动控制 `json.dumps()` 的输出格式。

---

## 6.4 常见请求头

### User-Agent

标识客户端设备与浏览器版本：

```text
User-Agent: Mozilla/5.0 ...
```

大量网站会对 `User-Agent` 进行校验，缺失时极易被识别为脚本流量。

---

### Accept

声明客户端期望接收的数据类型：

```text
Accept: application/json, text/plain, */*
```

---

### Accept-Encoding

声明期望服务器使用的压缩方式：

```text
Accept-Encoding: gzip, deflate, br
```

---

### Content-Type

通常出现于 POST 请求，声明请求体的数据类型，常见值：

```text
application/x-www-form-urlencoded
application/json
```

---

### Referer

声明当前请求的发起页面，常用于防盗链与来源校验。

判断网站是否校验 `Referer` 的简易方法：

```text
将资源 URL 直接在浏览器地址栏打开

若返回 403：
    大概率存在 Referer 校验
```

---

### Cookie

`Cookie` 用于维持会话状态。服务器通过响应头：

```text
Set-Cookie
```

指示浏览器保存 Cookie，后续访问同一站点时浏览器会自动携带。

Cookie 还可能参与：

```text
加密参数生成
登录状态校验
风控识别
```

---

## 6.5 响应数据包结构

HTTP 响应由四部分构成：

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

服务器返回的附加元信息，常见响应头：

```text
Location
Set-Cookie
Content-Type
```

### 响应体

实际返回的内容，例如：

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

需要警惕：

```text
200 仅表示 HTTP 层面成功，返回内容未必是目标数据。
```

---

### 302

重定向。响应头中通常包含：

```text
Location
```

指示新的跳转地址。

---

### 403

服务器拒绝访问，常见原因：

```text
权限不足
请求头不完整
Cookie 不正确
Referer 不正确
被反爬机制识别
```

---

### 404

资源不存在，常见原因：

```text
URL 书写错误
接口路径错误
参数拼接错误
```

---

### 500

服务器内部错误，可能原因：

```text
服务器代码存在缺陷
传递的参数引发服务端异常
请求格式不符合服务端预期
```

---

## 7. 使用 requests 发送请求

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

参数说明：

```text
url      请求地址
params   自动拼接至 URL 的查询参数
headers  请求头
```

最终请求效果等价于：

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

代码实现：

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

代码实现：

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

`json.dumps()` 默认生成包含空格的字符串：

```json
{"userName": "alex", "password": "123456"}
```

使用：

```python
json.dumps(data, separators=(",", ":"))
```

可生成紧凑格式的 JSON：

```json
{"userName":"alex","password":"123456"}
```

部分网站对签名、加密及请求体原文高度敏感，此类格式差异可能直接影响请求结果。

---

## 8. Cookie 与 Session 的会话保持

---

## 8.1 Cookie 的基本机制

Cookie 的核心作用是维持会话状态，其工作流程：

```text
首次请求
    ↓
服务器响应 Set-Cookie
    ↓
浏览器保存 Cookie
    ↓
后续请求自动携带 Cookie
```

在爬虫场景中，若每次均独立调用 `requests.get()`，Cookie 未必能完整保持会话。此时应使用：

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

`session` 的优势：

```text
自动维护服务器通过 Set-Cookie 返回的 Cookie
支持统一设置请求头
多次请求复用同一会话
```

---

## 8.3 注意 JS 生成的 Cookie

`session` 仅能自动处理服务器响应头中的：

```text
Set-Cookie
```

若 Cookie 由 JS 在浏览器端计算生成，`session` 无法自动生成，需要：

```text
分析 JS 逻辑
    ↓
执行 JS 生成 cookie 值
    ↓
手动写入 session.cookies
```

示例：

```python
cookie_value = "通过 JS 计算得到的值"

session.cookies.update({
    "key": cookie_value
})

resp = session.get(url)
```

若请求后会触发新的 Cookie 生成，仍需持续更新：

```python
new_cookie_value = "新的 JS 计算结果"

session.cookies.update({
    "key": new_cookie_value
})
```

---

## 9. 响应内容的处理

`requests` 常用的响应读取方式有三种：

```text
resp.text
resp.json()
resp.content
```

---

## 9.1 resp.text

读取文本内容：

```python
resp = requests.get(url)

print(resp.text)
```

适用场景：

```text
HTML
纯文本
JSON 字符串的初步检查
```

---

## 9.2 resp.json()

将 JSON 字符串直接转换为 Python 字典或列表：

```python
resp = requests.get(url)

data = resp.json()

print(data)
```

工程习惯：在未确认响应内容为 JSON 之前，不应直接调用 `resp.json()`。

正确的调试流程：

```python
resp = requests.get(url)
print(resp.text)

# 确认内容确为 JSON 后，再执行转换
data = resp.json()
```

若 `resp.json()` 抛出异常，应第一时间打印：

```python
print(resp.text)
```

核查实际返回内容，而非优先怀疑 Python 或 `requests` 本身。

---

## 9.3 resp.content

读取字节内容：

```python
resp = requests.get(url)
content = resp.content
```

适用场景：

```text
图片
视频
音频
压缩包
PDF
其他二进制文件
```

文件下载：

```python
import requests

url = "https://example.com/a.jpg"
resp = requests.get(url)

with open("a.jpg", "wb") as f:
    f.write(resp.content)
```

---

## 9.4 建立溯源意识

爬虫调试的核心原则：

```text
具备溯源能力
```

即：代码出现异常时，不应只关注最终报错信息，而应沿数据链路向上追溯来源。标准排查顺序：

```text
请求 URL 是否正确
请求方式是否正确
请求头是否正确
参数位置是否正确
参数格式是否正确
Cookie 是否正确
响应内容的实际形态
解析方式是否匹配响应内容
```

---

## 10. 抓取效率优化

当请求规模扩大时，单线程爬虫的性能瓶颈会非常明显。主流提速方案：

```text
多线程
多进程
协程
```

---

## 10.1 多线程

多线程适用于大量相同或相似的 IO 任务，例如批量请求网页、批量下载图片。

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

生产环境更推荐使用线程池：

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
适合网络请求等 IO 密集型任务
接口简单
可精确控制并发数量
```

---

## 10.2 多进程

多进程适用于任务之间相互独立或 CPU 密集型的场景。

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
进程间隔离性更强
资源开销大于线程
适合重计算或完全独立的任务
```

---

## 10.3 协程

协程的核心思想：

```text
任务在 IO 等待期间主动让出执行权，切换至其他任务
最大化单线程内的资源利用率
```

爬虫场景常用库：

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

文件下载：

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

旧式写法：

```python
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
```

现代 Python 推荐使用：

```python
asyncio.run(main())
```

---

## 11. 数据存储

数据采集完成后，应根据数据形态选择合适的存储方式：

```text
CSV
MySQL
文件下载
```

---

## 11.1 CSV 存储

CSV 本质是纯文本格式，不应与 Excel 二进制格式混为一谈。

基础写法：

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
    host="数据库地址",
    port=3306,
    user="用户名",
    password="密码",
    database="目标数据库",
    charset="utf8mb4"
)

try:
    cursor = conn.cursor()

    sql = "INSERT INTO 表名(字段1, 字段2) VALUES(%s, %s)"
    cursor.execute(sql, ("参数1", "参数2"))

    conn.commit()
except Exception as e:
    conn.rollback()
    print(e)
finally:
    cursor.close()
    conn.close()
```

关键要点：

```text
execute() 负责执行 SQL
参数禁止手动拼接，统一使用 %s 占位符防注入
conn.commit() 提交事务，未提交则数据不会写入
异常时通过 conn.rollback() 回滚
结束时关闭游标与连接
```

---

## 11.3 文件下载

下载图片、视频、压缩包等二进制文件时，写入模式必须使用 `wb`。

```python
import requests

url = "https://example.com/file.zip"
resp = requests.get(url)

with open("file.zip", "wb") as f:
    f.write(resp.content)
```

核心原则：

```text
文本数据      -> w / encoding
二进制数据    -> wb
```

---

## 12. 爬虫问题排查思路

爬虫异常的根源通常不是代码语法错误，而是请求与浏览器行为不一致。建议严格按照以下顺序排查。

---

## 12.1 第一步：确认数据来源

```text
页面源代码中是否存在？
Network 接口中是否存在？
是否为 JS 执行后才产生？
是否依赖用户操作才触发请求？
```

---

## 12.2 第二步：确认请求信息

```text
URL 是否一致
GET / POST 是否一致
Query 参数是否一致
Form Data 或 Request Payload 是否一致
Content-Type 是否一致
```

---

## 12.3 第三步：确认请求头

重点核查：

```text
User-Agent
Referer
Cookie
Content-Type
Accept
```

---

## 12.4 第四步：确认响应内容

不应在核查前直接进行解析。先打印：

```python
print(resp.status_code)
print(resp.text)
```

再逐项判断：

```text
是否返回登录页？
是否返回验证码页？
是否为 403？
是否为空数据？
接口是否报错？
是否返回 HTML 而非 JSON？
```

---

## 12.5 第五步：核查解析逻辑

```text
正则是否因贪婪匹配而越界？
XPath 是否误基于 Elements 结构编写？
bs4 选择器是否无法命中？
JSON 字段路径是否已变更？
```

---

## 13. 常用代码模板

以下模板覆盖高频场景，可直接作为项目起点。

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

本文的完整知识脉络：

```text
网页如何加载
    ↓
数据在哪里
    ↓
如何用 DevTools 定位请求
    ↓
如何理解 HTTP 请求与响应
    ↓
如何用 requests 模拟请求
    ↓
如何保持 Cookie 与 Session
    ↓
如何解析 HTML 或 JSON
    ↓
如何提高抓取效率
    ↓
如何保存数据
```

工程实践中的标准作业流程：

```text
1. 打开网页，确认数据是否位于页面源代码中
2. 若不在源代码中，于 Network 面板定位 Ajax 接口
3. 核实请求方式、URL、参数、请求头、Cookie
4. 使用 requests 复现请求
5. 先打印 resp.text，确认响应内容正确
6. 依据响应格式选择 json()、XPath、bs4 或正则解析
7. 数据量大时使用线程池、进程或协程优化吞吐
8. 按数据形态选择 CSV、MySQL 或文件存储
```

最后重申本文的核心观点：

> 爬虫的本质不是"复制浏览器请求"，而是理解浏览器到底发了什么，再用 Python 稳定复现这个过程。

如果这份总结对你有帮助，欢迎点赞、收藏、转发，也欢迎在评论区交流你遇到的爬虫难题。我是小马不起床，我们下期见。
