# 加密基础总结：AES-CBC 与 RSA

大家好，我是小马不起床。

接口加密是爬虫进阶绕不开的一环：请求参数为什么每次都不一样、密文为什么解不开、前端公钥和后端私钥如何配合——答案都藏在 AES 与 RSA 的基础原理里。本文系统梳理对称加密与非对称加密的核心概念，并给出 Python / JavaScript 双端 AES-CBC、RSA 的标准实现流程，全部代码可直接运行验证。

---

## 目录

1. 对称加密
2. AES 加密基础
3. Python 实现 AES-CBC 加密解密
4. JavaScript 实现 AES-CBC 加密解密
5. AES-CBC 标准流程
6. 非对称加密
7. RSA 加密核心逻辑
8. RSA 与 AES 的区别
9. Python 生成 RSA 密钥对
10. PEM 格式与 DER 格式
11. Python RSA 公钥加密
12. Python RSA 私钥解密
13. 使用 Base64 DER 私钥解密
14. Python RSA 完整示例
15. JavaScript RSA 加密
16. RSA 重要知识点
17. 常见接口加密逻辑
18. RSA + AES 混合加密流程
19. RSA 核心 API 速查
20. 最终总结

---

## 1. 对称加密

对称加密的定义：**加密和解密使用同一个密钥**。

常见对称加密算法：

```text
AES
DES
3DES
```

其中，AES 是当前工程实践与接口加密中最主流的对称加密算法。

---

## 2. AES 加密基础

### 2.1 AES key 长度

AES 的 key 长度共有三种规格：

```text
16 bytes -> AES-128
24 bytes -> AES-192
32 bytes -> AES-256
```

需要满足的约束：AES 的 key 必须严格等于上述长度之一，否则初始化即报错。

---

### 2.2 AES 常见加密模式

常见加密模式：

```text
ECB
CBC
```

---

### 2.3 ECB 模式

ECB 模式特征：

```text
不需要 iv
安全性较低
相同明文块会加密出相同密文块
不建议用于真实业务
```

Python 创建方式：

```python
aes = AES.new(key=key, mode=AES.MODE_ECB)
```

---

### 2.4 CBC 模式

CBC 模式特征：

```text
需要 iv
iv 长度必须为 16 bytes
实际应用比 ECB 更广泛
接口加密与逆向分析中最常遇到
```

Python 创建方式：

```python
aes = AES.new(key=key, iv=iv, mode=AES.MODE_CBC)
```

---

## 3. Python 实现 AES-CBC 加密解密

### 3.1 安装库

```bash
pip install pycryptodome
```

---

### 3.2 导入模块

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64
```

模块说明：

```text
AES：创建 AES 加密器 / 解密器
pad：加密前将明文字节长度补齐至分组倍数
unpad：解密后移除填充
base64：将密文字节转换为可传输字符串
```

---

### 3.3 Python AES-CBC 加密流程

```text
1. 准备明文字符串
2. 准备 key 与 iv
3. 创建 AES-CBC 加密器
4. 对明文执行 utf-8 编码
5. 对明文字节执行 padding 填充
6. 执行 AES 加密
7. 对密文字节执行 base64 编码
```

示例代码：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import base64

# 明文字符串
s = "订单号:20260929001"

key = b'8888888888888888'
iv = b'1234567887654321'

# 1. 创建 AES-CBC 加密器
aes = AES.new(key=key, iv=iv, mode=AES.MODE_CBC)

# 2. utf-8 编码 + padding 填充
ming_bs = pad(s.encode("utf-8"), 16)

# 3. AES 加密
mi_bs = aes.encrypt(ming_bs)

# 4. base64 编码，便于网络传输
b64_str = base64.b64encode(mi_bs).decode()

print(b64_str)
```

---

### 3.4 Python AES-CBC 解密流程

```text
1. 准备 base64 密文
2. 准备 key 与 iv
3. 创建 AES-CBC 解密器
4. 对 base64 密文执行解码
5. 执行 AES 解密
6. 移除 padding 填充
7. utf-8 解码得到明文
```

示例代码：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64

# base64 密文（对应上方加密示例的输出）
s = "替换为实际加密得到的 base64 字符串"

