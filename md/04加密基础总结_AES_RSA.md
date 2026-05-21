# 加密基础总结：AES-CBC 与 RSA

本文整理了常见的对称加密、非对称加密，以及 Python / JavaScript 中 AES-CBC、RSA 的常用实现套路。

---

## 1. 对称加密

对称加密指的是：**加密和解密使用同一个密钥**。

常见对称加密算法：

```text
AES
DES
3DES
```

其中，AES 是实际开发和接口加密中最常见的对称加密算法。

---

## 2. AES 加密基础

### 2.1 AES key 长度

AES 的 key 长度通常有三种：

```text
16 bytes -> AES-128
24 bytes -> AES-192
32 bytes -> AES-256
```

注意：AES 的 key 必须满足对应长度，否则会报错。

---

### 2.2 AES 常见加密模式

AES 常见加密模式：

```text
ECB
CBC
```

---

### 2.3 ECB 模式

ECB 模式特点：

```text
不需要 iv
安全性相对较低
相同明文块会加密出相同密文块
不推荐在真实业务中使用
```

Python 创建方式：

```python
aes = AES.new(key=key, mode=AES.MODE_ECB)
```

---

### 2.4 CBC 模式

CBC 模式特点：

```text
需要 iv
iv 长度必须是 16 bytes
比 ECB 更常见
接口加密、逆向分析中经常遇到
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
pad：加密前补齐明文字节长度
unpad：解密后去除填充
base64：将密文字节转成可传输字符串
```

---

### 3.3 Python AES-CBC 加密流程

```text
1. 准备明文字符串
2. 准备 key 和 iv
3. 创建 AES-CBC 加密器
4. 对明文进行 utf-8 编码
5. 对明文字节进行 padding 填充
6. AES 加密
7. 对密文字节进行 base64 编码
```

示例代码：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import base64

# 明文字符串
s = "我哎樵夫"

key = b'8888888888888888'
iv = b'1234567887654321'

# 1. 创建 AES-CBC 加密器
aes = AES.new(key=key, iv=iv, mode=AES.MODE_CBC)

# 2. utf-8 编码 + padding 填充
ming_bs = pad(s.encode("utf-8"), 16)

# 3. AES 加密
mi_bs = aes.encrypt(ming_bs)

# 4. base64 编码，方便网络传输
b64_str = base64.b64encode(mi_bs).decode()

print(b64_str)
```

---

### 3.4 Python AES-CBC 解密流程

```text
1. 准备 base64 密文
2. 准备 key 和 iv
3. 创建 AES-CBC 解密器
4. 对 base64 密文进行解码
5. AES 解密
6. 去除 padding 填充
7. utf-8 解码得到明文
```

示例代码：

```python
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64

# base64 密文
s = "lGAIAms2Xqhq3E2C85a4vg=="

key = b'8888888888888888'
iv = b'1234567887654321'

# 1. 创建 AES-CBC 解密器
aes = AES.new(key=key, iv=iv, mode=AES.MODE_CBC)

# 2. base64 解码，得到密文字节
mi_bs = base64.b64decode(s)

# 3. AES 解密
ming_bs = aes.decrypt(mi_bs)

# 4. 去除 padding
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

### 4.3 CryptoJS 的两种 AES 写法

CryptoJS 里常见两种写法：

```text
1. 简单加密
2. 高级加密
```

---

### 4.4 简单加密：不推荐跨语言使用

示例：

```javascript
var CryptoJS = require("crypto-js");

var ret = CryptoJS.AES.encrypt("樵夫我爱你", "gaoxing");

console.log(ret.toString());
```

这种写法的问题：

```text
key 和 iv 不是你直接控制的
CryptoJS 内部会根据密码字符串派生 key 和 iv
结果中可能包含 salt
不方便和 Python、Java、Go 等其他语言互通
```

所以在接口逆向、爬虫、跨语言加解密时，不推荐这种写法。

---

### 4.5 CryptoJS 中的 WordArray

如果看到类似对象：

```javascript
{
   words: [ -1453107407, -204822748, -698894314, 635420691 ],
   sigBytes: 16
}
```

