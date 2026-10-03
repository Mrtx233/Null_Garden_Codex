---
title: "DrissionPage 专题：定位、用法详解与工具对比"
description: "这是爬虫系列的进阶专题。在前两篇中，我们梳理了 requests 体系与 Selenium / Playwright 的选型逻辑。但在实际项目里，很多读者反馈同样的问题：Selenium 驱动管理麻烦、Playwright 部署笨重、requests 拿不到动态数据。本文介绍一个在国内爬虫圈使用率上升很快的工具——DrissionPage，重点讲清它的定位、"
tags:
  - "Python"
  - "DrissionPage"
  - "浏览器自动化"
---

# DrissionPage 专题：定位、用法详解与工具对比

大家好，我是小马不起床。

这是爬虫系列的进阶专题。在前两篇中，我们梳理了 requests 体系与 Selenium / Playwright 的选型逻辑。但在实际项目里，很多读者反馈同样的问题：Selenium 驱动管理麻烦、Playwright 部署笨重、requests 拿不到动态数据。本文介绍一个在国内爬虫圈使用率上升很快的工具——**DrissionPage**，重点讲清它的定位、详细用法，以及它与现有工具的真实差距。

---

## 目录

1. DrissionPage 是什么
2. 核心设计：一个库，两种形态
3. 安装与最小可用示例
4. 与 requests / Selenium / Playwright 的横向对比
5. DrissionPage 的优点
6. DrissionPage 的缺点与限制
7. 用法详解（一）：浏览器配置 ChromiumOptions
8. 用法详解（二）：接管已有浏览器与反检测
9. 用法详解（三）：元素定位语法
10. 用法详解（四）：元素操作
11. 用法详解（五）：等待机制
12. 用法详解（六）：标签页管理
13. 用法详解（七）：滚动、截图与页面信息
14. 用法详解（八）：网络监听 listen——真正的杀手锏
15. 用法详解（九）：fetch 在浏览器内发请求
16. 用法详解（十）：SessionPage 纯 HTTP 模式
17. 用法详解（十一）：WebPage 双模式协同
18. 实战案例：滚动加载页面 + 接口直采
19. 常见问题 FAQ
20. 选型结论

---

## 1. DrissionPage 是什么

DrissionPage 是一个国产的 Python Web 自动化与采集库（GitHub 作者 g1879），名字来自 **D**riven + **Ssion**（浏览器驱动）+ **Page**（页面）的组合概念，官方将其定义为"基于 py 的网页自动化程序"。

它与 Selenium 最大的区别在于技术路线：

```text
Selenium：代码 -> WebDriver 协议 -> 浏览器驱动(chromedriver) -> 浏览器
DrissionPage：代码 -> CDP(Chrome DevTools Protocol) -> 浏览器
```

也就是说，DrissionPage **不需要任何浏览器驱动二进制文件**。它直接通过 Chrome DevTools 协议控制浏览器——这与 Playwright 的路线类似，但 API 设计更贴近中文开发者的使用习惯，且把"浏览器控制"与"HTTP 收发"统一进了一个库。

支持范围：

```text
浏览器内核：仅 Chromium 系（Chrome、Edge 等）
Python 版本：v4 要求 Python 3.8+
开源协议：MIT，免费
```

---

## 2. 核心设计：一个库，两种形态

DrissionPage 提供了三个页面对象，这是理解它的关键：

| 对象 | 能力 | 类比 |
| --- | --- | --- |
| `ChromiumPage` | 只控制浏览器，渲染页面、模拟操作 | Selenium 的 driver |
| `SessionPage` | 只收发 HTTP 数据，不启动浏览器 | requests 的 session |
| `WebPage` | 前两者结合，可在两种模式间切换 | 独特的设计 |

设计意图非常清晰：

```text
数据在 HTML 里 -> SessionPage 就够了（快）
数据必须 JS 渲染或需要交互 -> 换 ChromiumPage（稳）
同一站点先登录后采集 -> WebPage 一个对象贯穿到底
```