key = b'8888888888888888'
iv = b'1234567887654321'

# 1. 创建 AES-CBC 解密器
aes = AES.new(key=key, iv=iv, mode=AES.MODE_CBC)

# 2. base64 解码，得到密文字节
mi_bs = base64.b64decode(s)

# 3. AES 解密
ming_bs = aes.decrypt(mi_bs)

# 4. 移除 padding
ming_bs = unpad(ming_bs, 16)

# 5. utf-8 解码得到明文
print(ming_bs.decode("utf-8"))
```

---

## 4. JavaScript 实现 AES-CBC 加密解密

### 4.1 安装库

```bash
npm install crypto-js
```

---

### 4.2 导入库

```javascript
var CryptoJS = require("crypto-js");
```

---

### 4.3 CryptoJS 的两种 AES 用法

CryptoJS 中常见的两种用法：

```text
1. 简化模式
2. 显式参数模式
```

---

### 4.4 简化模式：不适用于跨语言场景

示例：

```javascript
var CryptoJS = require("crypto-js");

var ret = CryptoJS.AES.encrypt("示例明文", "gaoxing");

console.log(ret.toString());
```

该写法的问题在于：

```text
key 与 iv 不由调用方直接控制
CryptoJS 内部会根据密码字符串派生 key 与 iv
输出结果中可能包含 salt
无法与 Python、Java、Go 等其他语言互通
```

因此在接口逆向、爬虫采集、跨语言加解密场景中，不应采用该写法。

---

### 4.5 CryptoJS 中的 WordArray

若在调试中看到如下对象：

```javascript
{
   words: [ -1453107407, -204822748, -698894314, 635420691 ],
   sigBytes: 16
}
```

即可判定目标站点使用的是 **CryptoJS**。这一特征在逆向分析中具有很高的识别价值。

---

### 4.6 字符串与 WordArray 的转换

字符串转 WordArray：

```javascript
CryptoJS.enc.Utf8.parse("hello")
```

WordArray 转 utf-8 字符串：

```javascript
wordArray.toString(CryptoJS.enc.Utf8)
```

WordArray 转 hex 字符串：

```javascript
CryptoJS.enc.Hex.stringify(wordArray)
```

hex 字符串转 WordArray：

```javascript
CryptoJS.enc.Hex.parse(hexString)
```

WordArray 转 base64 字符串：

```javascript
CryptoJS.enc.Base64.stringify(wordArray)
```

base64 字符串转 WordArray：

```javascript
CryptoJS.enc.Base64.parse(base64String)
```

---

### 4.7 显式参数模式：推荐写法

显式参数模式的核心是：

```text
key、iv、mode、padding 均明确指定
```

该写法可保证跨语言互通，例如：

```text
JavaScript 加密，Python 解密
Python 加密，JavaScript 解密
```

---

### 4.8 JS AES-CBC 加密流程

```text
1. 准备明文
2. 准备 key 与 iv
3. 将 key、iv、明文转换为 WordArray
4. 指定 mode 为 CBC
5. 指定 padding 为 Pkcs7
6. 执行 AES 加密
7. 取出 ciphertext
8. 转换为 base64 字符串
```

示例代码：

```javascript
var CryptoJS = require("crypto-js");

var key = '8888888888888888';
var iv = '1234567887654321';
var ming = "订单号:20260929001";

// 全部转换为 CryptoJS 的 WordArray
var key_bs = CryptoJS.enc.Utf8.parse(key);
var iv_bs = CryptoJS.enc.Utf8.parse(iv);
var ming_bs = CryptoJS.enc.Utf8.parse(ming);

// AES-CBC 加密
var mi_bs = CryptoJS.AES.encrypt(ming_bs, key_bs, {
    iv: iv_bs,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
});

// 方式一：取出密文字节，再转 base64
console.log(CryptoJS.enc.Base64.stringify(mi_bs.ciphertext));

