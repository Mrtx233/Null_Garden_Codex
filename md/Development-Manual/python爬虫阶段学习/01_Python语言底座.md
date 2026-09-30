# 第一阶段：Python 语言底座

> **合辑**：Python 爬虫阶段学习手册 ｜ **阶段**：1 / 7 ｜ **定位**：为后续各阶段爬虫开发构建所需的 Python 语法、数据结构与工程基础 ｜ **建议学时**：18–24 小时

大家好，我是小马不起床。

## 阶段导语

Python 是执行爬虫任务的主体语言，本阶段聚焦 Python 语言本身的能力建设，涵盖变量与数据类型、核心数据结构、函数与模块化、面向对象编程、文件 I/O、字符串编码与基础加密六个模块。掌握这些内容后，后续阶段的请求发送、页面解析、数据存储等环节可直接复用本阶段的知识。本阶段不要求一次性记住全部语法，理解各结构的适用场景、能在编写爬虫时查阅对应用法即可。

## 学习目标

- [ ] 能区分列表、元组、字典、集合四种数据结构的特性与适用场景，并用推导式批量处理解析结果
- [ ] 能定义含默认参数、可变位置参数与关键字参数的函数，并说明 LEGB 作用域查找顺序
- [ ] 能编写闭包与装饰器，为函数附加重试、计时、日志等横切能力
- [ ] 能用类封装爬虫与下载器，理解封装、继承、多态与常用魔术方法
- [ ] 能完成文本与二进制文件读写，进行 JSON/CSV 序列化，并熟练使用 `with` 上下文管理器
- [ ] 能处理 UTF-8/GBK 编码转换、URL 编码、Base64 编解码与哈希签名

## 前置知识

无。本阶段为合辑起点，要求具备基本的计算机使用经验。

## 目录