这一点与系列第 02 篇讲的"选择路线"完全吻合：DrissionPage 相当于把 requests + Playwright 两条路线合并进了一个 API 体系，且两套 API 的元素定位、对象命名保持了一致性，学习一次两种模式通用。

---

## 3. 安装与最小可用示例

安装：

```bash
pip install -U DrissionPage
```

浏览器控制最小示例：

```python
from DrissionPage import ChromiumPage

page = ChromiumPage()
page.get('https://www.baidu.com')

page.ele('#kw').input('DrissionPage')
page.ele('#su').click()

print(page.title)
print(page.eles('tag:h5'))
```

纯 HTTP 模式最小示例：

```python
from DrissionPage import SessionPage

page = SessionPage()
page.get('https://example.com')

print(page.html)
title = page.ele('#data .title').text
```

注意两点：

```text
1. ChromiumPage() 无参构造会自动查找本机 Chrome/Edge，无需安装任何驱动
2. SessionPage 的 ele() 使用的是同一套定位语法，返回的是纯 HTTP 元素对象
```

---

## 4. 与 requests / Selenium / Playwright 的横向对比

| 对比维度 | requests | Selenium | Playwright | DrissionPage |
| --- | --- | --- | --- | --- |
| 本质 | HTTP 请求库 | 浏览器自动化 | 浏览器自动化 | 浏览器自动化 + HTTP 二合一 |
| 执行 JS | 否 | 是 | 是 | 是 |
| 是否需要驱动/独立运行时 | 否 | 是（chromedriver 等） | 需安装浏览器包 | 否（直连本机 Chrome/Edge） |
| 支持的浏览器 | 不涉及 | Chrome/Firefox/Edge/Safari | Chromium/Firefox/WebKit | 仅 Chromium 系 |
| 元素等待 | 不涉及 | 需手写显式等待 | 自动等待 | 自动等待（timeout 参数） |
| 抓包 / 监听接口 | 需配合 DevTools 手动分析 | 需借助 HAR 或插件 | 原生 network 监听 | 原生 `listen`，语法极简 |
| 跨语言生态 | 全语言 | 全语言，生态最大 | 多语言，增长快 | Python 为主 |
| 文档与社区语言 | 英文 | 英文为主，中文丰富 | 英文为主 | **中文第一手文档** |
| 反检测难度 | 无浏览器特征 | webdriver 痕迹明显 | 特征较少 | 特征少，可直连用户日常浏览器 |
| 轻量程度 | 最轻 | 重 | 较重 | 中（无驱动是显著减负） |
| 分布式 / Grid | 不涉及 | 成熟方案 | 需自建 | 无成熟方案 |

结论性判断：

```text
纯接口能解决的，DrissionPage 的 SessionPage 与 requests 差距不大，没必要为此上浏览器；
需要浏览器的场景里，DrissionPage 相对 Selenium 的部署减负是真实存在的——
不用管理驱动版本、不用处理 driver 与浏览器版本匹配问题；
相对 Playwright，减负体现在可直连用户已安装的 Chrome，
而 Playwright 通常需要下载其管理的浏览器构建。
```

---

## 5. DrissionPage 的优点

```text
1. 无驱动架构：不依赖 chromedriver，不存在驱动与浏览器版本匹配问题
2. 双形态统一：一个库覆盖 HTTP 与浏览器两条采集路线，定位语法通用
3. API 简洁：定位、交互、等待的接口数量明显少于 Selenium，学习曲线平缓
4. 自动等待：ele() 自带 timeout 参数，默认等待元素出现，减少手写等待代码
5. 抓包极简：listen 系列接口可直接捕获浏览器发出的 Ajax 请求与响应
6. 可接管已有浏览器：复用真实用户环境的登录态、扩展与指纹，反检测友好
7. 中文文档完善：官方文档为中文，是国内一手学习资料，入门门槛低
8. 元素定位语法统一：id、class、tag、文本、属性、CSS、XPath 一套前缀语法全覆盖
9. 安装轻量：pip 一条命令，不强制下载浏览器
10. 迭代活跃：版本更新频率高，对新版 Chrome 的适配及时
```