// 方式二：直接调用 toString
console.log(mi_bs.toString());
```

说明：

```text
mi_bs.ciphertext 为真正的密文数据
CryptoJS.enc.Base64.stringify(mi_bs.ciphertext) 将密文转换为 base64
mi_bs.toString() 默认行为同样是将密文输出为 base64
```

---

### 4.9 JS AES-CBC 解密流程

```text
1. 准备 base64 密文
2. 准备 key 与 iv
3. 将 key 与 iv 转换为 WordArray
4. 指定 mode 为 CBC
5. 指定 padding 为 Pkcs7
6. 执行 AES 解密
7. 转换为 utf-8 字符串
```

示例代码：

```javascript
var CryptoJS = require("crypto-js");

var mi_s = "替换为实际加密得到的 base64 字符串";

var key = '8888888888888888';
var iv = '1234567887654321';

var key_bs = CryptoJS.enc.Utf8.parse(key);
var iv_bs = CryptoJS.enc.Utf8.parse(iv);

var result = CryptoJS.AES.decrypt(mi_s, key_bs, {
    iv: iv_bs,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
});

console.log(result.toString(CryptoJS.enc.Utf8));
```

---

## 5. AES-CBC 标准流程

### 5.1 加密链路

```text
明文字符串
    ↓ utf-8 编码
明文字节
    ↓ padding 填充
填充后的明文字节
    ↓ AES-CBC 加密
密文字节
    ↓ base64 编码
base64 密文字符串
```

---

### 5.2 解密链路

```text
base64 密文字符串
    ↓ base64 解码
密文字节
    ↓ AES-CBC 解密
带 padding 的明文字节
    ↓ unpad 去填充
明文字节
    ↓ utf-8 解码
明文字符串
```

两条链路严格互逆，任一环节的编码方式或填充方式不一致，解密都会失败。

---

## 6. 非对称加密

非对称加密的定义：**加密和解密使用不同的密钥**。

非对称加密包含两个密钥：

```text
公钥 public key
私钥 private key
```

基本特性：

```text
公钥可以公开
私钥必须保密
公钥加密的数据，由对应私钥解密
私钥签名的数据，由对应公钥验签
```

常见非对称加密算法：

```text
RSA
ECC
DSA
```

---

## 7. RSA 加密核心逻辑

RSA 最典型的用法：

```text
公钥加密
私钥解密
```

典型业务形态：

```text
前端 JavaScript 使用公钥加密密码
后端 Python 使用私钥解密密码
```

签名场景则方向相反：

```text
私钥签名
公钥验签
```

---

## 8. RSA 与 AES 的区别

| 对比维度 | AES | RSA |
| --- | --- | --- |
| 类型 | 对称加密 | 非对称加密 |
| 密钥数量 | 1 个 key | 2 个 key |
| 密钥名称 | key | 公钥、私钥 |
| 加密速度 | 快 | 慢 |
| 适合加密的内容 | 大量数据 | 少量数据 |
| 典型用途 | 接口数据、文件、视频 | 密码、AES key、签名验签 |

实际工程中广泛采用的方案：

```text
RSA + AES 混合加密
```

核心思想：

```text
RSA 负责加密 AES 的 key
AES 负责加密真正的业务数据
```

---

## 9. Python 生成 RSA 密钥对

### 9.1 安装库

```bash
pip install pycryptodome
```

---

### 9.2 导入模块

```python
import base64
from Crypto.PublicKey import RSA
```

---

### 9.3 生成密钥对

```python
from Crypto.PublicKey import RSA

# 创建 RSA 密钥对，2048 为密钥长度（位）
rsa_key = RSA.generate(2048)
```

说明：

```text
rsa_key 对象同时包含公钥与私钥
```

---

### 9.4 导出公钥与私钥

```python
# 导出公钥
pub_key = rsa_key.public_key().export_key()

# 导出私钥
pri_key = rsa_key.export_key()
```

对应关系：

```text
rsa_key.public_key().export_key()  导出公钥
rsa_key.export_key()               导出私钥
```

---

### 9.5 写入文件

```python
from Crypto.PublicKey import RSA

# 创建 RSA 密钥对
rsa_key = RSA.generate(2048)

# 导出公钥
pub_key = rsa_key.public_key().export_key()

with open("public.txt", mode="wb") as f:
    f.write(pub_key)

# 导出私钥
pri_key = rsa_key.export_key()

with open("private.txt", mode="wb") as f:
    f.write(pri_key)