基本可以判断使用的是 **CryptoJS**。

---

### 4.6 字符串和 WordArray 的转换

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

### 4.7 高级加密：推荐写法

高级加密的核心是：

```text
key、iv、mode、padding 都明确指定
```

这种写法更适合跨语言互通，例如：

```text
JavaScript 加密，Python 解密
Python 加密，JavaScript 解密
```

---

### 4.8 JS AES-CBC 加密流程

```text
1. 准备明文
2. 准备 key 和 iv
3. 将 key、iv、明文转换成 WordArray
4. 设置 mode 为 CBC
5. 设置 padding 为 Pkcs7
6. AES 加密
7. 取出 ciphertext
8. 转成 base64 字符串
```

示例代码：

```javascript
var CryptoJS = require("crypto-js");

var key = '8888888888888888';
var iv = '1234567887654321';
var ming = "樵夫我不爱你了";

// 全部处理成 CryptoJS 的 WordArray
var key_bs = CryptoJS.enc.Utf8.parse(key);
var iv_bs = CryptoJS.enc.Utf8.parse(iv);
var ming_bs = CryptoJS.enc.Utf8.parse(ming);

// AES-CBC 加密
var mi_bs = CryptoJS.AES.encrypt(ming_bs, key_bs, {
    iv: iv_bs,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
});

// 方式一：取真正的密文字节，然后转 base64
console.log(CryptoJS.enc.Base64.stringify(mi_bs.ciphertext));

// 方式二：直接 toString
console.log(mi_bs.toString());
```

说明：

```text
mi_bs.ciphertext 才是真正的密文字节
CryptoJS.enc.Base64.stringify(mi_bs.ciphertext) 是把密文字节转成 base64
mi_bs.toString() 默认也是把密文转成 base64
```

---

### 4.9 JS AES-CBC 解密流程

```text
1. 准备 base64 密文
2. 准备 key 和 iv
3. 将 key 和 iv 转换成 WordArray
4. 设置 mode 为 CBC
5. 设置 padding 为 Pkcs7
6. AES 解密
7. 转成 utf-8 字符串
```

示例代码：

```javascript
var CryptoJS = require("crypto-js");

var mi_s = "wGZgsMhXpyp1Th8aS7F31kNICAIvcCoVqn9WO11B2pk=";

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

## 5. AES-CBC 固定套路

### 5.1 加密套路

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

### 5.2 解密套路

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

---

## 6. 非对称加密

非对称加密指的是：**加密和解密使用不同的密钥**。

非对称加密中有两个密钥：

```text
公钥 public key
私钥 private key
```

特点：

```text
公钥可以公开
私钥必须保密
公钥加密，私钥解密
私钥签名，公钥验签
```

常见非对称加密算法：

```text
RSA
ECC
DSA
```

---

## 7. RSA 加密核心逻辑

RSA 最常见的用法是：

```text
公钥加密
私钥解密
```

例如：

```text
前端 JavaScript 使用公钥加密密码
后端 Python 使用私钥解密密码
```

也可以用于签名验签：

```text
私钥签名
公钥验签
```

---

## 8. RSA 和 AES 的区别

| 对比项 | AES | RSA |
| --- | --- | --- |
| 类型 | 对称加密 | 非对称加密 |
| 密钥数量 | 1 个 key | 2 个 key |
| 密钥名称 | key | 公钥、私钥 |
| 加密速度 | 快 | 慢 |
| 适合加密内容 | 大量数据 | 少量数据 |
| 常见用途 | 加密接口数据、文件、视频 | 加密密码、AES key、签名验签 |

实际开发中经常使用：

```text
RSA + AES 混合加密
```

核心思想：

```text
RSA 加密 AES 的 key
AES 加密真正的数据
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

# 创建 RSA 密钥对，2048 表示密钥长度
rsa_key = RSA.generate(2048)
```

说明：

```text
rsa_key 里面同时包含公钥和私钥
```

---

### 9.4 导出公钥和私钥

```python
# 导出公钥
pub_key = rsa_key.public_key().export_key()