1. [基础语法与数据结构](#1-基础语法与数据结构)
2. [函数与模块化](#2-函数与模块化)
3. [面向对象编程（OOP）](#3-面向对象编程oop)
4. [文件与 I/O 操作](#4-文件与-io-操作)
5. [字符串编码与基础加密](#5-字符串编码与基础加密)
6. [综合实战：命令行迷你爬虫脚本](#6-综合实战命令行迷你爬虫脚本)
7. [学习建议](#7-学习建议)

---

## 1. 基础语法与数据结构

### 1.1 变量与基本类型

Python 是动态类型（Dynamic Typing）语言，变量无需声明类型，赋值即确定类型。

```python
# 数字
age = 25              # int 整数
price = 3.99          # float 浮点数
complex_num = 1 + 2j  # complex 复数（爬虫中极少使用）

# 字符串
name = "张三"          # 双引号
city = '北京'          # 单引号（与双引号等价）
multiline = """
这是多行字符串
可以换行
"""

# 布尔值
is_ok = True          # 布尔值为首字母大写的保留字
is_done = False

# 使用 type() 查看类型
print(type(age))      # <class 'int'>
print(type(name))     # <class 'str'>

# 字符串格式化（爬虫中常用的几种写法）
url = f"https://example.com/page/{age}"  # f-string，Python 3.6+ 推荐
url2 = "https://example.com/page/%d" % age  # % 格式化，常见于既有代码
url3 = "https://example.com/page/{}".format(age)  # format 方法
```

三种字符串格式化写法的对比如下。

| 写法 | 语法形式 | 适用场景 |
| --- | --- | --- |
| f-string | `f"...{变量}..."` | 新建代码首选，可读性高 |
| `%` 格式化 | `"...%d" % 值` | 常见于既有代码 |
| `format` 方法 | `"...{}".format(值)` | 需要模板复用时 |

### 1.2 核心数据结构

Python 内置列表、元组、字典、集合四种数据结构，在爬虫中常用。

#### 列表（List）：有序、可重复、可修改

```python
# 创建
cities = ["北京", "上海", "广州", "深圳"]

# 增
cities.append("杭州")        # 末尾追加 → ["北京", "上海", "广州", "深圳", "杭州"]
cities.insert(1, "南京")     # 指定位置插入 → ["北京", "南京", "上海", "广州", "深圳", "杭州"]

# 删
cities.remove("南京")        # 按值删除
popped = cities.pop()        # 弹出末尾元素 → popped = "杭州"，cities 少一个元素
del cities[0]                # 按索引删除 → 删除"北京"

# 改
cities[0] = "重庆"           # 将第一个元素改为"重庆"

# 查
first = cities[0]            # 索引（从 0 开始）
last = cities[-1]            # 负数索引：最后一个元素
slice_ = cities[1:3]         # 切片 → 范围 [索引1, 索引3)，左闭右开
has_shanghai = "上海" in cities  # True

# 遍历
for city in cities:
    print(city)

# 列表推导式（爬虫中大量使用）
numbers = [1, 2, 3, 4, 5]
squared = [n * n for n in numbers]            # → [1, 4, 9, 16, 25]
evens = [n for n in numbers if n % 2 == 0]    # → [2, 4]

# 常用于从解析结果中批量提取数据
# 示例：urls = [item['href'] for item in items if item.get('href')]
```

#### 元组（Tuple）：有序、可重复、不可修改

```python
# 一旦创建即不可修改，适合存储固定数据
colors = ("红", "绿", "蓝")

# 访问方式与列表一致
print(colors[0])  # 红

# 不可修改：colors[0] = "黄"  ← 会报错

# 常用场景：函数返回多个值（本质即元组）
def get_user():
    return "张三", 25  # 自动打包为元组

name, age = get_user()  # 解包
```

元组与列表的特性对比如下。

| 类型 | 可变性 | 语法 | 适用场景 |
| --- | --- | --- | --- |
| 列表 | 可修改 | `[]` | 数据需要增删改 |
| 元组 | 不可修改 | `()` | 数据确定不变，更安全且性能略优 |

#### 字典（Dict）：键值对，爬虫中最核心的数据结构

```python
# 创建
person = {
    "name": "张三",
    "age": 25,
    "city": "北京"
}

# 增／改
person["phone"] = "138xxxx"   # 键不存在则新增
person["age"] = 26            # 键存在则修改

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
for key in person:                 # 遍历所有键
    print(key, person[key])

for key, value in person.items():  # 同时遍历键和值
    print(key, value)

for value in person.values():      # 只遍历值
    print(value)

# 字典推导式
squared = {x: x*x for x in range(5)}  # → {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# 爬虫实战场景：构造请求参数
params = {
    "page": 1,
    "limit": 20,
    "keyword": "手机"
}
# requests.get(url, params=params)

# 爬虫实战场景：解析 JSON（API 返回的数据几乎都是 JSON，自动转换为字典）
# json_data = response.json()
# print(json_data["data"]["items"])
```

#### 集合（Set）：无序、不重复，去重的主要方案

```python
# 创建
ids = {1, 2, 3, 3, 2}     # → {1, 2, 3}，自动去重
empty_set = set()          # 空集合不能写 {}，{} 是空字典

# 增删
ids.add(4)
ids.remove(1)              # 元素不存在会报错
ids.discard(10)            # 安全删除，不存在也不报错

# 常用操作（爬虫去重）
visited_urls = set()
new_url = "https://example.com/page/1"

if new_url not in visited_urls:
    # 抓取该页面
    visited_urls.add(new_url)

# 集合运算（作了解要求）
a = {1, 2, 3}
b = {3, 4, 5}
print(a & b)  # 交集 → {3}
print(a | b)  # 并集 → {1, 2, 3, 4, 5}
print(a - b)  # 差集 → {1, 2}
```

四种核心数据结构的特性对比如下。

| 数据结构 | 有序性 | 可变性 | 是否允许重复 | 语法 | 爬虫典型用途 |
| --- | --- | --- | --- | --- | --- |
| 列表 List | 有序 | 可修改 | 允许 | `[]` | 存放解析出的条目集合 |
| 元组 Tuple | 有序 | 不可修改 | 允许 | `()` | 多返回值、固定配置 |
| 字典 Dict | 按键 | 可修改 | 键唯一 | `{k: v}` | 构造请求参数、承载 JSON |
| 集合 Set | 无序 | 可修改 | 不允许 | `{}`／`set()` | URL 去重 |

### 1.3 控制流

```python
# if-elif-else
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

# for 循环（最常用）
for i in range(5):          # range(5) → 0,1,2,3,4
    print(i)

for i in range(2, 5):       # range(开始, 结束) → 2,3,4
    print(i)

# 爬虫常用：翻页
for page in range(1, 11):
    url = f"https://example.com/list?page={page}"
    print(f"正在抓取第 {page} 页: {url}")

# enumerate：同时获取索引和值
cities = ["北京", "上海", "广州"]
for idx, city in enumerate(cities):
    print(f"{idx}: {city}")

# while 循环
count = 0
while count < 3:
    print(f"第 {count+1} 次尝试")
    count += 1

# 爬虫实战：重试机制
max_retries = 3
attempt = 0
while attempt < max_retries:
    try:
        # 模拟发送请求
        # response = requests.get(url)
        # if response.status_code == 200:
        #     break
        pass
    except Exception:
        print(f"第 {attempt+1} 次失败，重试中...")
        attempt += 1

# break / continue
for i in range(10):
    if i == 3:
        continue        # 跳过本次迭代（不打印 3）
    if i == 7:
        break           # 提前结束循环（到 7 停止）
    print(i)
```

上述分支涉及的常见响应状态码含义如下。

| 状态码 | 含义 | 爬虫处理方式 |
| --- | --- | --- |
| 200 | 请求成功 | 正常解析响应内容 |
| 404 | 页面不存在 | 记录并跳过 |
| 500 | 服务器错误 | 触发重试 |

- **要点**：变量类型由赋值确定，可用 `type()` 查看；字符串格式化首选 f-string，`%` 与 `format` 常见于既有代码。
- **要点**：列表用于可变的有序集合，元组用于固定数据，字典承载键值映射，集合主要用于去重。
- **要点**：列表推导式与字典推导式适合从解析结果中批量提取与转换数据。
- **要点**：`for` 配合 `range()` 实现翻页，`while` 配合 `try/except` 实现重试，`break`/`continue` 控制循环走向。

---

## 2. 函数与模块化

### 2.1 函数定义与参数传递

```python
# 基本定义
def greet(name):
    """传入名字，返回问候语"""   # 文档字符串（docstring）
    return f"你好，{name}"

print(greet("张三"))  # 你好，张三

# 默认参数
def fetch_page(url, timeout=10):
    print(f"正在请求: {url}，超时设置: {timeout}s")
    # 模拟请求

fetch_page("https://example.com")             # timeout 使用默认值 10
fetch_page("https://example.com", 30)         # timeout=30
fetch_page("https://example.com", timeout=5)  # 显式指定

# 可变参数 *args（收集多个位置参数为元组）
def log_urls(*urls):
    for url in urls:
        print(f"URL: {url}")

log_urls("a.com", "b.com", "c.com")

# 关键字参数 **kwargs（收集多个关键字参数为字典）
def make_request(**kwargs):
    print(f"参数: {kwargs}")
    # kwargs["url"]、kwargs["method"] 等

make_request(url="https://example.com", method="GET", timeout=10)

# 爬虫实战：通用请求函数
def safe_request(url, method="GET", retries=3, **kwargs):
    """带重试的安全请求函数"""
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
                raise  # 最后一次仍失败则抛出异常
    return None
```

参数传递形式的种类与作用如下。

| 参数形式 | 语法 | 收集结果 | 典型用途 |
| --- | --- | --- | --- |
| 位置参数 | `def f(a, b)` | 无 | 必填入参 |
| 默认参数 | `def f(a=10)` | 无 | 可选配置，如 `timeout` |
| 可变位置参数 | `def f(*args)` | 元组 | 数量不定的入参 |
| 可变关键字参数 | `def f(**kwargs)` | 字典 | 透传请求参数与配置 |

### 2.2 作用域（LEGB 规则）

Python 按 Local（局部）→ Enclosing（外层函数的局部）→ Global（全局）→ Built-in（内置）的顺序查找变量，即 LEGB 规则。

```python
x = "全局 x"  # Global 作用域

def outer():
    x = "外层 x"  # Enclosing 作用域

    def inner():
        x = "内层 x"  # Local 作用域
        print(x)  # 内层 x

    inner()

outer()

# global 关键字
count = 0

def increment():
    global count  # 声明修改全局变量
    count += 1

increment()
print(count)  # 1

# nonlocal 关键字（修改外层函数的变量）
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

LEGB 四层作用域的含义如下。

| 层级 | 全称 | 范围 |
| --- | --- | --- |
| L | Local | 当前函数内部 |
| E | Enclosing | 外层函数的局部 |
| G | Global | 模块全局 |
| B | Built-in | Python 内置命名空间 |

### 2.3 匿名函数（lambda）与高阶函数

```python
# lambda
# 格式：lambda 参数: 返回值
double = lambda x: x * 2
print(double(5))  # 10

# 等价写法：
def double(x):
    return x * 2

# map（对每个元素执行操作）
nums = [1, 2, 3, 4]
doubled = list(map(lambda x: x * 2, nums))  # [2, 4, 6, 8]
# 列表推导式更直观：[x * 2 for x in nums]

# filter（过滤符合条件的元素）
evens = list(filter(lambda x: x % 2 == 0, nums))  # [2, 4]
# 列表推导式：[x for x in nums if x % 2 == 0]

# reduce（累积计算）
from functools import reduce
total = reduce(lambda a, b: a + b, nums)  # 10（1+2+3+4）

# sorted（按自定义规则排序）
students = [
    {"name": "张三", "score": 85},
    {"name": "李四", "score": 92},
    {"name": "王五", "score": 78},
]
ranked = sorted(students, key=lambda s: s["score"], reverse=True)
# 按分数从高到低排序
```

常用高阶函数的作用与返回形式如下。

| 函数 | 作用 | 返回 | 等价列表推导式 |
| --- | --- | --- | --- |
| `map` | 对每个元素执行操作 | 迭代器 | `[f(x) for x in nums]` |
| `filter` | 保留满足条件的元素 | 迭代器 | `[x for x in nums if cond]` |
| `reduce` | 累积计算为单一值 | 单值 | 无直接对应写法 |
| `sorted` | 按 `key` 规则排序 | 新列表 | 无直接对应写法 |

### 2.4 闭包与装饰器

#### 闭包：在函数内部定义函数，且内部函数引用了外部函数的变量

```python
def make_counter(start=0):
    """创建一个计数器，每次调用 +1"""
    count = start
    def counter():
        nonlocal count
        count += 1
        return count
    return counter  # 返回内部函数（尚未执行）

c1 = make_counter(10)
print(c1())  # 11
print(c1())  # 12

c2 = make_counter(0)
print(c2())  # 1
print(c1())  # 13，c1 与 c2 互不影响

# 爬虫实战：闭包用于创建带状态的函数
def create_url_builder(base_url):
    """创建一个自动拼接 URL 的函数"""
    def builder(path):
        return f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    return builder

build = create_url_builder("https://api.example.com")
print(build("users"))       # https://api.example.com/users
print(build("items/123"))   # https://api.example.com/items/123
```

#### 装饰器：在不修改函数本身的前提下为其增加功能

```python
# 最简单的装饰器
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

@log_time  # 等价于：fetch_data = log_time(fetch_data)
def fetch_data():
    import time
    time.sleep(1)  # 模拟网络请求
    return "数据"

fetch_data()  # 输出：fetch_data 执行了 1.001 秒
```

装饰器在爬虫中最常用的两类场景为重试机制与日志记录。

```python
# 场景 1：重试机制
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
                        raise  # 最后一次仍失败则抛出
                    time.sleep(delay)
            return None
        return wrapper
    return decorator

@retry(max_attempts=3, delay=2)
def fetch_url(url):
    print(f"请求: {url}")
    # 模拟请求失败
    raise ConnectionError("网络错误")

# fetch_url("https://example.com")  # 将重试 3 次

# 场景 2：日志记录
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

装饰器的本质是在函数外层再包裹一层，`@` 语法糖用于简化写法，`@retry` 等价于 `fetch_url = retry(fetch_url)`。

- **要点**：函数支持默认参数、可变位置参数 `*args`（收集为元组）与关键字参数 `**kwargs`（收集为字典），`**kwargs` 常用于透传请求配置。
- **要点**：LEGB 描述变量查找顺序；`global` 用于修改全局变量，`nonlocal` 用于修改外层函数变量。
- **要点**：`lambda` 配合 `map`/`filter`/`sorted`/`reduce` 实现简洁的批量处理与自定义排序。
- **要点**：闭包保存外部状态，可用于构造带状态的 URL 拼接函数。
- **要点**：装饰器以横切方式为函数附加重试、计时、日志能力，`@装饰器` 等价于对函数名的重新赋值。

---

## 3. 面向对象编程（OOP）

### 3.1 类与对象

```python
class Spider:
    """爬虫类，编写爬虫的基本单位"""
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
        # 此处实际可使用 requests 库请求
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
print(my_spider.name)          # 基础爬虫
print(my_spider.visited_urls)  # {'/page1', '/page2'}
```

类属性与实例属性的区别如下。

| 属性类别 | 定义位置 | 归属 | 典型用途 |
| --- | --- | --- | --- |
| 类属性 | 类体内、方法外 | 所有实例共享 | 名称、版本等固定信息 |
| 实例属性 | `__init__` 中通过 `self` 绑定 | 单个实例独有 | `base_url`、`visited_urls` 等状态 |

### 3.2 封装、继承、多态

#### 封装：将数据与操作数据的方法组织在类内部

```python
class Downloader:
    """下载器，封装请求逻辑"""
    def __init__(self):
        self._headers = {   # 单下划线开头表示内部成员（命名约定，非强制）
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html"
        }
        self._timeout = 10

    def set_user_agent(self, ua):
        """通过方法修改 User-Agent（而非直接修改 _headers）"""
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

#### 继承：子类直接复用父类的功能

```python
class BaseSpider:
    """基础爬虫，所有爬虫的父类"""
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
    """电影爬虫，继承 BaseSpider"""
    def __init__(self, base_url, category="热门"):
        super().__init__(base_url)   # 调用父类的 __init__
        self.category = category

    def parse(self, html):
        """重写父类的 parse 方法"""
        print(f"[电影爬虫] 解析: {html}")
        # 模拟解析出电影列表
        return [
            {"title": "电影A", "score": 9.2},
            {"title": "电影B", "score": 8.7},
        ]


class BookSpider(BaseSpider):
    """书籍爬虫，继承 BaseSpider"""
    def parse(self, html):
        """不同的解析逻辑"""
        print(f"[书籍爬虫] 解析: {html}")
        return [
            {"title": "书A", "author": "作者甲"},
            {"title": "书B", "author": "作者乙"},
        ]


# 使用：相同的 run 方法，不同子类有不同行为，即多态
movie = MovieSpider("https://movie.example.com")
books = BookSpider("https://book.example.com")

movie.run("/top250")
books.run("/bestsellers")
```

#### 多态：同一方法名在不同对象上有不同实现

```python
# 上述示例已体现多态
spiders = [
    MovieSpider("https://movie.example.com"),
    BookSpider("https://book.example.com"),
]

for spider in spiders:
    # 无需关心具体子类，统一调用 run
    # 每个 spider 的 run 会调用各自重写后的 parse
    print(spider.run("/list"))
```

封装、继承、多态三大特性的定义与作用如下。

| 特性 | 定义 | 在爬虫中的作用 |
| --- | --- | --- |
| 封装 | 将数据与操作收拢在类内，通过方法暴露接口 | 隐藏请求头、超时等内部状态 |
| 继承 | 子类复用父类功能，按需重写方法 | 复用请求与调度逻辑，差异化解析 |
| 多态 | 同一接口在子类有不同实现 | 调用方统一使用 `run`，无需区分子类 |

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
        """使对象可像函数一样被调用"""
        print(f"执行请求: {self.method} {self.url}")
        return f"响应内容"

    def __len__(self):
        """len() 返回的值"""
        return len(self.url)

    def __eq__(self, other):
        """用 == 比较两个对象"""
        return self.url == other.url and self.method == other.method


req1 = Request("https://example.com/api")
req2 = Request("https://example.com/api")
req3 = Request("https://other.com")

print(req1)              # 调用 __str__ → [GET] https://example.com/api
print(req1 == req2)      # 调用 __eq__ → True
print(req1 == req3)      # False

# __call__ 的应用
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

常用魔术方法的触发时机与用途如下。

| 魔术方法 | 触发时机 | 典型用途 |
| --- | --- | --- |
| `__init__` | 创建实例时 | 初始化属性 |
| `__str__` | `print()`／`str()` | 面向用户的可读输出 |
| `__repr__` | 容器显示、调试 | 面向开发者的表示 |
| `__call__` | 实例加 `()` 调用 | 中间件、可调用对象 |
| `__len__` | `len()` | 返回长度 |
| `__eq__` | `==` 比较 | 自定义相等判定 |

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
        # 实际爬虫此处会调用 requests.get(url, headers=self.headers)
        # 此处模拟返回
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

- **要点**：类属性由所有实例共享，实例属性通过 `self` 绑定，`__init__` 为构造方法。
- **要点**：封装将请求头等内部状态收拢在类中，通过方法暴露可修改接口。
- **要点**：继承使子类复用父类的 `fetch`/`run`，重写 `parse` 实现差异化解析，`super()` 用于调用父类构造方法。
- **要点**：多态使调用方无需区分具体子类，统一调用 `run` 即可分派到各自的 `parse`。
- **要点**：`__call__` 使实例可作为函数调用，常见于代理轮换等中间件。

---

## 4. 文件与 I/O 操作

### 4.1 文件读写模式

`open()` 的模式参数决定文件的打开方式，各模式的含义与文件不存在时的行为如下。

| 模式 | 说明 | 文件不存在时 |
| --- | --- | --- |
| `r` | 读取（默认） | 报错 |
| `w` | 写入，覆盖已有内容 | 创建 |
| `a` | 追加，在文件末尾添加 | 创建 |
| `x` | 新建写入 | 文件已存在则报错 |
| `b` | 二进制模式，与上述组合（如 `rb`、`wb`） | 依组合而定 |

```python
# 读取文本文件
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

# 写入文本文件
with open("output.txt", "w", encoding="utf-8") as f:
    f.write("第一行\n")
    f.write("第二行\n")
    f.writelines(["第三行\n", "第四行\n"])

# 追加
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("追加的行\n")

# 二进制读写（用于图片、文件下载）
# 写入
with open("image.jpg", "wb") as f:
    f.write(b"模拟的二进制数据")

# 读取
with open("image.jpg", "rb") as f:
    data = f.read()
    print(f"读取了 {len(data)} 字节")

# 爬虫实战：下载图片
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

直接使用 `open()` 需手动调用 `close()`，易遗漏或在异常时无法释放文件；`with` 语句在代码块结束时自动关闭文件，其语义等价于 `try/finally`。

```python
# 不使用 with 的写法：
f = open("test.txt", "w", encoding="utf-8")
f.write("数据")
f.close()  # 容易忘记关闭，或中途异常导致文件未关闭

# 使用 with：
with open("test.txt", "w", encoding="utf-8") as f:
    f.write("数据")
# 块结束时自动关闭，即使中途出现异常也会关闭

# 自定义上下文管理器
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

# 使用 contextlib 简化
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield                    # with 块执行到此位置
    elapsed = time.time() - start
    print(f"耗时: {elapsed:.3f}s")

with timer():
    import time
    time.sleep(0.5)
```

### 4.3 JSON 与 CSV 操作

#### JSON：爬虫与数据交换的常用格式

```python
import json

# Python 字典与 JSON 字符串的相互转换
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

# 直接读写 JSON 文件
# 写入 JSON 文件
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 读取 JSON 文件
with open("data.json", "r", encoding="utf-8") as f:
    loaded = json.load(f)
    print(loaded["hobbies"])  # ['编程', '读书']

# 爬虫实战：保存 API 返回的数据
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

`json` 模块四个核心函数的作用对象与操作方向如下。

| 函数 | 作用 | 操作对象 |
| --- | --- | --- |
| `dumps` | 字典转 JSON 字符串 | 内存字符串 |
| `loads` | JSON 字符串转字典 | 内存字符串 |
| `dump` | 字典写入 JSON 文件 | 文件 |
| `load` | 从 JSON 文件读取字典 | 文件 |

#### CSV：表格数据的标准格式

```python
import csv

# 写入 CSV 文件
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

# 读取 CSV 文件
with open("users.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.reader(f)
    for row in reader:
        print(row)  # ['张三', '25', '北京']

# 使用 DictWriter / DictReader（推荐，更直观）
with open("users.csv", "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerow({"name": "张三", "age": 25, "city": "北京"})
    writer.writerow({"name": "李四", "age": 30, "city": "上海"})

with open("users.csv", "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])  # 张三 25

# 爬虫实战：批量保存数据到 CSV
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

写入含中文的 CSV 时建议使用 `encoding="utf-8-sig"`，使 Excel 打开时不乱码；`newline=""` 用于避免 Windows 下产生空行。

- **要点**：模式 `r/w/a/x` 决定文件不存在或已存在时的行为，`b` 表示二进制。
- **要点**：大文件推荐逐行迭代读取，避免一次性载入内存。
- **要点**：`with` 语句在块结束或异常时自动关闭文件，语义等价于 `try/finally`。
- **要点**：JSON 通过 `json.dump/dumps/load/loads` 序列化，写中文需设 `ensure_ascii=False`。
- **要点**：大文件推荐逐行迭代读取，避免一次性载入内存。
- **要点**：`with` 语句在块结束或异常时自动关闭文件，语义等价于 `try/finally`。
- **要点**：JSON 使用 `json.dump/dumps/load/loads` 序列化，写入中文需 `ensure_ascii=False`。
- **要点**：CSV 写文件宜用 `encoding="utf-8-sig"` 并设 `newline=""`，`DictWriter/DictReader` 按列名读写更直观。

---

## 5. 字符串编码与基础加密

### 5.1 字符编码原理

计算机以二进制存储字符。编码（Encode）将字符转换为字节，解码（Decode）将字节还原为字符；编码与解码方式使用同一套规则才能得到正确结果。

```python
# ASCII（最基础的编码，仅覆盖英文字母、数字、符号）
# 一个字符占 1 个字节
print(ord("A"))    # 65（查询字符的编码值）
print(chr(65))     # A（查询编码值对应的字符）

# Unicode（统一编码，为全世界所有字符分配编号）
print(ord("中"))   # 20013（Unicode 码位）

# UTF-8（Unicode 的存储与传输形式，变长编码）
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

# 爬虫中常见的编码问题
# 情况 1：返回的编码声明与实际内容编码不一致
raw_data = b'\xc4\xe3\xba\xc3'  # 这是 GBK 编码的"你好"
try:
    print(raw_data.decode("utf-8"))  # 以 UTF-8 解码 GBK 数据将报错
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

# 爬虫实战：自动检测编码
import chardet

def smart_decode(data):
    """自动检测编码并解码"""
    result = chardet.detect(data)
    encoding = result["encoding"]
    print(f"检测到编码: {encoding}，置信度: {result['confidence']}")
    return data.decode(encoding)

# 模拟：获取一段编码未知的二进制数据
unknown_data = "你好世界".encode("gbk")
decoded_text = smart_decode(unknown_data)
print(decoded_text)  # 你好世界
```

常见字符编码的宽度与适用场景对比如下。

| 编码 | 字符宽度 | 覆盖范围 | 典型场景 |
| --- | --- | --- | --- |
| ASCII | 1 字节 | 英文字母、数字、部分符号 | 早期英文文本 |
| Unicode | 码位（非存储格式） | 全球字符 | 统一字符编号 |
| UTF-8 | 变长（英文 1、中文 3 字节） | 全球字符 | 网络传输与存储首选 |
| GBK | 英文 1、中文 2 字节 | 中文为主 | 部分中文站点 |

### 5.2 URL 编码

URL 仅允许英文字母、数字和少数特殊字符，中文、空格等特殊字符必须编码后才能写入 URL。

```python
from urllib.parse import quote, unquote, urlencode

# quote：对字符串进行 URL 编码
text = "中国"
encoded = quote(text)
print(encoded)         # %E4%B8%AD%E5%9B%BD（按 UTF-8 编码后以 % 分隔）

# 带空格的 URL
url = "https://example.com/search?q=" + quote("Python 爬虫")
print(url)  # https://example.com/search?q=Python%20%E7%88%AC%E8%99%AB

# unquote：URL 解码
decoded = unquote("%E4%B8%AD%E5%9B%BD")
print(decoded)          # 中国

# urlencode：编码整个参数字典
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

# 爬虫实战：构造翻页 URL
def build_search_url(base, keyword, page=1, page_size=20):
    """构造带翻页参数的搜索 URL"""
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

Base64 属于编码而非加密，它将二进制数据转换为 64 个可打印字符（A–Z、a–z、0–9、+、/）。爬虫中常用于网页内嵌的小图标、某些 API 的认证 Token（令牌），以及二进制数据的文本化传输。

```python
import base64

# 基本使用
text = "Hello World"

# 编码：字符串 → Base64
text_bytes = text.encode("utf-8")        # 先转换为字节
encoded = base64.b64encode(text_bytes)
print(encoded)                           # b'SGVsbG8gV29ybGQ='

# 解码：Base64 → 字符串
decoded = base64.b64decode(encoded).decode("utf-8")
print(decoded)                           # Hello World

# 爬虫实战：处理图片 Base64（网页中常见）
def save_base64_image(base64_str, save_path):
    """解码网页中的 Base64 图片并保存"""
    # 通常格式：data:image/png;base64,iVBORw0KGgo...
    # 如果存在 data: 前缀则去掉
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    image_data = base64.b64decode(base64_str)
    with open(save_path, "wb") as f:
        f.write(image_data)
    print(f"图片已保存: {save_path} ({len(image_data)} 字节)")

# 模拟 Base64 图片（一个极小的 PNG）
fake_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
save_base64_image(fake_base64, "small_image.png")

# 将图片文件编码为 Base64 字符串
def image_to_base64(image_path):
    """将图片文件编码为 Base64 字符串"""
    with open(image_path, "rb") as f:
        image_data = f.read()
    return base64.b64encode(image_data).decode("utf-8")

# 爬虫实战：某些 API 的 Basic Auth
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

哈希算法（Hash）将任意长度的输入转换为固定长度的摘要，过程不可逆，不同输入产生相同摘要的概率极低。

```python
import hashlib

# MD5（32 位十六进制，最常用）
text = "hello"
md5_hash = hashlib.md5(text.encode()).hexdigest()
print(md5_hash)  # 5d41402abc4b2a76b9719d911017c592

# 爬虫实战 1：检测内容是否变化（增量爬虫）
def content_changed(content, known_hash=None):
    """检查内容是否和上次一样"""
    current_hash = hashlib.md5(content.encode()).hexdigest()
    if known_hash and current_hash == known_hash:
        return False  # 未变化，可跳过
    return True, current_hash

# 爬虫实战 2：生成去重签名
def url_signature(url, params=None):
    """生成请求的唯一签名（用于去重）"""
    raw = url + str(sorted((params or {}).items()))
    return hashlib.md5(raw.encode()).hexdigest()

print(url_signature("https://example.com/api", {"page": 1}))
# 相同的 URL 和参数生成相同签名，可用于判断是否抓取过

# SHA256（更安全，64 位十六进制，用于某些 API 签名）
sha_hash = hashlib.sha256(text.encode()).hexdigest()
print(sha_hash)  # 64 位十六进制

# 爬虫实战：计算文件哈希（验证下载完整性）
def file_hash(filepath, algorithm="md5"):
    """计算文件的哈希值"""
    h = hashlib.new(algorithm)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
```

常用哈希算法的特性与用途对比如下。

| 算法 | 摘要长度 | 特点 | 爬虫用途 |
| --- | --- | --- | --- |
| MD5 | 32 位十六进制 | 计算快，非加密级安全 | 去重签名、内容变更检测 |
| SHA256 | 64 位十六进制 | 安全性更高 | API 签名、下载完整性校验 |

- **要点**：编码将字符转为字节、解码将字节还原为字符，编解码方式需保持一致。
- **要点**：UTF-8 通用性最好，部分中文站点使用 GBK，编码不匹配会触发 `UnicodeDecodeError`。
- **要点**：`chardet` 可在编码未知时检测编码及其置信度。
- **要点**：URL 中的中文与空格需经 `quote`/`urlencode` 编码，Base64 用于图片与认证头的文本化传输。
- **要点**：MD5/SHA256 生成固定长度摘要，可用于 URL 去重签名与下载完整性校验。

---

## 6. 综合实战：命令行迷你爬虫脚本

本脚本综合本阶段知识点，覆盖函数、文件操作、JSON/CSV、编码与异常处理，实现读取 URL 列表、抓取内容、保存结果的完整流程。

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
    实际爬虫中此处会用到 requests 库
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

    print("\n完成")


if __name__ == "__main__":
    main()
```

脚本的执行流程如下。

```text
读取 URL 列表
   ↓
生成 URL 签名
   ↓
签名已在集合中 ── 是 ─→ 跳过
   ↓ 否
请求内容 → 解析 JSON
   ↓
写入结果并记录签名
   ↓
保存 JSON 与 CSV
```

- **要点**：脚本以 `main()` 串联"请求—解析—去重—保存"的完整流程。
- **要点**：去重使用 `set` 配合 `url_signature` 生成的摘要作为键。
- **要点**：结果同时输出 JSON 与 CSV，中文分别通过 `ensure_ascii=False` 与 `utf-8-sig` 处理。
- **要点**：异常处理集中于 `parse_response`，JSON 解析失败时返回 `None` 并跳过该条数据。

---

## 7. 学习建议

本阶段以理解与练习为主，建议遵循以下学习方式。

- **实践优先**：编程能力主要通过编写与调试代码形成，而非记忆语法，本阶段示例宜逐一在编辑器中执行并观察结果。
- **按需掌握**：本阶段内容在后续阶段反复使用，首轮理解约 60% 即可，遇到具体问题时再回查对应小节。
- **错误处理**：出现报错时先阅读错误信息以定位类型与行号，再检索对应说明，这是排查问题的基本流程。
- **扩展练习**：完成综合实战脚本后可尝试扩展功能，例如增加重试机制、更换保存格式或接入真实的 `requests` 请求。

- **要点**：本阶段示例需动手执行，理解结构关系重于记忆语法细节。
- **要点**：首轮掌握约 60% 即可，后续阶段按需回查对应小节。
- **要点**：综合实战脚本是本阶段知识的整合点，建议在其上扩展功能以巩固所学。

---

## 阶段小结

| 知识模块 | 核心要点 | 在爬虫中的作用 |
| --- | --- | --- |
| 基础语法与数据结构 | 动态类型、四种内置数据结构、列表与字典推导式、控制流 | 承载解析结果、构造请求参数、URL 去重与翻页 |
| 函数与模块化 | 参数传递、LEGB 作用域、`lambda`、闭包与装饰器 | 封装请求函数，用装饰器实现重试、计时、日志 |
| 面向对象编程 | 类与对象、封装继承多态、魔术方法 | 组织爬虫类与下载器，`__call__` 用于中间件 |
| 文件与 I/O 操作 | 读写模式、`with` 上下文管理器、JSON/CSV 序列化 | 保存抓取结果、下载二进制文件 |
| 字符串编码与基础加密 | 编码解码、URL 编码、Base64、哈希 | 处理中文与乱码、构造 URL、生成去重签名与完整性校验 |

## 常见问题与排查

| 现象 | 原因 | 处理方式 |
| --- | --- | --- |
| 抛出 `UnicodeDecodeError` | 解码方式与数据实际编码不一致（如以 UTF-8 解码 GBK 数据） | 使用与数据一致的编码解码，或先用 `chardet` 检测再解码 |
| 写入 CSV/JSON 后中文显示为 `\uXXXX` 或乱码 | 未设置 `ensure_ascii=False`，或 CSV 未使用 `utf-8-sig` | JSON 序列化加 `ensure_ascii=False`，CSV 用 `utf-8-sig` 并设 `newline=""` |
| 访问字典键时抛出 `KeyError` | 直接下标访问不存在的键 | 改用 `dict.get(key, 默认值)` 安全获取 |
| 函数内修改全局计数器报 `UnboundLocalError` | 直接赋值使同名变量变为局部变量 | 使用 `global`／`nonlocal` 声明后再修改 |
| 装饰器应用后原函数名与文档字符串丢失 | 包装函数未同步元信息 | 在 `wrapper` 上加 `functools.wraps(func)` |
| 集合无法创建空实例 | 使用 `{}` 得到的是空字典 | 空集合用 `set()` 创建 |

## 下一阶段衔接

完成本阶段后，已具备编写结构清晰的 Python 程序的能力。下一阶段《02_网络基础与静态网页抓取》将在本阶段函数、类与文件操作的基础上，引入 HTTP/HTTPS 协议、请求与响应结构，并使用 `requests` 库获取网页内容。本阶段的字典参数构造、JSON 解析与字符串编码知识，将直接用于构造请求参数与解析接口返回的数据。