```

运行后生成两个文件：

```text
public.txt   公钥
private.txt  私钥
```

安全提示：私钥文件必须严格控制访问权限，不得提交至代码仓库或下发给客户端。

---

## 10. PEM 格式与 DER 格式

RSA 密钥的常见编码格式有两种：

```text
PEM
DER
```

---

### 10.1 PEM 格式

默认导出格式通常为 PEM：

```python
pub_key = rsa_key.public_key().export_key()
pri_key = rsa_key.export_key()
```

PEM 格式的特征：

```text
-----BEGIN PUBLIC KEY-----
xxxxxx
-----END PUBLIC KEY-----
```

或：

```text
-----BEGIN RSA PRIVATE KEY-----
xxxxxx
-----END RSA PRIVATE KEY-----
```

PEM 本质是携带边界标记的 base64 文本，适合存储于文件与配置中。

---

### 10.2 DER 格式

DER 为纯二进制格式：

```python
pub_key = rsa_key.public_key().export_key(format="DER")
pri_key = rsa_key.export_key(format="DER")
```

由于 DER 是二进制，不便于直接传输与展示，工程实践中通常在其之上再做一层 base64 编码：

```python
import base64
from Crypto.PublicKey import RSA

rsa_key = RSA.generate(2048)

# 公钥导出为 DER，再做 base64 编码
pub_key = rsa_key.public_key().export_key(format="DER")
print(base64.b64encode(pub_key).decode())

# 私钥导出为 DER，再做 base64 编码
pri_key = rsa_key.export_key(format="DER")
print(base64.b64encode(pri_key).decode())
```

---

## 11. Python RSA 公钥加密

### 11.1 导入模块

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64
```

说明：

```text
RSA：用于导入公钥 / 私钥
PKCS1_v1_5：用于创建 RSA 加密器 / 解密器
base64：用于处理密文字节
```

---

### 11.2 加密流程

```text
1. 准备明文字符串
2. 读取 public.txt 公钥
3. 通过 RSA.import_key 导入公钥
4. 创建 RSA 加密器
5. 对明文执行 utf-8 编码
6. 使用公钥加密
7. 将密文字节转换为 base64 字符串
```

---

### 11.3 加密代码

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# 明文
s = "用户提交的敏感数据"

# 1. 加载公钥
with open("public.txt", mode="rb") as f:
    pub_key_bs = f.read()

# 2. 导入公钥
rsa_key = RSA.import_key(pub_key_bs)

# 3. 创建 RSA 加密器
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

# 4. 加密，注意 RSA 加密的输入是字节
mi_bs = rsa_cipher.encrypt(s.encode("utf-8"))

# 5. base64 编码，便于传输
mi_s = base64.b64encode(mi_bs).decode()

print(mi_s)
```

---

## 12. Python RSA 私钥解密

### 12.1 解密流程

```text
1. 准备 base64 密文
2. 读取 private.txt 私钥
3. 通过 RSA.import_key 导入私钥
4. 创建 RSA 解密器
5. base64 解码密文
6. 使用私钥解密
7. utf-8 解码得到明文
```

---

### 12.2 解密代码：私钥来源于文件

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# base64 密文
s = "此处填入 RSA 加密后的 base64 密文"

# 1. 加载私钥
with open("private.txt", mode="rb") as f:
    pri_key_bs = f.read()

# 2. 导入私钥
rsa_key = RSA.import_key(pri_key_bs)

# 3. 创建 RSA 解密器
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

# 4. base64 解码密文
mi_bs = base64.b64decode(s)

# 5. 私钥解密
ming_bs = rsa_cipher.decrypt(mi_bs, None)

# 6. 字节转字符串
print(ming_bs.decode("utf-8"))
```

---

## 13. 使用 Base64 DER 私钥解密

若私钥并非来自文件，而是以 base64 字符串形式提供：

```python
rsa_key = RSA.import_key(base64.b64decode("私钥 base64 字符串"))
```

该写法适用于：

```text
私钥为 DER 格式
且已被 base64 编码为字符串
```

示例代码：

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# base64 密文
s = "此处填入 RSA 加密后的 base64 密文"

# DER 格式私钥的 base64 字符串
private_key_base64 = "此处填入私钥 base64 字符串"