# 导出私钥
pri_key = rsa_key.export_key()
```

说明：

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

运行后会生成两个文件：

```text
public.txt   公钥
private.txt  私钥
```

---

## 10. PEM 格式和 DER 格式

RSA 密钥常见格式有两种：

```text
PEM
DER
```

---

### 10.1 PEM 格式

默认导出的格式一般是 PEM：

```python
pub_key = rsa_key.public_key().export_key()
pri_key = rsa_key.export_key()
```

PEM 格式长这样：

```text
-----BEGIN PUBLIC KEY-----
xxxxxx
-----END PUBLIC KEY-----
```

或者：

```text
-----BEGIN RSA PRIVATE KEY-----
xxxxxx
-----END RSA PRIVATE KEY-----
```

这种格式适合保存到文件里。

---

### 10.2 DER 格式

DER 是二进制格式：

```python
pub_key = rsa_key.public_key().export_key(format="DER")
pri_key = rsa_key.export_key(format="DER")
```

因为 DER 是二进制，不方便直接展示，所以通常会再做 base64 编码：

```python
import base64
from Crypto.PublicKey import RSA

rsa_key = RSA.generate(2048)

# 公钥 DER 格式，然后 base64 编码
pub_key = rsa_key.public_key().export_key(format="DER")
print(base64.b64encode(pub_key).decode())

# 私钥 DER 格式，然后 base64 编码
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
RSA：用来导入公钥 / 私钥
PKCS1_v1_5：用来创建 RSA 加密器 / 解密器
base64：用来处理密文字节
```

---

### 11.2 加密流程

```text
1. 准备明文字符串
2. 读取 public.txt 公钥
3. 使用 RSA.import_key 导入公钥
4. 创建 RSA 加密器
5. 对明文进行 utf-8 编码
6. 使用公钥加密
7. 将密文字节转成 base64 字符串
```

---

### 11.3 加密代码

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# 明文
s = "我特别爱你"

# 1. 加载公钥
with open("public.txt", mode="rb") as f:
    pub_key_bs = f.read()

# 2. 导入公钥
rsa_key = RSA.import_key(pub_key_bs)

# 3. 创建 RSA 加密器
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)

# 4. 加密，RSA 加密的是字节
mi_bs = rsa_cipher.encrypt(s.encode("utf-8"))

# 5. base64 编码，方便传输
mi_s = base64.b64encode(mi_bs).decode()

print(mi_s)
```

---

## 12. Python RSA 私钥解密

### 12.1 解密流程

```text
1. 准备 base64 密文
2. 读取 private.txt 私钥
3. 使用 RSA.import_key 导入私钥
4. 创建 RSA 解密器
5. base64 解码密文
6. 使用私钥解密
7. utf-8 解码得到明文
```

---

### 12.2 解密代码：私钥来自文件

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# base64 密文
s = "这里放 RSA 加密后的 base64 密文"

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

## 13. 使用 base64 DER 私钥解密

如果私钥不是从文件读取，而是这种形式：

```python
rsa_key = RSA.import_key(base64.b64decode("私钥base64字符串"))
```

这种写法适用于：

```text
私钥是 DER 格式
并且被 base64 编码成字符串
```

示例代码：

```python
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64

# base64 密文
s = "这里放 RSA 加密后的 base64 密文"

# DER 格式私钥的 base64 字符串
private_key_base64 = "这里放私钥base64字符串"

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
    # 第一次运行时生成密钥对
    create_rsa_key()

    ming = "我特别爱你"

    mi = rsa_encrypt(ming)
    print("密文：", mi)

    result = rsa_decrypt(mi)
    print("明文：", result)
```

---

## 15. JavaScript RSA 加密

### 15.1 使用的库

浏览器环境：

```text
JSEncrypt
```

Node 环境：

```text
node-jsencrypt
```

安装：

```bash
npm install node-jsencrypt
```

说明：

```text
JSEncrypt 在浏览器里使用
node-jsencrypt 在 Node.js 里使用
两个库的用法基本一样
```

---

