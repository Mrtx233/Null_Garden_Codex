---
title: "Python 字符串、字节、编码与 Base64 知识总结"
description: "编码是爬虫与后端开发中最容易被忽视、却又最容易引发疑难问题的一环：乱码、UnicodeDecodeError、Base64 还原失败，根源几乎都在于对 str 与 bytes 的边界认识不清。本文系统梳理 Python 中 str、bytes、encode()、decode()、UTF-8、GBK 与 Base64 的核心概念及标准转换流程，篇幅不长，但值得"
tags:
  - "Python"
  - "编码"
---

# Python 字符串、字节、编码与 Base64 知识总结

大家好，我是小马不起床。

编码是爬虫与后端开发中最容易被忽视、却又最容易引发疑难问题的一环：乱码、`UnicodeDecodeError`、Base64 还原失败，根源几乎都在于对 `str` 与 `bytes` 的边界认识不清。本文系统梳理 Python 中 `str`、`bytes`、`encode()`、`decode()`、UTF-8、GBK 与 Base64 的核心概念及标准转换流程，篇幅不长，但值得彻底吃透。

---

## 目录

1. Python 中的两种核心对象
2. UTF-8 / GBK 的本质
3. encode()：字符串转字节
4. decode()：字节转字符串
5. encode 与 decode 的方向性
6. 文件读写的本质
7. GBK 转 UTF-8
8. UTF-8 转 GBK
9. 乱码的本质
10. Base64 的本质
11. Base64 与 UTF-8 / GBK 的区别
12. 字符串转 Base64
13. Base64 还原为字符串
14. 常见转换流程汇总
15. 核心规则速查
16. 一句话总结

---

## 1. Python 中的两种核心对象

Python 中首先需要严格区分两类对象：

```text
str   = 字符串，面向展示的文本
bytes = 字节，文件 / 网络 / 二进制数据的底层形态
```

示例：

```python
text = "你好"          # str
data = b"hello"        # bytes
```

关键结论：

```text
文件、网络传输、图片、压缩包、加密结果，其底层形态均为 bytes。
Python 中可直接进行文本处理的对象是 str。
```

---

## 2. UTF-8 / GBK 的本质

**UTF-8、GBK 属于字符编码。**

其职责是解决：

```text
字符串 str 与字节 bytes 之间的双向转换规则
```

同一字符串采用不同编码，将得到不同的 bytes。

例如：

```text
"你好".encode("utf-8") → E4 BD A0 E5 A5 BD
"你好".encode("gbk")   → C4 E3 BA C3
```

即：

```text
字符串内容相同，底层存储字节可能完全不同。
```

---

## 3. encode()：字符串转字节

`encode()` 的定义：

```text
str.encode(编码) = 将字符串按指定编码转换为 bytes
```

示例代码：

```python
text = "你好"

utf8_bytes = text.encode("utf-8")
gbk_bytes = text.encode("gbk")

print(utf8_bytes)
print(gbk_bytes)
```

输出结果：

```python
b'\xe4\xbd\xa0\xe5\xa5\xbd'
b'\xc4\xe3\xba\xc3'
```

对应关系：

```text
"你好" --encode("utf-8")--> UTF-8 bytes
"你好" --encode("gbk")----> GBK bytes
```

---

## 4. decode()：字节转字符串

`decode()` 的定义：

```text
bytes.decode(编码) = 将 bytes 按指定编码还原为 str
```

示例代码：

```python
utf8_data = b'\xe4\xbd\xa0\xe5\xa5\xbd'
text = utf8_data.decode("utf-8")

print(text)
```

输出：

```text
你好
```

对应关系：

```text
UTF-8 bytes --decode("utf-8")--> "你好"
GBK bytes   --decode("gbk")----> "你好"
```

---

## 5. encode 与 decode 的方向性

正确写法：

```python
"你好".encode("utf-8")       # str -> bytes
b"...".decode("utf-8")       # bytes -> str
```

错误写法：

```python
"你好".decode("utf-8")       # 错误，str 类型不存在 decode 方法
b"...".encode("utf-8")       # 通常错误，bytes 应执行 decode
```

方向规则：

```text
encode：编码，str → bytes
decode：解码，bytes → str
```

---

## 6. 文件读写的本质

### 6.1 读文件

代码：

```python
with open("a.txt", "r", encoding="utf-8") as f:
    text = f.read()
```

其本质是：

```text
文件 bytes → decode("utf-8") → str
```

若文件实际以 GBK 存储，却声明按 UTF-8 读取，将出现乱码或直接抛出异常。

---

### 6.2 写文件

代码：

```python
with open("a.txt", "w", encoding="utf-8") as f:
    f.write("你好")
```

其本质是：

```text
str → encode("utf-8") → 文件 bytes
```

若改写为 GBK：

```python
with open("a.txt", "w", encoding="gbk") as f:
    f.write("你好")
```

其本质是：

```text
str → encode("gbk") → 文件 bytes
```

由此可推知：`open()` 中的 `encoding` 参数，决定的是字节与字符串之间的转换规则。

---

## 7. GBK 转 UTF-8

GBK 转 UTF-8 并非直接改写 bytes，而必须经由 str 中转：

```text
GBK bytes → 按 GBK 解码为 str → 再按 UTF-8 编码为 bytes
```

示例代码：

```python
gbk_bytes = b'\xc4\xe3\xba\xc3'

text = gbk_bytes.decode("gbk")
utf8_bytes = text.encode("utf-8")

print(text)
print(utf8_bytes)
```

转换流程：

```text
C4 E3 BA C3
    ↓ decode("gbk")
"你好"
    ↓ encode("utf-8")
E4 BD A0 E5 A5 BD
```