# 1. base64 解码私钥
pri_key_bs = base64.b64decode(private_key_base64)

# 2. 导入私钥
rsa_key = RSA.import_key(pri_key_bs)

# 3. 创建 RSA 解密器
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

# 4. base64 解码密文
mi_bs = base64.b64decode(s)

# 5. 私钥解密
ming_bs = rsa_cipher.decrypt(mi_bs, None)

print(ming_bs.decode("utf-8"))
```

---

## 14. Python RSA 完整示例

```python
# pip install pycryptodome

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64


# =========================
# 1. 生成 RSA 密钥对
# =========================

def create_rsa_key():
    rsa_key = RSA.generate(2048)

    # 公钥
    pub_key = rsa_key.public_key().export_key()

    with open("public.txt", mode="wb") as f:
        f.write(pub_key)

    # 私钥
    pri_key = rsa_key.export_key()

    with open("private.txt", mode="wb") as f:
        f.write(pri_key)


# =========================
# 2. RSA 公钥加密
# =========================

def rsa_encrypt(s):
    # 加载公钥
    with open("public.txt", mode="rb") as f:
        pub_key_bs = f.read()

    # 导入公钥
    rsa_key = RSA.import_key(pub_key_bs)

    # 创建加密器
    rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

    # 加密
    mi_bs = rsa_cipher.encrypt(s.encode("utf-8"))

    # base64 编码
    return base64.b64encode(mi_bs).decode()


# =========================
# 3. RSA 私钥解密
# =========================

def rsa_decrypt(s):
    # 加载私钥
    with open("private.txt", mode="rb") as f:
        pri_key_bs = f.read()

    # 导入私钥
    rsa_key = RSA.import_key(pri_key_bs)

    # 创建解密器
    rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

    # base64 解码密文
    mi_bs = base64.b64decode(s)

    # 解密
    ming_bs = rsa_cipher.decrypt(mi_bs, None)

    return ming_bs.decode("utf-8")


if __name__ == '__main__':
    # 首次运行时生成密钥对
    create_rsa_key()

    ming = "接口加密传输测试数据"

    mi = rsa_encrypt(ming)
    print("密文：", mi)

    result = rsa_decrypt(mi)
    print("明文：", result)
```

---

## 15. JavaScript RSA 加密

### 15.1 库的选择

浏览器环境：

```text
JSEncrypt
```

Node.js 环境：

```text
node-jsencrypt
```

安装：

```bash
npm install node-jsencrypt
```

说明：

```text
JSEncrypt 用于浏览器环境
node-jsencrypt 用于 Node.js 环境
两个库的 API 基本一致
```

---

### 15.2 JS RSA 公钥加密

```javascript
// npm install node-jsencrypt

var JSEncrypt = require("node-jsencrypt");

var enc = new JSEncrypt();

enc.setPublicKey("此处填入公钥字符串");

var mi = enc.encrypt("待加密的明文");

console.log(mi);
```

输出结果：

```text
RSA 加密后的 base64 密文
```

---

### 15.3 JS RSA 加密封装

```javascript
// npm install node-jsencrypt

var JSEncrypt = require("node-jsencrypt");

function rsaEncrypt(ming) {
    var publicKey = "此处填入公钥字符串";

    var enc = new JSEncrypt();

    enc.setPublicKey(publicKey);

    return enc.encrypt(ming);
}

var mi = rsaEncrypt("待加密的明文");