### 15.2 JS RSA 公钥加密

```javascript
// npm install node-jsencrypt

var JSEncrypt = require("node-jsencrypt");

var enc = new JSEncrypt();

enc.setPublicKey("这里放公钥字符串");

var mi = enc.encrypt("我爱你");

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
    var publicKey = "这里放公钥字符串";

    var enc = new JSEncrypt();

    enc.setPublicKey(publicKey);

    return enc.encrypt(ming);
}

var mi = rsaEncrypt("我爱你");

console.log(mi);
```

---

## 16. RSA 重要知识点

### 16.1 公钥和私钥

```text
公钥：可以公开，通常用来加密
私钥：必须保密，通常用来解密
```

一句话：

```text
公钥加密的数据，只有对应的私钥可以解密
```

---

### 16.2 浏览器里一般不会放私钥

浏览器 JS 代码是公开的，所以：

```text
浏览器里一般只放公钥
浏览器里不应该放私钥
```

原因：

```text
私钥一旦放到前端，别人打开浏览器开发者工具就能看到
私钥泄露后，RSA 就失去意义
```

所以一般是：

```text
前端 JS：公钥加密
后端 Python / Java / Go / Node：私钥解密
```

---

### 16.3 RSA 不适合加密大量数据

RSA 有长度限制。

以 2048 位 RSA 为例：

```text
2048 位 = 256 bytes
PKCS1_v1_5 padding 会占用 11 bytes
所以最多只能加密 245 bytes 左右的数据
```

所以 RSA 通常只加密小数据，例如：

```text
密码
token
AES key
随机字符串
```

不适合直接加密大段 JSON、大文件、视频内容。

---

### 16.4 RSA 加密结果每次可能不一样

即使明文、公钥都一样，RSA 加密出来的密文也可能每次不同。

原因是：

```text
RSA 加密时会加入随机填充 padding
```

这是正常现象，不是代码错了。

---

### 16.5 PKCS1_v1_5 是填充方式

Python 代码中：

```python
from Crypto.Cipher import PKCS1_v1_5
```

这里的 `PKCS1_v1_5` 是 RSA 的一种填充方式。

对应加密器 / 解密器创建方式：

```python
rsa_cipher = PKCS1_v1_5.new(key=rsa_key)
```

它常见于接口逆向、老项目加密逻辑中。

---

## 17. 常见接口加密逻辑

笔记中的这句话可以这样理解：

```text
发送包: rsa
回来的包: AES, DES, 自主研发
```

含义：

```text
请求参数中敏感字段，可能用 RSA 加密
响应数据，可能用 AES / DES / 自定义算法加密
```

更常见的完整流程是：

```text
1. 前端随机生成 AES key
2. 用 AES key 加密请求数据
3. 用 RSA 公钥加密 AES key
4. 把 AES 密文和 RSA 密文一起发给服务器
5. 服务器用 RSA 私钥解密 AES key
6. 服务器再用 AES key 解密请求数据
```

---

## 18. RSA + AES 混合加密流程

### 18.1 客户端加密

```text
客户端：
    1. 随机生成 AES key
    2. 使用 AES key 加密真正的数据
    3. 使用 RSA 公钥加密 AES key
    4. 发送：
        - AES 加密后的数据
        - RSA 加密后的 AES key
```

---

### 18.2 服务端解密

```text
服务端：
    1. 接收 AES 密文和 RSA 密文
    2. 使用 RSA 私钥解密出 AES key
    3. 使用 AES key 解密真正的数据
```

---

## 19. RSA 固定套路

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
加密和解密使用同一个 key
速度快
适合加密大量数据
常见模式有 ECB、CBC
CBC 需要 iv
```

---

### 20.2 RSA

```text
RSA 是非对称加密
有公钥和私钥
公钥加密
私钥解密
速度慢
适合加密少量数据
```

---

### 20.3 实际开发最常见组合

```text
RSA + AES
```

核心思想：

```text
RSA 加密 AES key
AES 加密真正的数据
```

最重要的一句话：

> AES 适合加密数据，RSA 适合加密密钥。