---

## 6. DrissionPage 的缺点与限制

选型必须同时看另一面，以下问题是真实存在的：

```text
1. 内核受限：v4 仅支持 Chromium 系，无法覆盖 Firefox / Safari 测试需求
2. 生态规模：社区体量远小于 Selenium / Playwright，
   英文资料几乎没有，海外团队协作场景受限
3. 大规模调度：没有官方 Grid / 分布式方案，
   上百浏览器实例的集群需要自行搭建
4. API 破坏性变更：3.x 到 4.x 为彻底重写，接口不兼容，
   网络上的旧教程大量失效，学习时务必对齐官方 v4 文档
5. 资源消耗：本质仍是驱动完整浏览器，
   内存与 CPU 开销与 Playwright / Selenium 同一量级，并不"轻量运行"
6. 依赖 CDP：与 Playwright 同样依赖 DevTools 协议，
   浏览器厂商若收紧协议暴露，需要跟进适配
7. 纯 HTTP 模式：SessionPage 功能面窄于 requests 生态
   （连接池精细控制、事件钩子等），复杂 HTTP 场景仍以 requests/httpx 为主
8. 适用面：企业级跨浏览器兼容性测试、移动端 WebView 自动化并非它的主场
```

一句话定位：

```text
DrissionPage 是"个人与小团队做采集与自动化"的高性价比选择，
不是 Selenium/Playwright 在全领域的替代品。
```

---

## 7. 用法详解（一）：浏览器配置 ChromiumOptions

`ChromiumOptions` 用于控制浏览器的启动行为，配置完成后传给 `ChromiumPage`：

```python
from DrissionPage import ChromiumPage, ChromiumOptions

co = ChromiumOptions()

# 指定浏览器路径（自动查找失败时使用）
co.set_browser_path(r'C:\Program Files\Google\Chrome\Application\chrome.exe')

# 无头模式（后台运行，不显示窗口）
co.set_headless()

# 指定调试端口与用户数据目录（多实例隔离的关键）
co.set_local_port(9222)
co.set_user_data_path(r'D:\chrome_data')

# 设置代理
co.set_proxy('127.0.0.1:7897')

# 窗口尺寸
co.set_argument('--window-size=1920,1080')

# 指定下载目录（通过 Chrome 启动参数实现）
co.set_argument('--download.default_directory=D:/downloads')

page = ChromiumPage(co)
```

ChromiumOptions 的方法均支持链式调用：

```python
page = ChromiumPage(ChromiumOptions().set_headless().set_local_port(9333))
```

各配置项的使用场景：

```text
set_browser_path    本机有多个浏览器或自动查找失败时
set_headless        服务器部署、不想弹窗干扰
set_user_data_path  每个采集任务使用独立用户目录，避免会话串扰与端口冲突
set_proxy           代理出口控制，配合 IP 池
set_argument        所有未被封装的 Chrome 启动参数都可以透传
```

---

## 8. 用法详解（二）：接管已有浏览器与反检测

这是 DrissionPage 在反爬对抗中最实用的能力。思路是：**不启动新浏览器，而是连接一个你已经在用的真实浏览器。**

第一步，以调试端口启动本机 Chrome（命令行）：

```bash
chrome.exe --remote-debugging-port=9222 --user-data-dir="D:\chrome_profile"
```

第二步，让 DrissionPage 直接接管：

```python
from DrissionPage import ChromiumPage

page = ChromiumPage('127.0.0.1:9222')
```

接管之后的效果：

```text
1. 浏览器指纹是真实用户环境的指纹
2. 已登录的账号状态、Cookie、扩展全部复用
3. 不存在新启动浏览器的自动化初始化痕迹
```

这套方案的常见用法是：人工完成一次登录（包括验证码、扫码），之后脚本在同一浏览器内持续采集，登录态无需任何搬运。

必须提醒的边界：

