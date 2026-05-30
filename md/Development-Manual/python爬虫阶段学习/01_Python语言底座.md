# 第一阶段：Python 语言底座

> 如果把爬虫比作钓鱼，Python 就是你的鱼竿。这一阶段的目标是：**熟练使用 Python，为后续写爬虫打好基础**。
> 不需要一次全记住，先理解，后面写爬虫时再回头查都来得及。

---

## 目录

1. [基础语法与数据结构](#1-基础语法与数据结构)
2. [函数与模块化](#2-函数与模块化)
3. [面向对象编程 (OOP)](#3-面向对象编程-oop)
4. [文件与 I/O 操作](#4-文件与-io-操作)
5. [字符串编码与基础加密](#5-字符串编码与基础加密)

---

## 1. 基础语法与数据结构

### 1.1 变量与基本类型

Python 是**动态类型**语言——你不需要声明类型，直接赋值就行。

```python
# ── 数字 ──
age = 25              # int 整数
price = 3.99          # float 浮点数
complex_num = 1 + 2j  # complex 复数（爬虫中极少用）

# ── 字符串 ──
name = "张三"          # 双引号
city = '北京'          # 单引号（和双引号没区别）
multiline = """
这是多行字符串
可以换行
"""

# ── 布尔值 ──
is_ok = True          # 注意大写 T
is_done = False

# ── type() 查看类型 ──
print(type(age))      # <class 'int'>
print(type(name))     # <class 'str'>

# ── 字符串格式化（爬虫中最常用的几种）──
url = f"https://example.com/page/{age}"  # f-string，Python 3.6+ 推荐
url2 = "https://example.com/page/%d" % age  # % 格式化（老代码常见）
url3 = "https://example.com/page/{}".format(age)  # format 方法
```

### 1.2 核心数据结构

Python 有四种内置数据结构，爬虫中**天天用**。

#### 列表（List）——有序、可重复、可修改

```python
# 创建
cities = ["北京", "上海", "广州", "深圳"]

# 增
cities.append("杭州")        # 末尾追加 → ["北京", "上海", "广州", "深圳", "杭州"]
cities.insert(1, "南京")     # 指定位置插入 → ["北京", "南京", "上海", "广州", "深圳", "杭州"]

# 删
cities.remove("南京")        # 按值删除
popped = cities.pop()        # 弹出末尾 → popped = "杭州", cities 少一个
del cities[0]                # 按索引删除 → 删除"北京"

# 改
cities[0] = "重庆"           # 把第一个元素改成"重庆"

# 查
first = cities[0]            # 索引（从 0 开始）
last = cities[-1]            # 负数索引：最后一个
slice_ = cities[1:3]         # 切片 → [索引1, 索引3) 左闭右开
has_shanghai = "上海" in cities  # True

# 遍历
for city in cities:
    print(city)

# 列表推导式（重要！爬虫中大量使用）
numbers = [1, 2, 3, 4, 5]
squared = [n * n for n in numbers]       # → [1, 4, 9, 16, 25]
evens = [n for n in numbers if n % 2 == 0]  # → [2, 4]

# 常用于从解析结果中批量提取数据
# 比如：urls = [item['href'] for item in items if item.get('href')]
```

#### 元组（Tuple）——有序、可重复、**不可修改**

```python
# 一旦创建就不能改！适合存固定数据
colors = ("红", "绿", "蓝")

# 访问和列表一样
print(colors[0])  # 红

# 不能修改：colors[0] = "黄"  ← 会报错

# 常用场景：函数返回多个值（本质就是元组）
def get_user():
    return "张三", 25  # 自动包装成元组

name, age = get_user()  # 解包
```

> **元组 vs 列表**：能确定不会变的数据用元组（更安全、轻微性能优势），会变的数据用列表。

#### 字典（Dict）——键值对，**爬虫中最核心的数据结构**

```python
# 创建
person = {
    "name": "张三",
    "age": 25,
    "city": "北京"
}

# 增／改
person["phone"] = "138xxxx"   # 键不存在就新增
person["age"] = 26            # 键存在就修改

# 删
del person["phone"]            # 删除指定键
person.pop("city")             # 删除并返回值

# 查
name = person["name"]           # 键不存在会报错
name = person.get("name")       # 安全获取，不存在返回 None
name = person.get("name", "默认值")

# 判断键是否存在
if "name" in person:
    print("name 存在")

# 遍历
for key in person:              # 遍历所有键
    print(key, person[key])

for key, value in person.items():  # 同时遍历键和值
    print(key, value)

for value in person.values():   # 只遍历值
    print(value)

# 字典推导式
squared = {x: x*x for x in range(5)}  # → {0: 0, 1: 1, 2: 4, 3: 9, 4: 9}

# 爬虫实战场景：构造请求参数
params = {
    "page": 1,
    "limit": 20,
    "keyword": "手机"
}
# requests.get(url, params=params)

# 爬虫实战场景：解析 JSON（API 返回的数据几乎都是 JSON → 自动变成字典）
# json_data = response.json()
# print(json_data["data"]["items"])
```

#### 集合（Set）——无序、不重复、**去重神器**

```python
# 创建
ids = {1, 2, 3, 3, 2}     # → {1, 2, 3}  自动去重！
empty_set = set()          # 空集合不能写 {}，那是空字典

# 增删
ids.add(4)
ids.remove(1)              # 元素不存在会报错
ids.discard(10)            # 安全删除，不存在也不报错

# 常用操作（爬虫去重）
visited_urls = set()
new_url = "https://example.com/page/1"

if new_url not in visited_urls:
    # 抓取这个页面
    visited_urls.add(new_url)

# 集合运算（了解即可）
a = {1, 2, 3}
b = {3, 4, 5}
print(a & b)  # 交集 → {3}
print(a | b)  # 并集 → {1, 2, 3, 4, 5}
print(a - b)  # 差集 → {1, 2}
```

### 1.3 控制流

```python
# ── if-elif-else ──
status_code = 200

if status_code == 200:
    print("请求成功")
elif status_code == 404:
    print("页面不存在")
elif status_code == 500:
    print("服务器错误")
else:
    print("其他状态码")

# 三元表达式（简洁的条件判断）
result = "成功" if status_code == 200 else "失败"

# ── for 循环（最常用）──
for i in range(5):          # range(5) → 0,1,2,3,4
    print(i)

for i in range(2, 5):       # range(开始, 结束) → 2,3,4
    print(i)

# 爬虫常用：翻页
for page in range(1, 11):
    url = f"https://example.com/list?page={page}"
    print(f"正在抓取第 {page} 页: {url}")

# enumerate：同时拿索引和值
cities = ["北京", "上海", "广州"]
for idx, city in enumerate(cities):
    print(f"{idx}: {city}")

# ── while 循环 ──
count = 0
while count < 3:
    print(f"第 {count+1} 次尝试")
    count += 1

# 爬虫实战：重试机制
max_retries = 3
attempt = 0
while attempt < max_retries:
    try:
        # 假装发送请求
        # response = requests.get(url)
        # if response.status_code == 200:
        #     break
        pass
    except Exception:
        print(f"第 {attempt+1} 次失败，重试中...")
        attempt += 1

# ── break / continue ──
for i in range(10):
    if i == 3:
        continue        # 跳过本次循环（不打印 3）
    if i == 7:
        break           # 提前结束循环（到 7 就停）
    print(i)
```

---

## 2. 函数与模块化

### 2.1 函数定义与参数传递

```python
# ── 基本定义 ──
def greet(name):
    """传入名字，返回问候语"""   # 文档字符串（docstring）
    return f"你好，{name}！"

print(greet("张三"))  # 你好，张三！

# ── 默认参数 ──
def fetch_page(url, timeout=10):
    print(f"正在请求: {url}，超时设置: {timeout}s")
    # 模拟请求...

fetch_page("https://example.com")           # timeout 用默认值 10
fetch_page("https://example.com", 30)       # timeout=30
fetch_page("https://example.com", timeout=5)  # 显式指定

# ── 可变参数 *args ──（收集多个位置参数成元组）
def log_urls(*urls):
    for url in urls:
        print(f"URL: {url}")

log_urls("a.com", "b.com", "c.com")

# ── 关键字参数 **kwargs ──（收集多个关键字参数成字典）
def make_request(**kwargs):
    print(f"参数: {kwargs}")
    # kwargs["url"]、kwargs["method"] ...

make_request(url="https://example.com", method="GET", timeout=10)

# ── 爬虫实战：通用请求函数 ──
def safe_request(url, method="GET", retries=3, **kwargs):
    """一个带重试的安全请求函数"""
    for i in range(retries):
        try:
            print(f"[{i+1}/{retries}] 正在请求 {url}")
            # response = requests.request(method, url, **kwargs)
            # if response.status_code == 200:
            #     return response
            pass
        except Exception as e:
            print(f"请求失败: {e}")
            if i == retries - 1:
                raise  # 最后一次还失败，抛出异常
    return None
```

### 2.2 作用域（LEGB 规则）

Python 寻找变量时按这个顺序查找：
**L**ocal（局部）→ **E**nclosing（外层函数的局部）→ **G**lobal（全局）→ **B**uilt-in（内置）

```python
x = "全局 x"  # Global 作用域

def outer():
    x = "外层 x"  # Enclosing 作用域

    def inner():
        x = "内层 x"  # Local 作用域
        print(x)  # 内层 x

    inner()

outer()

# ── global 关键字 ──
count = 0

def increment():
    global count  # 声明要修改全局变量
    count += 1

increment()
print(count)  # 1

# ── nonlocal 关键字 ──（修改外层函数的变量）
def outer():
    n = 0
    def inner():
        nonlocal n
        n += 1
        return n
    return inner

counter = outer()
print(counter())  # 1
print(counter())  # 2
```

### 2.3 匿名函数（lambda）与高阶函数

```python
# ── lambda ──
# 格式：lambda 参数: 返回值
double = lambda x: x * 2
print(double(5))  # 10

# 其实就是：
def double(x):
    return x * 2

# ── map ──（对每个元素执行操作）
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))  # [2, 4, 6, 8]
# 列表推导式更直观：[x * 2 for x in nums]

# ── filter ──（过滤符合条件的元素）
evens = list(filter(lambda x: x % 2 == 0, nums))  # [2, 4]
# 列表推导式：[x for x in nums if x % 2 == 0]

# ── reduce ──（累积计算）
from functools import reduce
total = reduce(lambda a, b: a + b, nums)  # 10 (1+2+3+4)

# ── sorted（按自定义规则排序）──
students = [
    {"name": "张三", "score": 85},
    {"name": "李四", "score": 92},
    {"name": "王五", "score": 78},
]
ranked = sorted(students, key=lambda s: s["score"], reverse=True)
# 按分数从高到低排序
```

### 2.4 闭包与装饰器（爬虫重点）

#### 闭包——函数内定义函数，且内部函数引用了外部函数的变量

```python
def make_counter(start=0):
    """创建一个计数器，每次调用 +1"""
    count = start
    def counter():
        nonlocal count
        count += 1
        return count
    return counter  # 返回内部函数（还没执行）

c1 = make_counter(10)
print(c1())  # 11
print(c1())  # 12

c2 = make_counter(0)
print(c2())  # 1
print(c1())  # 13  ← c1 和 c2 互不影响

# 爬虫实战：闭包用于创建带状态的函数
def create_url_builder(base_url):
    """创建一个能自动拼接 URL 的函数"""
    def builder(path):
        return f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    return builder

build = create_url_builder("https://api.example.com")
print(build("users"))       # https://api.example.com/users
print(build("items/123"))   # https://api.example.com/items/123
```

#### 装饰器——给函数"加功能"而不修改函数本身

```python
# ── 最简单的装饰器 ──
def log_time(func):
    """打印函数执行时间"""
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} 执行了 {end-start:.3f} 秒")
        return result
    return wrapper

@log_time  # 相当于：fetch_data = log_time(fetch_data)
def fetch_data():
    import time
    time.sleep(1)  # 模拟网络请求
    return "数据"

fetch_data()  # 输出：fetch_data 执行了 1.001 秒
```

**爬虫中装饰器最常用的两个场景：**

```python
# ── 场景 1：重试机制 ──
import time

def retry(max_attempts=3, delay=1):
    """请求失败时自动重试的装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for i in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"第 {i+1} 次失败: {e}")
                    if i == max_attempts - 1:
                        raise  # 最后一次还失败，抛出
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def fetch_url(url):
    print(f"请求: {url}")
    # 模拟请求失败
    raise ConnectionError("网络错误")

# fetch_url("https://example.com")  # 会重试 3 次

# ── 场景 2：日志记录 ──
def log_request(func):
    """记录每次请求的 URL"""
    def wrapper(*args, **kwargs):
        url = args[0] if args else kwargs.get("url", "未知")
        print(f"[{__import__('datetime').datetime.now()}] 请求: {url}")
        return func(*args, **kwargs)
    return wrapper

@log_request
def download_page(url):
    print(f"下载中: {url}")

download_page("https://example.com")
```

> **理解小技巧**：装饰器就是在函数外面包了一层，@语法糖只是让写法更优雅。`@retry` 本质就是 `fetch_url = retry(fetch_url)`。

---

## 3. 面向对象编程 (OOP)

### 3.1 类与对象

```python
class Spider:
    """爬虫类——写爬虫的基本单位"""
    # 类属性（所有实例共享）
    name = "基础爬虫"
    version = "1.0"

    def __init__(self, base_url, timeout=10):
        """构造方法：创建对象时自动调用"""
        self.base_url = base_url     # 实例属性
        self.timeout = timeout
        self.visited_urls = set()    # 已访问的 URL（用于去重）

    def fetch(self, path):
        """请求方法"""
        url = f"{self.base_url}{path}"
        print(f"正在请求: {url}，超时: {self.timeout}s")
        # 这里实际可以用 requests 库请求
        return f"<html>{url} 的内容</html>"

    def parse(self, html):
        """解析方法（子类会重写）"""
        print("解析 HTML...")
        return []

    def run(self, paths):
        """运行爬虫"""
        results = []
        for path in paths:
            if path in self.visited_urls:
                continue  # 去重
            html = self.fetch(path)
            data = self.parse(html)
            results.extend(data)
            self.visited_urls.add(path)
        return results

# 创建对象
my_spider = Spider("https://example.com")
result = my_spider.run(["/page1", "/page2"])
print(my_spider.name)       # 基础爬虫
print(my_spider.visited_urls)  # {'/page1', '/page2'}
```

### 3.2 封装、继承、多态

#### 封装——把数据和操作数据的方法打包在类里

```python
class Downloader:
    """下载器——封装请求逻辑"""
    def __init__(self):
        self._headers = {   # _ 开头表示"私有"（约定，不是强制）
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html"
        }
        self._timeout = 10

    def set_user_agent(self, ua):
        """通过方法修改 User-Agent（而不是直接改 _headers）"""
        self._headers["User-Agent"] = ua

    def download(self, url):
        """公开的下载方法"""
        print(f"下载: {url}")
        print(f"使用 Headers: {self._headers}")
        return "页面内容"

d = Downloader()
d.set_user_agent("GoogleBot/2.1")
d.download("https://example.com")
```

#### 继承——父类的功能，子类直接拿来用

```python
class BaseSpider:
    """基础爬虫——所有爬虫的父类"""
    def __init__(self, base_url):
        self.base_url = base_url

    def fetch(self, path):
        url = f"{self.base_url}{path}"
        print(f"[基础爬虫] 请求: {url}")
        return f"{url} 的原始内容"

    def parse(self, html):
        """子类必须重写这个方法"""
        raise NotImplementedError("子类必须实现 parse 方法")

    def run(self, path):
        html = self.fetch(path)
        return self.parse(html)


class MovieSpider(BaseSpider):
    """电影爬虫——继承 BaseSpider"""
    def __init__(self, base_url, category="热门"):
        super().__init__(base_url)   # 调用父类的 __init__
        self.category = category

    def parse(self, html):
        """重写父类的 parse 方法"""
        print(f"[电影爬虫] 解析: {html}")
        # 假装解析出了电影列表
        return [
            {"title": "电影A", "score": 9.2},
            {"title": "电影B", "score": 8.7},
        ]


class BookSpider(BaseSpider):
    """书籍爬虫——继承 BaseSpider"""
    def parse(self, html):
        """不同的解析逻辑"""
        print(f"[书籍爬虫] 解析: {html}")
        return [
            {"title": "书A", "author": "作者甲"},
            {"title": "书B", "author": "作者乙"},
        ]


# 使用——同样的 run 方法，不同子类有不同行为（这就是多态）
movie = MovieSpider("https://movie.example.com")
books = BookSpider("https://book.example.com")

movie.run("/top250")
books.run("/bestsellers")
```

#### 多态——同一个方法名，不同对象有不同实现

```python
# 上面的例子已经是多态了
spiders = [
    MovieSpider("https://movie.example.com"),
    BookSpider("https://book.example.com"),
]

for spider in spiders:
    # 不关心具体是哪个子类，统一调用 run 就行
    # 每个 spider 的 run 会调用各自重写后的 parse
    print(spider.run("/list"))
```

### 3.3 魔术方法

```python
class Request:
    """模拟一个 HTTP 请求对象"""
    def __init__(self, url, method="GET"):
        self.url = url
        self.method = method
        self.headers = {}

    def __str__(self):
        """print() 时显示的内容"""
        return f"[{self.method}] {self.url}"

    def __repr__(self):
        """在列表等容器中显示的内容"""
        return self.__str__()

    def __call__(self):
        """让对象像函数一样被调用"""
        print(f"执行请求: {self.method} {self.url}")
        return f"响应内容"

    def __len__(self):
        """len() 返回的值"""
        return len(self.url)

    def __eq__(self, other):
        """== 比较两个对象"""
        return self.url == other.url and self.method == other.method


req1 = Request("https://example.com/api")
req2 = Request("https://example.com/api")
req3 = Request("https://other.com")

print(req1)              # 调用 __str__ → [GET] https://example.com/api
print(req1 == req2)      # 调用 __eq__ → True
print(req1 == req3)      # False

# __call__ 的妙用
response = req1()        # 像函数一样调用 → 执行请求: GET https://example.com/api

# 爬虫中 __call__ 常用于中间件
class ProxyMiddleware:
    def __init__(self, proxies):
        self.proxies = proxies
        self.index = 0

    def __call__(self, request):
        """每次请求自动轮换代理 IP"""
        proxy = self.proxies[self.index % len(self.proxies)]
        self.index += 1
        print(f"使用代理: {proxy}")
        return proxy

proxy_rotator = ProxyMiddleware(["ip1:8080", "ip2:8080", "ip3:8080"])
proxy_rotator("请求对象")  # 调用 __call__
proxy_rotator("请求对象")
```

### 3.4 实战：封装一个简单的爬虫类

```python
import json
from datetime import datetime

class SimpleCrawler:
    """一个简单但完整的爬虫类"""

    def __init__(self, name, base_url, headers=None):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.headers = headers or {}
        self.results = []
        self.logs = []

    def _log(self, message):
        """记录日志（内部方法）"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log = f"[{timestamp}] {message}"
        self.logs.append(log)
        print(log)

    def fetch(self, path):
        """发送请求"""
        url = f"{self.base_url}/{path.lstrip('/')}"
        self._log(f"请求: {url}")
        # 实际爬虫这里会调用 requests.get(url, headers=self.headers)
        # 这里模拟返回
        return f'{{"data": "模拟响应内容", "url": "{url}"}}'

    def parse(self, raw_data):
        """解析响应"""
        self._log("解析数据...")
        return json.loads(raw_data)

    def save(self, filename="output.json"):
        """保存结果到文件"""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        self._log(f"已保存 {len(self.results)} 条数据到 {filename}")

    def run(self, paths):
        """运行爬虫"""
        self._log(f"爬虫 [{self.name}] 开始运行")

        for path in paths:
            raw = self.fetch(path)
            data = self.parse(raw)
            self.results.append(data)

        self.save()
        self._log(f"爬虫运行结束，共获取 {len(self.results)} 条数据")
        return self.results


# 使用
crawler = SimpleCrawler(
    name="示例爬虫",
    base_url="https://api.example.com",
    headers={"User-Agent": "Mozilla/5.0"}
)
crawler.run(["/items", "/users"])
```

---

## 4. 文件与 I/O 操作

### 4.1 文件读写模式

```python
# ── 模式说明 ──
# "r"   读取（默认），文件不存在报错
# "w"   写入，会覆盖已有内容，文件不存在则创建
# "a"   追加，在文件末尾添加，文件不存在则创建
# "x"   新建写入，文件已存在则报错
# "b"   二进制模式（和上面组合用，如 "rb"、"wb"）

# ── 读取文本文件 ──
# 方法 1：一次读完
with open("example.txt", "r", encoding="utf-8") as f:
    content = f.read()          # 整个文件作为一个字符串
    print(content)

# 方法 2：按行读取（推荐，大文件不占内存）
with open("example.txt", "r", encoding="utf-8") as f:
    for line in f:              # 逐行迭代
        line = line.strip()     # 去掉换行符和首尾空白
        if line:                # 跳过空行
            print(line)

# ── 写入文本文件 ──
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")
    f.writelines(["第三行\n", "第四行\n"])

# ── 追加 ──
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("追加的行\n")

# ── 二进制读写（用于图片、文件下载）──
# 写入
with open("image.jpg", "wb") as f:
    f.write(b"模拟的二进制数据")

# 读取
with open("image.jpg", "rb") as f:
    data = f.read()
    print(f"读取了 {len(data)} 字节")

# ── 爬虫实战：下载图片 ──
def download_image(url, save_path):
    """下载图片到本地"""
    # 实际爬虫用 requests 获取内容
    # response = requests.get(url).content
    response = b"模拟的图片二进制数据"

    with open(save_path, "wb") as f:
        f.write(response)
    print(f"图片已保存到: {save_path}")

download_image("https://example.com/photo.jpg", "photo.jpg")
```

### 4.2 上下文管理器（with 语句）

```python
# ── 为什么需要用 with？──
# 不用 with 的写法：
f = open("test.txt", "w", encoding="utf-8")
f.write("数据")
f.close()  # 容易忘记关，或中途异常导致文件没关

# 用 with：
with open("test.txt", "w", encoding="utf-8") as f:
    f.write("数据")
# 自动关闭，即使中间有异常也会关

# ── 自定义上下文管理器 ──
class Timer:
    """计时器：统计代码块执行时间"""
    def __enter__(self):
        import time
        self.start = time.time()
        return self  # 返回的对象赋值给 as 后面的变量

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        elapsed = time.time() - self.start
        print(f"执行耗时: {elapsed:.3f} 秒")

with Timer():
    total = sum(range(1000000))
    print(f"计算结果: {total}")

# ── contextlib 简化 ──
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield                    # with 块执行到这里
    elapsed = time.time() - start
    print(f"耗时: {elapsed:.3f}s")

with timer():
    import time
    time.sleep(0.5)
```

### 4.3 JSON 与 CSV 操作

#### JSON —— 爬虫和数据交换的"通用语言"

```python
import json

# ── Python 字典 ↔ JSON 字符串 ──
data = {
    "name": "张三",
    "age": 25,
    "hobbies": ["编程", "读书"],
    "address": {
        "city": "北京",
        "district": "海淀"
    }
}

# 字典 → JSON 字符串
json_str = json.dumps(data, ensure_ascii=False, indent=2)
print(json_str)
# 输出：
# {
#   "name": "张三",
#   "age": 25,
#   "hobbies": ["编程", "读书"],
#   ...
# }

# JSON 字符串 → 字典
parsed = json.loads(json_str)
print(parsed["name"])  # 张三

# ── 直接读写 JSON 文件 ──
# 写入 JSON 文件
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 读取 JSON 文件
with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
    print(loaded["hobbies"])  # ['编程', '读书']

# ── 爬虫实战：保存 API 返回的数据 ──
def save_api_response(response_data, filename="output.json"):
    """保存 API 响应为 JSON 文件"""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(response_data, f, ensure_ascii=False, indent=2)
    print(f"已保存 {len(response_data)} 条数据")

# 模拟 API 返回
api_data = {
    "code": 200,
    "data": {
        "items": [
            {"id": 1, "title": "商品A", "price": 99.9},
            {"id": 2, "title": "商品B", "price": 199.0}
        ],
        "total": 2
    }
}
save_api_response(api_data)
```

#### CSV —— 表格数据的标准格式

```python
import csv

# ── 写入 CSV 文件 ──
headers = ["name", "age", "city"]
rows = [
    ["张三", 25, "北京"],
    ["李四", 30, "上海"],
    ["王五", 22, "广州"],
]

with open("users.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(headers)   # 写表头
    writer.writerows(rows)     # 写多行

# ── 读取 CSV 文件 ──
with open("users.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)  # ['张三', '25', '北京']

# ── 用 DictWriter / DictReader（推荐，更直观）──
with open("users.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerow({"name": "张三", "age": 25, "city": "北京"})
    writer.writerow({"name": "李四", "age": 30, "city": "上海"})

with open("users.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])  # 张三 25

# ── 爬虫实战：批量保存数据到 CSV ──
def save_to_csv(items, filename="results.csv"):
    """保存爬虫结果到 CSV"""
    if not items:
        print("没有数据可保存")
        return

    headers = list(items[0].keys())
    with open(filename, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(items)
    print(f"已保存 {len(items)} 条数据到 {filename}")

# 模拟爬虫结果
movies = [
    {"title": "电影A", "score": "9.2", "year": "2023"},
    {"title": "电影B", "score": "8.7", "year": "2022"},
    {"title": "电影C", "score": "7.9", "year": "2024"},
]
save_to_csv(movies)
```

---

## 5. 字符串编码与基础加密

### 5.1 字符编码原理

> 一句话理解：计算机只认识 0 和 1。编码就是"字 → 二进制"，解码就是"二进制 → 字"。

```python
# ── ASCII（最基础，只有英文字母、数字、符号）──
# 一个字符占 1 个字节
print(ord("A"))    # 65（查字符的编码值）
print(chr(65))     # A（查编码值对应的字符）

# ── Unicode（统一编码，给全世界所有字符一个编号）──
print(ord("中"))   # 20013（Unicode 编号）

# ── UTF-8（Unicode 的存储/传输形式，变长编码）──
# 英文字符占 1 字节，中文占 3 字节
text = "Hello中国"

# 编码：字符串 → 字节
utf8_bytes = text.encode("utf-8")
print(utf8_bytes)        # b'Hello\xe4\xb8\xad\xe5\x9b\xbd'
print(len(utf8_bytes))   # 11（5 + 6）

gbk_bytes = text.encode("gbk")
print(gbk_bytes)         # b'Hello\xd6\xd0\xb9\xfa'
print(len(gbk_bytes))    # 9（5 + 4，GBK 中文占 2 字节）

# 解码：字节 → 字符串
decoded = utf8_bytes.decode("utf-8")
print(decoded)           # Hello中国

# ── 爬虫中常见的编码问题 ──
# 情况 1：请求网页，返回的编码和实际内容不一致
raw_data = b'\xc4\xe3\xba\xc3'  # 这是 GBK 编码的"你好"
try:
    print(raw_data.decode("utf-8"))  # 报错！用 UTF-8 解码 GBK 数据
except UnicodeDecodeError as e:
    print(f"解码错误: {e}")

# 正确做法：用 GBK 解码
print(raw_data.decode("gbk"))  # 你好

# 情况 2：写文件时指定正确的编码
text = "中文内容"
# 用 UTF-8 写（推荐，通用性最好）
with open("output.txt", "w", encoding="utf-8") as f:
    f.write(text)

# 用 GBK 写（有些 Windows 程序需要）
with open("output_gbk.txt", "w", encoding="gbk") as f:
    f.write(text)

# ── 爬虫实战：自动检测编码 ──
import chardet

def smart_decode(data):
    """智能解码：自动检测编码并解码"""
    result = chardet.detect(data)
    encoding = result["encoding"]
    print(f"检测到编码: {encoding}，置信度: {result['confidence']}")
    return data.decode(encoding)

# 模拟：拿到一段不知道编码的二进制数据
unknown_data = "你好世界".encode("gbk")
decoded_text = smart_decode(unknown_data)
print(decoded_text)  # 你好世界
```

### 5.2 URL 编码

> URL 中只允许英文字母、数字和少数特殊字符。中文、空格等特殊字符必须**编码**后才能放进 URL。

```python
from urllib.parse import quote, unquote, urlencode

# ── quote：对字符串进行 URL 编码 ──
text = "中国"
encoded = quote(text)
print(encoded)         # %E4%B8%AD%E5%9B%BD（UTF-8 编码后加 %）

# 带空格的 URL
url = "https://example.com/search?q=" + quote("Python 爬虫")
print(url)  # https://example.com/search?q=Python%20%E7%88%AC%E8%99%AB

# ── unquote：URL 解码 ──
decoded = unquote("%E4%B8%AD%E5%9B%BD")
print(decoded)          # 中国

# ── urlencode：编码整个参数字典 ──
params = {
    "keyword": "手机",
    "page": 1,
    "sort": "price"
}
query_string = urlencode(params)
print(query_string)  # keyword=%E6%89%8B%E6%9C%BA&page=1&sort=price

full_url = f"https://example.com/search?{query_string}"
print(full_url)
# https://example.com/search?keyword=%E6%89%8B%E6%9C%BA&page=1&sort=price

# ── 爬虫实战：构造翻页 URL ──
def build_search_url(base, keyword, page=1, page_size=20):
    """构造带翻页的搜索 URL"""
    params = {
        "q": keyword,
        "p": page,
        "size": page_size
    }
    return f"{base}?{urlencode(params)}"

for page in range(1, 4):
    url = build_search_url("https://search.example.com", "Python", page)
    print(url)
```

### 5.3 Base64 编码

> Base64 不是加密，是编码。它把二进制数据转换成 64 个可打印字符（A-Z, a-z, 0-9, +, /）。
> 爬虫中常用于：传输图片的小图标、某些 API 的认证 Token、加密数据的传输格式。

```python
import base64

# ── 基本使用 ──
text = "Hello World"

# 编码：字符串 → Base64
text_bytes = text.encode("utf-8")        # 先转字节
encoded = base64.b64encode(text_bytes)
print(encoded)                           # b'SGVsbG8gV29ybGQ='

# 解码：Base64 → 字符串
decoded = base64.b64decode(encoded).decode("utf-8")
print(decoded)                           # Hello World

# ── 爬虫实战：处理图片 Base64（网页中常见）──
def save_base64_image(base64_str, save_path):
    """解码网页中的 Base64 图片并保存"""
    # 通常格式：data:image/png;base64,iVBORw0KGgo...
    # 如果有 data: 前缀，去掉它
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    image_data = base64.b64decode(base64_str)
    with open(save_path, "wb") as f:
        f.write(image_data)
    print(f"图片已保存: {save_path} ({len(image_data)} 字节)")

# 模拟 Base64 图片（一个极小的 PNG）
fake_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
save_base64_image(fake_base64, "small_image.png")

# ── Base64 编码图片到字符串 ──
def image_to_base64(image_path):
    """将图片文件编码为 Base64 字符串"""
    with open(image_path, "rb") as f:
        image_data = f.read()
    return base64.b64encode(image_data).decode("utf-8")

# ── 爬虫实战：某些 API 的 Basic Auth ──
def build_basic_auth_header(username, password):
    """构造 Basic Auth 请求头"""
    credentials = f"{username}:{password}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}

auth_header = build_basic_auth_header("admin", "123456")
print(auth_header)
# {'Authorization': 'Basic YWRtaW46MTIzNDU2'}
```

### 5.4 哈希算法（爬虫预备知识）

> 哈希算法："指纹"——输入任意数据，输出固定长度的"摘要"。不可逆、不同输入几乎不可能碰撞。

```python
import hashlib

# ── MD5（32 位十六进制，最常用）──
text = "hello"
md5_hash = hashlib.md5(text.encode()).hexdigest()
print(md5_hash)  # 5d41402abc4b2a76b9719d911017c592

# 爬虫实战 1：检测内容是否变化（增量爬虫）
def content_changed(content, known_hash=None):
    """检查内容是否和上次一样"""
    current_hash = hashlib.md5(content.encode()).hexdigest()
    if known_hash and current_hash == known_hash:
        return False  # 没变，跳过
    return True, current_hash

# 爬虫实战 2：生成去重签名
def url_signature(url, params=None):
    """生成请求的唯一签名（用于去重）"""
    raw = url + str(sorted((params or {}).items()))
    return hashlib.md5(raw.encode()).hexdigest()

print(url_signature("https://example.com/api", {"page": 1}))
# 相同的 URL 和参数 → 相同签名 → 可以用于判断是否抓取过

# ── SHA256（更安全，64 位，用于某些 API 签名）──
sha_hash = hashlib.sha256(text.encode()).hexdigest()
print(sha_hash)  # 64 位十六进制

# ── 爬虫实战：计算文件哈希（验证下载完整性）──
def file_hash(filepath, algorithm="md5"):
    """计算文件的哈希值"""
    h = hashlib.new(algorithm)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
```

---

## 综合实战：小试牛刀

把第一阶段的知识串起来，写一个能用的"迷你爬虫脚本"：

```python
"""
一个命令行迷你爬虫脚本
功能：读取 URL 列表，抓取内容，保存结果
知识点覆盖：函数、文件操作、JSON/CSV、编码、异常处理
"""
import json
import csv
import hashlib
from urllib.parse import urlparse
from datetime import datetime


def fetch_url(url):
    """
    模拟请求一个 URL
    实际爬虫中这里会用 requests 库
    """
    print(f"[请求] {url}")
    # 模拟返回不同的内容
    return json.dumps({
        "url": url,
        "title": f"页面标题 - {url}",
        "content": f"这是 {url} 的模拟内容",
        "timestamp": datetime.now().isoformat()
    })


def parse_response(raw_json):
    """解析 JSON 响应"""
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError as e:
        print(f"[错误] JSON 解析失败: {e}")
        return None


def save_as_json(data, filename="output.json"):
    """保存为 JSON 文件"""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[保存] JSON → {filename} ({len(data)} 条)")


def save_as_csv(data, filename="output.csv"):
    """保存为 CSV 文件"""
    if not data:
        return
    with open(filename, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    print(f"[保存] CSV → {filename} ({len(data)} 条)")


def url_signature(url):
    """生成 URL 签名（用于去重）"""
    return hashlib.md5(url.encode()).hexdigest()[:8]


def main():
    """主函数"""
    urls = [
        "https://example.com/page/1",
        "https://example.com/page/2",
        "https://example.com/page/3",
    ]

    results = []
    visited = set()

    print("=" * 40)
    print("迷你爬虫启动")
    print("=" * 40)

    for url in urls:
        sig = url_signature(url)

        if sig in visited:
            print(f"[跳过] {url} (已访问)")
            continue

        raw = fetch_url(url)
        data = parse_response(raw)

        if data:
            data["_id"] = sig
            results.append(data)
            visited.add(sig)

    print(f"\n抓取完成: {len(results)} 条数据\n")

    # 保存结果
    save_as_json(results)
    save_as_csv(results)

    print("\n完成！")


if __name__ == "__main__":
    main()
```

---

## 学习建议

1. **不要死记硬背**：代码是写出来的，不是背出来的。每个例子都在编辑器里敲一遍，感受一下。
2. **按需学习**：第一阶段的内容在后续都会反复用到。先理解 60%，后面遇到了再回来查。
3. **遇到报错不要慌**：读报错信息、上网搜，这是程序员最重要的技能。
4. **动手最重要**：看完综合实战，试着改一改功能（比如加个重试机制、换个保存格式）。