---

## 8. UTF-8 转 GBK

示例代码：

```python
utf8_bytes = b'\xe4\xbd\xa0\xe5\xa5\xbd'

text = utf8_bytes.decode("utf-8")
gbk_bytes = text.encode("gbk")

print(text)
print(gbk_bytes)
```

转换流程：

```text
E4 BD A0 E5 A5 BD
    ↓ decode("utf-8")
"你好"
    ↓ encode("gbk")
C4 E3 BA C3
```

需要注意：

```text
若字符串中包含 emoji 或 GBK 字符集未收录的特殊符号，
encode("gbk") 将抛出 UnicodeEncodeError。
```

---

## 9. 乱码的本质

乱码的根本原因：

```text
以错误的编码对 bytes 执行 decode
```

例如：

```python
gbk_bytes = b'\xc4\xe3\xba\xc3'
text = gbk_bytes.decode("utf-8")
```

即：

```text
GBK bytes 被错误地按 UTF-8 规则解码
```

由此产生的典型现象：

```text
UnicodeDecodeError
乱码字符
```

因此排查乱码问题时，应优先回答两个问题：

```text
这串 bytes 的原始编码是什么？
当前用于 decode 的编码是什么？
```

二者不一致，即为乱码根源。

---

## 10. Base64 的本质

**Base64 是将任意 bytes 转换为可见文本的编码方式。**

它不属于 UTF-8、GBK 一类的字符编码。

Base64 解决的问题是：

```text
二进制 bytes 不便于直接嵌入 JSON、URL、邮件、文本字段，
因此先将 bytes 转换为一串安全的可见字符。
```

示例代码：

```python
import base64

data = b"hello"
b64 = base64.b64encode(data)

print(b64)
```

输出：

```python
b'aGVsbG8='
```

含义：

```text
b"hello" → Base64 → b"aGVsbG8="
```

---

## 11. Base64 与 UTF-8 / GBK 的区别

| 对比维度 | UTF-8 / GBK | Base64 |
| --- | --- | --- |
| 类型 | 字符编码 | 二进制到文本的编码 |
| 作用 | str ↔ bytes | bytes ↔ 可见文本 |
| 输入对象 | 字符串文本 | 任意 bytes |
| 是否承载语言文字 | 是 | 否 |
| 常见用途 | 文件读写、接口文本、中文编码 | 图片、文件、token、加密结果传输 |
| 是否属于加密 | 否 | 否 |
| 体积变化 | 不确定 | 通常增大约 1/3 |

核心区别：

```text
UTF-8 / GBK：解决"文字如何转换为字节"
Base64：解决"字节如何转换为可见文本"
```

---

## 12. 字符串转 Base64

字符串不能直接进行 Base64 编码，必须先转换为 bytes。

示例代码：

```python
import base64

text = "你好"

data = text.encode("utf-8")      # str -> bytes
b64 = base64.b64encode(data)     # bytes -> Base64 bytes

print(b64)
```

输出：

```python
b'5L2g5aW9'
```

完整流程：

```text
"你好"
  ↓ encode("utf-8")
UTF-8 bytes
  ↓ base64.b64encode()
Base64 bytes: b"5L2g5aW9"
```

如需得到普通字符串形态：

```python
b64_text = b64.decode("ascii")
print(b64_text)
```

输出：

```text
5L2g5aW9
```

---

## 13. Base64 还原为字符串

示例代码：

```python
import base64

b64 = b'5L2g5aW9'

data = base64.b64decode(b64)     # Base64 -> 原始 bytes
text = data.decode("utf-8")      # bytes -> str

print(text)
```

输出：

```text
你好
```

完整流程：

```text
Base64 文本 "5L2g5aW9"
  ↓ base64.b64decode()
UTF-8 bytes
  ↓ decode("utf-8")
"你好"
```

需要注意：

```text
Base64 解码得到的是原始 bytes。
这些 bytes 应以 UTF-8、GBK 还是其他编码执行 decode，
取决于其最初采用何种编码 encode。
```

---

## 14. 常见转换流程汇总

### 14.1 文本写入文件

```text
str → encode("utf-8") → bytes → 写入文件
```

---

### 14.2 从文件读取文本

```text
文件 bytes → decode("utf-8") → str
```

---

### 14.3 GBK 转 UTF-8

```text
GBK bytes → decode("gbk") → str → encode("utf-8") → UTF-8 bytes
```

---

### 14.4 UTF-8 转 GBK

```text
UTF-8 bytes → decode("utf-8") → str → encode("gbk") → GBK bytes
```

---

### 14.5 字符串转 Base64

```text
str → encode("utf-8") → bytes → base64.b64encode() → Base64 bytes / Base64 文本
```

---

### 14.6 Base64 还原字符串

```text
Base64 文本 → base64.b64decode() → 原始 bytes → decode("utf-8") → str
```

---

## 15. 核心规则速查

```text
str 转 bytes：encode
bytes 转 str：decode

decode 依据"原始 bytes 的编码"
encode 依据"期望输出的编码"

UTF-8 / GBK：str ↔ bytes
Base64：bytes ↔ 可见文本

Base64 不是加密，仅是编码。
任何人取得 Base64 字符串均可直接解码还原原始 bytes，
因此敏感数据严禁仅以 Base64 代替加密存储或传输。
```

---

## 16. 一句话总结

```text
字符编码解决文本与字节之间的转换，
Base64 解决字节与可见文本之间的转换。
```

搞清这两条转换链路，乱码和 Base64 相关的绝大多数问题就有了排查方向。如果这篇总结对你有帮助，欢迎点赞、收藏、转发；有问题也欢迎在评论区交流。我是小马不起床，我们下期见。