```text
接管真实浏览器能显著降低被识别的概率，但不等于免检。
风控对抗是动态博弈，任何工具的宣传都不能替代你自己的请求行为设计
（频率、随机性、行为路径合理性）。
```

---

## 9. 用法详解（三）：元素定位语法

DrissionPage v4 使用统一的前缀语法，`ele()` 返回首个匹配元素，`eles()` 返回列表：

```python
page.ele('#id')                  # 按 id
page.ele('.item')                # 按 class
page.ele('tag:a')                # 按标签名
page.ele('@name=kw')             # 按属性精确匹配
page.ele('@@class=btn')          # 按属性包含匹配
page.ele('text:下一页')           # 按文本内容包含匹配
page.ele('css:div.item > a')     # 按 CSS 选择器
page.ele('xpath://div[@id="x"]') # 按 XPath
```

语法可组合，逐步收窄：

```python
page.eles('tag:div@@class=item')     # div 标签且 class 含 item
page.ele('text:登录 css:div > a')    # 文本含"登录"且匹配 CSS 路径
```

相对定位（在元素内部继续查找）：

```python
container = page.ele('.list')
links = container.eles('tag:a')      # 只在该容器内查找
```

定位失败时的行为：

```text
ele()  找不到时默认返回 None（设置 timeout 会先等待再返回）
eles() 找不到时返回空列表
```

这套语法的价值在于**同一字符串在 SessionPage、ChromiumPage、元素内部查找中完全通用**，切换到浏览器模式时不需要重写选择器。

---

## 10. 用法详解（四）：元素操作

读取信息：

```python
ele = page.ele('.title')

ele.text              # 文本内容
ele.attr('href')      # 属性值
ele.attrs             # 全部属性字典
ele.html              # 外部 HTML
ele.inner_html        # 内部 HTML
ele.tag               # 标签名
ele.states.is_displayed   # 是否可见
ele.states.is_enabled     # 是否可用
```

交互动作：

```python
ele.click()                     # 点击（默认先滚动到可视区域）
ele.click(by_js=True)           # JS 点击，绕过遮挡
ele.input('关键词')              # 输入文本，默认先清空
ele.input('追加内容', clear=False)
ele.hover()                     # 悬停
ele.select('选项文本')           # 下拉框选择
```

文件上传（对 `input[type=file]` 直接传入路径）：

```python
page.ele('tag:input@type=file').input(r'D:\photo.png')
```

元素级截图：

```python
ele.get_screenshot(path='ele.png')
```

这里体现了 DrissionPage 的一个设计原则：常见动作全部内置了自动等待与滚动到视内的行为，Selenium 中需要 Interaction 封装、ActionChains 处理的大头场景，在这里是一行方法调用。

---

## 11. 用法详解（五）：等待机制

DrissionPage 的等待主要收敛到一处——`ele()` 系列的 `timeout` 参数：

```python
ele = page.ele('#lazy-item', timeout=10)   # 最多等 10 秒
page.wait(2)                                # 显式等待 2 秒（应急用）
```

行为模型：

```text
元素未出现 -> 在 timeout 内持续等待
超时       -> 返回 None（可捕获后续判空处理）
```

这与系列第 02 篇讲的"显式等待优先"原则是一致的，只是 DrissionPage 把显式等待做成了默认路径，开发者不再需要 import 一整套 ExpectedConditions。

页面级控制：

```text
page.set...  系列接口可配置加载等待策略、超时值等全局行为
具体项较多且随版本演进，建议以官方 v4 文档的 Settings 章节为准
```

---

## 12. 用法详解（六）：标签页管理

DrissionPage 将标签页（tab）作为一等公民，每个 tab 是独立的 page 对象：

```python
page.get_tab()                 # 当前标签页对象
page.tab_ids                   # 全部标签页 id
page.latest_tab                # 最新打开的标签页
page.new_tab('https://example.com')   # 新开标签页
page.close_tab(tab)            # 关闭指定标签页
```

典型场景——点击后弹出新窗口继续操作：