console.log(mi);
```

---

## 16. RSA 重要知识点

### 16.1 公钥与私钥

```text
公钥：可以公开，通常用于加密
私钥：必须保密，通常用于解密
```

核心结论：

```text
公钥加密的数据，仅可由对应私钥解密
```

---

### 16.2 浏览器端不应出现私钥

浏览器 JS 代码对用户完全可见，因此：

```text
前端只应持有公钥
前端绝不应持有私钥
```

原因：

```text
私钥一旦置于前端，任何人通过开发者工具即可获取
私钥泄露后，整套 RSA 加密体系即失去意义
```

因此标准架构为：

```text
前端 JS：公钥加密
后端 Python / Java / Go / Node：私钥解密
```

---

### 16.3 RSA 不适合加密大量数据

RSA 存在固有的长度限制。

以 2048 位 RSA 为例：

```text
2048 位 = 256 bytes
PKCS1_v1_5 padding 占用 11 bytes
故单次加密上限约为 245 bytes
```

因此 RSA 通常仅加密小体量数据，例如：

```text
密码
token
AES key
随机字符串
```

大段 JSON、文件、视频内容不应直接使用 RSA 加密。

---

### 16.4 RSA 加密结果每次可能不同

即使明文与公钥完全一致，RSA 每次输出的密文也可能不同。

原因在于：

```text
RSA 加密过程中引入了随机填充 padding
```

这属于正常现象，并非代码缺陷。逆向分析时不应以"密文不一致"判断加密实现有误。

---

### 16.5 PKCS1_v1_5 是填充方案

Python 代码中：

```python
from Crypto.Cipher import PKCS1_v1_5
```

`PKCS1_v1_5` 是 RSA 的一种填充方案。

对应的加密器 / 解密器创建方式：

```python
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)
```

该方案广泛见于接口逆向与存量项目的加密逻辑中，与之并列的还有更安全的 OAEP 方案。

---

## 17. 常见接口加密逻辑

逆向分析中常见这样一种流量特征：

```text
发送包: rsa
回来的包: AES, DES, 自主研发
```

其含义为：

```text
请求参数中的敏感字段，可能采用 RSA 加密
响应数据，可能采用 AES / DES / 自定义算法加密
```

工程上更完整的标准流程是：

```text
1. 前端随机生成 AES key
2. 用 AES key 加密请求数据
3. 用 RSA 公钥加密 AES key
4. 将 AES 密文与 RSA 密文一并发送至服务器
5. 服务器用 RSA 私钥解密出 AES key
6. 服务器再用 AES key 解密请求数据
```

---

## 18. RSA + AES 混合加密流程

### 18.1 客户端加密

```text
客户端：
    1. 随机生成 AES key
    2. 使用 AES key 加密业务数据
    3. 使用 RSA 公钥加密 AES key
    4. 发送：
        - AES 加密后的数据
        - RSA 加密后的 AES key
```

---

### 18.2 服务端解密

```text
服务端：
    1. 接收 AES 密文与 RSA 密文
    2. 使用 RSA 私钥解密出 AES key
    3. 使用 AES key 解密业务数据
```

该方案兼顾了 RSA 的密钥分发安全与 AES 的加解密性能，是当前接口加密的主流范式。

---

## 19. RSA 核心 API 速查

### 19.1 生成密钥对

```python
rsa_key = RSA.generate(2048)
```

---

### 19.2 导出公钥

```python
pub_key = rsa_key.public_key().export_key()
```

---

### 19.3 导出私钥

```python
pri_key = rsa_key.export_key()
```

---

### 19.4 导入公钥 / 私钥

```python
rsa_key = RSA.import_key(key_bytes)
```

---

### 19.5 创建 RSA 加密器 / 解密器

```python
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)
```

---

### 19.6 公钥加密

```python
mi_bs = rsa_cipher.encrypt(s.encode("utf-8"))
mi_s = base64.b64encode(mi_bs).decode()
```

---

### 19.7 私钥解密

```python
mi_bs = base64.b64decode(s)
ming_bs = rsa_cipher.decrypt(mi_bs, None)
ming = ming_bs.decode("utf-8")
```

---

## 20. 最终总结

### 20.1 AES

```text
AES 是对称加密
加密与解密使用同一个 key
速度快
适合加密大量数据
常见模式有 ECB、CBC
CBC 需要 iv
```

---

### 20.2 RSA

```text
RSA 是非对称加密
拥有公钥与私钥
公钥加密
私钥解密
速度慢
适合加密少量数据
```

---

### 20.3 工程实践中最常见的组合

```text
RSA + AES 混合加密
```

一句话概括两者分工：

```text
RSA 解决"AES 的 key 怎么安全送达"，AES 解决"数据怎么高效加解密"。
```

以上是本篇的全部内容，对称与非对称的边界、混合加密流程是重点，建议结合 17、18 两节反复推演。觉得有帮助的话，欢迎点赞、收藏、转发；接口加密相关的问题也欢迎评论区交流。我是小马不起床，我们下期见。
