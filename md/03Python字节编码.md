# Python 字符串、字节、编码与 Base64 总结

本文整理 Python 中 `str`、`bytes`、`encode()`、`decode()`、UTF-8、GBK、Base64 的核心概念和常见转换流程。

---

## 目录

1. Python 中的两种核心对象
2. UTF-8 / GBK 是什么
3. encode()：字符串转字节
4. decode()：字节转字符串
5. encode 和 decode 的方向不能反
6. 文件读写的本质
7. GBK 转 UTF-8
8. UTF-8 转 GBK
9. 乱码的本质
10. Base64 是什么
11. Base64 和 UTF-8 / GBK 的区别
12. 字符串转 Base64
13. Base64 还原成字符串
14. 常见转换流程汇总
15. 最重要的总口诀
16. 一句话总结

---

## 1. Python 中的两种核心对象

Python 里需要先分清两个核心对象：

```text
str   = 字符串，人能看的文本
bytes = 字节，文件 / 网络 / 二进制数据
```

示例：

```python
text = "你好"          # str
data = b"hello"        # bytes
```

重点：

```text
文件、网络、图片、压缩包、加密结果，本质上都是 bytes。
Python 里人能直接处理的文本，一般是 str。
```

---

## 2. UTF-8 / GBK 是什么

**UTF-8、GBK 是字符编码。**

它们负责解决：

```text
字符串 str 和 字节 bytes 之间怎么互相转换
```

同一个字符串，用不同编码会得到不同 bytes。

例如：

```text
"你好".encode("utf-8") → E4 BD A0 E5 A5 BD
"你好".encode("gbk")   → C4 E3 BA C3
```

也就是说：

```text
字符串内容一样，底层存储字节可能完全不同。
```

---

## 3. encode()：字符串转字节

`encode()` 的作用：

```text
str.encode(编码) = 把字符串按指定编码转成 bytes
```

示例代码：

```python
text = "你好"

utf8_bytes = text.encode("utf-8")
gbk_bytes = text.encode("gbk")

print(utf8_bytes)
print(gbk_bytes)
```

结果类似：

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

`decode()` 的作用：

```text
bytes.decode(编码) = 把 bytes 按指定编码还原成 str
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

## 5. encode 和 decode 的方向不能反

正确写法：

```python
"你好".encode("utf-8")       # str -> bytes
b"...".decode("utf-8")       # bytes -> str
```

错误写法：

```python
"你好".decode("utf-8")       # 错，str 没有 decode
b"...".encode("utf-8")       # 通常错，bytes 应该 decode
```

记忆口诀：

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

本质是：

```text
文件 bytes → decode("utf-8") → str
```

如果文件实际是 GBK，却用 UTF-8 读取，就可能乱码或报错。

---

### 6.2 写文件

代码：

```python
with open("a.txt", "w", encoding="utf-8") as f:
    f.write("你好")
```

本质是：

```text
str → encode("utf-8") → 文件 bytes
```

如果写成 GBK：

```python
with open("a.txt", "w", encoding="gbk") as f:
    f.write("你好")
```

本质是：

```text
str → encode("gbk") → 文件 bytes
```

---

## 7. GBK 转 UTF-8

GBK 转 UTF-8 不是直接改 bytes，而是：

```text
GBK bytes → 按 GBK 解码成 str → 再按 UTF-8 编码成 bytes
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

注意：

```text
如果字符串里有 emoji、特殊符号，而 GBK 不支持，
encode("gbk") 可能报错。
```

---

## 9. 乱码的本质

乱码的根本原因：

```text
用错编码去 decode bytes
```

例如：

```python
gbk_bytes = b'\xc4\xe3\xba\xc3'
text = gbk_bytes.decode("utf-8")
```

这就是：

```text
GBK bytes 被错误地按 UTF-8 解码
```

可能出现的问题：

```text
UnicodeDecodeError
乱码
```

所以排查乱码时，最重要的问题是：

```text
这串 bytes 原本是什么编码？
我现在用什么编码 decode 它？
```

---

## 10. Base64 是什么

**Base64 是把任意 bytes 转成可见文本的一种编码方式。**

它不是 UTF-8、GBK 那类字符编码。

Base64 解决的是：

```text
二进制 bytes 不方便直接放进 JSON、URL、邮件、文本字段里，
所以先把 bytes 转成一串安全的可见字符。
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

## 11. Base64 和 UTF-8 / GBK 的区别

| 对比 | UTF-8 / GBK | Base64 |
| --- | --- | --- |
| 类型 | 字符编码 | 二进制到文本的编码 |
| 作用 | str ↔ bytes | bytes ↔ 可见文本 |
| 输入 | 字符串文本 | 任意 bytes |
| 是否表示语言文字 | 是 | 不是 |
| 常见用途 | 文件读写、接口文本、中文编码 | 图片、文件、token、加密结果、二进制传输 |
| 是否加密 | 不是 | 不是 |
| 是否会变大 | 不一定 | 通常变大约 1/3 |

核心区别：

```text
UTF-8 / GBK：解决“文字怎么变成字节”
Base64：解决“字节怎么变成可见文本”
```

---

## 12. 字符串转 Base64

字符串不能直接 Base64，必须先变成 bytes。

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

如果想得到普通字符串：

```python
b64_text = b64.decode("ascii")
print(b64_text)
```

输出：

```text
5L2g5aW9
```

---

## 13. Base64 还原成字符串

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

注意：

```text
Base64 解码后得到的是原始 bytes。
至于这些 bytes 要用 utf-8、gbk 还是别的编码 decode，
取决于它们一开始是怎么 encode 的。
```

---

## 14. 常见转换流程汇总

### 14.1 普通文本写入文件

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

## 15. 最重要的总口诀

```text
str 变 bytes：encode
bytes 变 str：decode

decode 看“原始 bytes 是什么编码”
encode 看“你想输出成什么编码”

UTF-8 / GBK：str ↔ bytes
Base64：bytes ↔ 可见文本

Base64 不是加密，只是编码。
只要别人拿到 Base64 字符串，就可以解码还原原始 bytes。
```

---

## 16. 一句话总结

```text
字符编码解决文本和字节之间的转换；
Base64 解决字节和可见文本之间的转换。
```