```python
page.ele('text:查看详情').click()

tab = page.latest_tab
print(tab.url)
data = tab.ele('.detail').text
```

多标签页并行采集时，按 id 或条件获取目标 tab：

```python
for tab_id in page.tab_ids:
    tab = page.get_tab(tab_id)
    ...
```

---

## 13. 用法详解（七）：滚动、截图与页面信息

滚动：

```python
page.scroll.to_bottom()        # 滚到底部（触发懒加载）
page.scroll.to_top()           # 回到顶部
page.scroll.down(500)          # 向下滚动 500 像素
page.scroll.to_see(ele)        # 滚动使指定元素进入视口
```

截图：

```python
page.get_screenshot(path='page.png', full_page=True)   # 整页截图
page.get_screenshot(path='view.png')                   # 可视区域截图
```

页面信息：

```python
page.url
page.title
page.html          # 当前 DOM 的 HTML（浏览器渲染后）
```

注意与系列第 01 篇的呼应点：`page.html` 是**渲染后**的结构，等价于 DevTools 的 Elements 面板，这一点与 `requests.get()` 拿到的原始源代码有本质区别。

---

## 14. 用法详解（八）：网络监听 listen——真正的杀手锏

第 01 篇讲过，最优采集路径是"找到 Ajax 接口直接请求"。DrissionPage 把这个找接口的过程做成了可编程接口：

```python
page.listen.start('api/list')          # 开始监听，参数为 URL 特征串

page.get('https://example.com/feed')   # 触发请求

packet = page.listen.wait()            # 阻塞等待命中的请求

print(packet.url)                      # 请求地址
print(packet.method)                   # 请求方法
print(packet.request.headers)          # 请求头
print(packet.response.body)            # 响应体（JSON 自动转 dict）

page.listen.stop()                     # 结束监听
```

批量捕获（例如滚动分页场景）：

```python
packets = page.listen.wait(count='all')   # 取出当前已捕获的全部数据包
```

它的实战价值：

```text
1. 逆向分析阶段：不用再手动翻 Network 面板，脚本直接打印全部命中接口
2. 采集阶段：正常驱动页面交互，数据从监听包里直接拿 JSON，
   完全绕开 DOM 解析
3. 参数验证：对比脚本请求与浏览器请求的 header/参数差异，
   排查 403 类问题效率显著提升
```

与 Playwright 的 route/事件监听相比，DrissionPage 的 listen 写法更接近"抓包工具的使用直觉"，是它在采集场景中最受欢迎的功能。

---

## 15. 用法详解（九）：fetch 在浏览器内发请求

`listen` 负责"收"，`fetch` 负责"发"：在浏览器上下文中直接发起请求，自动携带当前页面的会话环境：

```python
res = page.fetch.get('https://example.com/api/list?page=1')

data = res.json()
print(res.status)
print(res.url)
```

适用场景：

```text
接口带签名参数、纯 HTTP 库复现成本过高时，
让浏览器替你完成签名与凭证携带，脚本只管翻页取数。
```

这与第 01 篇"溯源"思想一脉相承：当加密链路难以还原时，"在正确的环境里发正确的请求"是务实的降级方案。

---

## 16. 用法详解（十）：SessionPage 纯 HTTP 模式

SessionPage 是内置的轻量 HTTP 客户端，定位是"不需要浏览器时的默认选择"：

```python
from DrissionPage import SessionPage

page = SessionPage()

page.get('https://example.com')
page.post('https://example.com/api', json={'key': 'value'})

print(page.status)
print(page.html)

# 直接用统一语法提取数据（底层为 parsel 文档树）
for item in page.eles('.item'):
    print(item.text, item.attr('href'))
```

会话与 Cookie 处理：

```python
page.cookies()                    # 查看当前 cookie
```

SessionPage 与 requests 的关系：

```text
能力上约为 requests 的子集 + 内置了统一元素提取语法；
需要精细控制连接池、钩子、重试策略时，仍建议直接使用 requests/httpx；
它的真正价值在于：与 ChromiumPage 完全同构的 API，切换模式零成本。
```

---

## 17. 用法详解（十一）：WebPage 双模式协同

WebPage 将两种形态合并到同一个对象，用模式切换代替两个实例：

```python
from DrissionPage import WebPage

page = WebPage()

# 默认 console 模式：纯 HTTP，快
page.get('https://example.com/login')

# 遇到必须渲染的页面：切到 browser 模式
page.change_mode('browser')
page.get('https://example.com/dashboard')

data = page.ele('.report').text
```

典型工作流：登录、验证码等强交互环节走 browser 模式，批量翻页取数切回 console 模式，兼顾稳定性与吞吐。

---

## 18. 实战案例：滚动加载页面 + 接口直采

综合以上能力，一个"无限滚动 + 接口捕获"的完整采集骨架：

```python
from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions().set_local_port(9222)
page = ChromiumPage(co)

page.listen.start('example.com/api/feed')
page.get('https://example.com/feed')

for i in range(10):
    page.scroll.to_bottom()
    time.sleep(2)                      # 给懒加载留出触发时间

    for packet in page.listen.wait(count='all'):
        data = packet.response.body    # 已经是 dict，无需解析 DOM
        for item in data.get('items', []):
            print(item['id'], item['title'])

page.listen.stop()
```

这段代码的工程含义：

```text
1. 采集目标是接口 JSON，而非 DOM —— 解析层被整体移除
2. 页面只负责"制造合法请求"，数据从监听通道拿走
3. 页面改版不影响脚本，只要接口结构不变
```

这正是第 01 篇方法论（优先找接口）在工具层的最佳落地形态。

---

## 19. 常见问题 FAQ

```text
Q1：提示找不到浏览器？
A：用 co.set_browser_path() 显式指定 Chrome/Edge 可执行文件路径。

Q2：多个脚本同时运行互相干扰？
A：每个实例配置独立的 set_local_port 与 set_user_data_path，
   本质上是隔离调试端口与用户数据目录。

Q3：网上教程的代码跑不通？
A：大概率是 3.x 旧教程。v4 为彻底重写，请只参考官方 v4 文档
   与明确标注 4.x 的资料。

Q4：无头模式下页面渲染不完整？
A：新版无头模式与原窗口渲染基本一致，若异常可显式使用新版 headless
   参数，或退回有头模式配合虚拟显示（Linux 下 xvfb）。

Q5：SessionPage 与 requests 冲突吗？
A：不冲突，且不需要二选一。纯接口体系继续用 requests/httpx，
   DrissionPage 只在需要浏览器或需要统一 API 时进场。
```

---

## 20. 选型结论

回到系列第 02 篇的选择路线，把 DrissionPage 放进去后的完整决策树：

```text
数据在接口里，签名可复现
    -> requests / httpx（不变，成本最低）

数据在接口里，但签名链路复杂、必须依赖浏览器环境
    -> DrissionPage（listen + fetch 组合是显著优势）

页面必须渲染、需要交互，单机或小规模
    -> DrissionPage（无驱动部署减负 + 中文文档 + 反检测友好）
    -> Playwright（需要多内核或团队协作、工程化要求更高时）

需要跨浏览器兼容测试、分布式大规模调度、多语言团队
    -> Playwright / Selenium（生态与工程化仍是天花板）

已有大量 Selenium 存量代码
    -> 维持现状，新模块再评估
```

三句话总结：

> DrissionPage 的本质竞争力是"无驱动 + 双形态 + 原生抓包"。
> 它把爬虫里"浏览器只是接口触发器"的主流场景做到了一站式解决。
> 它的边界在生态与规模：中小规模采集是甜点区，企业级跨浏览器与集群调度仍不是它的主场。

以上是本篇的全部内容。如果你正在被 chromedriver 版本匹配折磨，或者想验证"接口直采"在工作流里怎么落地，强烈建议从第 18 节的案例跑起。觉得有帮助，欢迎点赞、收藏、转发；评论区可以聊聊你正在用的自动化方案和踩过的坑。我是小马不起床，我们下期见。
