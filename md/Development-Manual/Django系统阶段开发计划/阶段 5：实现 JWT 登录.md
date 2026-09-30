# 阶段 5：实现 JWT 登录

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：5 / 18 ｜ **定位**：基于 JSON Web Token 实现登录发证与 access_token 刷新的后端接口 ｜ **建议学时**：4–6 小时

大家好，我是小马不起床。

---

## 阶段导语

阶段 4 已解决"给定用户与权限标识，如何判断权限"的问题，但接口尚无法识别"当前请求来自哪个用户"。本阶段引入 JSON Web Token（JWT）作为身份载体：登录成功后由后端签发 token，后续请求携带 token，后端解析即可确定当前用户。

本阶段实现登录接口与刷新接口两个端点，内容包含：JWT 选型说明、依赖安装与参数配置、token 工具文件、登录与刷新视图、路由挂载，以及接口测试与完成标准。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 说明 JWT 在"后端识别当前请求用户"这一场景中的作用与使用方式
- [ ] 在 settings.py 中配置 access_token、refresh_token 的有效期与加密算法
- [ ] 编写 jwt_utils.py，实现 access_token 与 refresh_token 的创建及解析
- [ ] 实现 POST /api/login/ 登录接口，完成账号校验并签发双 token
- [ ] 实现 POST /api/token/refresh/ 刷新接口，以 refresh_token 换取新的 access_token
- [ ] 使用 curl 在 Windows PowerShell 与 macOS / Linux 下验证登录、普通用户登录与 token 刷新

---

## 前置知识

本阶段依赖阶段 4（`阶段 4：实现 RBAC 权限判断.md`）的成果：

| 前置条目 | 具体要求 |
|----------|----------|
| 权限判断服务 | `backend/rbac/services.py` 中 RBACService 已完成并通过 shell 验证 |
| 测试数据 | sys_user 中存在 admin、zhangsan，密码均为 123456，status 为 1 |
| 模型定义 | SysUser 提供 check_password 方法，并通过 role 外键关联 SysRole |
| 项目环境 | 可在 `rbac_project/backend` 目录激活虚拟环境并使用 pip |

若上述内容尚不熟悉，建议先完成阶段 4 的学习。

---

## 目录

1. [JWT 的作用与本阶段目标](#1-jwt-的作用与本阶段目标)
2. [安装依赖与配置参数](#2-安装依赖与配置参数)
3. [新建 JWT 工具文件](#3-新建-jwt-工具文件)
4. [编写登录与刷新接口](#4-编写登录与刷新接口)
5. [配置路由](#5-配置路由)
6. [启动服务与接口测试](#6-启动服务与接口测试)
7. [完成标准](#7-完成标准)
8. [阶段小结](#阶段小结)
9. [常见问题与排查](#常见问题与排查)
10. [下一阶段衔接](#下一阶段衔接)

---

## 1. JWT 的作用与本阶段目标

### 1.1 阶段目标

```text
用户输入 username 和 password
  ↓
后端查询 sys_user
  ↓
校验密码
  ↓
登录成功后生成 JWT
  ↓
返回 access_token 和 refresh_token
```

### 1.2 为什么使用 JWT

前序阶段已建立四张表：

```text
sys_user
sys_role
sys_permission
sys_role_permission
```

遗留的问题是：

```text
用户每次请求接口时，后端怎么知道这个请求是谁发来的？
```

答案就是 JWT。登录成功后，后端向前端签发一个 token；前端此后每次请求接口都携带该 token；后端解析 token，即可确定：

```text
当前用户是谁
```

### 1.3 本阶段最终效果

本阶段实现两个接口：

| 接口 | 方法 | 作用 |
|------|------|------|
| `/api/login/` | POST | 账号密码登录，签发双 token |
| `/api/token/refresh/` | POST | 以 refresh_token 换取新的 access_token |

登录接口的请求体：

```text
{
  "username": "admin",
  "password": "123456"
}
```

登录接口的返回：

```text
{
  "access_token": "xxx",
  "refresh_token": "xxx",
  "user": {
    "user_id": 1,
    "username": "admin",
    "real_name": "管理员",
    "role_id": 1,
    "role_name": "管理员"
  }
}
```

刷新接口的请求体：

```text
{
  "refresh_token": "xxx"
}
```

刷新接口的返回：

```text
{
  "access_token": "新的 access_token"
}
```

**本章要点**：

- **要点**：JWT 解决的核心问题是请求身份识别，即后端从 token 中确定当前用户。
- **要点**：token 由登录成功这一动作签发，此后每次接口请求随携带。
- **要点**：登录返回双 token 加用户信息，刷新接口只返回新的 access_token。
- **要点**：本阶段接口路径为 /api/login/ 与 /api/token/refresh/。

---

## 2. 安装依赖与配置参数

### 2.1 安装 PyJWT

确认当前目录为：

```text
rbac_project/backend
```

且虚拟环境已启动。执行安装：

```bash
pip install PyJWT
```

选用 `PyJWT` 而非 Django 认证体系的原因：当前使用的 `sys_user` 是自行设计的业务用户表，而非 Django 默认的 `auth_user` 表，因此直接以通用 JWT 库对接业务模型。

### 2.2 修改配置文件

打开文件：

```text
backend/config/settings.py
```

在文件末尾添加：

```python
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30

JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

JWT_ALGORITHM = "HS256"
```

三项配置的完整含义：

```text
access_token 有效期：30 分钟
refresh_token 有效期：7 天
加密算法：HS256
```

**本章要点**：

- **要点**：依赖安装仅需 PyJWT 一个包，且需在虚拟环境内执行。
- **要点**：业务用户表 sys_user 决定了使用 PyJWT 直连业务模型，绕开 auth_user 体系。
- **要点**：有效期与算法集中于 settings.py，供工具文件通过 django.conf.settings 读取。
- **要点**：access_token 短效（30 分钟）、refresh_token 长效（7 天）是双 token 设计的基础。

---

## 3. 新建 JWT 工具文件

### 3.1 文件路径

新建文件：

```text
backend/rbac/jwt_utils.py
```

### 3.2 完整代码

```python
from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings


def create_access_token(user):
    """
    创建 access_token

    access_token 用来访问接口。
    有效期比较短。
    """

    now = datetime.now(timezone.utc)

    payload = {
        "token_type": "access",
        "user_id": user.user_id,
        "username": user.username,
        "role_id": user.role_id,
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return token


def create_refresh_token(user):
    """
    创建 refresh_token

    refresh_token 用来刷新 access_token。
    有效期比较长。
    """

    now = datetime.now(timezone.utc)

    payload = {
        "token_type": "refresh",
        "user_id": user.user_id,
        "username": user.username,
        "role_id": user.role_id,
        "iat": now,
        "exp": now + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        ),
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return token


def decode_token(token):
    """
    解析 token

    如果 token 正确，返回 payload。
    如果 token 错误或过期，会抛出异常。
    """

    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )

    return payload
```

### 3.3 文件说明

该文件完成三件事。

**1. 创建 access_token**

```text
access_token 是访问接口用的
```

例如后续访问用户列表接口：

```text
GET /api/users/
```

前端需携带请求头：

```text
Authorization: Bearer access_token
```

**2. 创建 refresh_token**

```text
refresh_token 是刷新 access_token 用的
```

access_token 有效期较短（如 30 分钟），过期后前端可用 refresh_token 换取新的 access_token。

**3. 解析 token**

阶段 6 将使用该函数，届时的流程为：

```text
前端携带 token
  ↓
后端解析 token
  ↓
得到 user_id
  ↓
查询 sys_user
  ↓
再做 RBAC 权限判断
```

两种 token 的职责对比：

| 属性 | access_token | refresh_token |
|------|--------------|---------------|
| 用途 | 访问业务接口 | 换取新的 access_token |
| 有效期 | 30 分钟（短） | 7 天（长） |
| payload 中的 token_type | `"access"` | `"refresh"` |
| 携带方式 | Authorization: Bearer 请求头 | 刷新接口请求体 |

**本章要点**：

- **要点**：两个创建函数共享同一签名结构，差异仅在 token_type 与过期时长。
- **要点**：payload 内置 user_id、username、role_id，为后续身份识别提供依据。
- **要点**：签发与解析均使用 settings.SECRET_KEY 与 settings.JWT_ALGORITHM，二者必须一致。
- **要点**：decode_token 对错误或过期的 token 抛出异常，由调用方决定响应方式。
- **要点**：短效 access_token 负责访问、长效 refresh_token 负责续期，构成双 token 机制。

---

## 4. 编写登录与刷新接口

### 4.1 文件与替换说明

打开文件：

```text
backend/rbac/views.py
```

若文件内原本只有默认生成内容，直接替换为下面的完整代码。

### 4.2 完整代码

```python
import json

import jwt
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import SysUser
from .jwt_utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
)


def json_response(data=None, code=200, message="success", status=200):
    """
    统一 JSON 返回格式
    """

    return JsonResponse(
        {
            "code": code,
            "message": message,
            "data": data,
        },
        status=status,
        json_dumps_params={
            "ensure_ascii": False
        }
    )


def get_json_body(request):
    """
    获取 JSON 请求体
    """

    try:
        body = request.body.decode("utf-8")
        if not body:
            return {}

        return json.loads(body)
    except json.JSONDecodeError:
        return None


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    """
    登录接口

    POST /api/login/
    """

    def post(self, request):
        data = get_json_body(request)

        if data is None:
            return json_response(
                message="请求体不是合法 JSON",
                code=400,
                status=400,
            )

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return json_response(
                message="用户名和密码不能为空",
                code=400,
                status=400,
            )

        user = SysUser.objects.select_related("role").filter(
            username=username
        ).first()

        if user is None:
            return json_response(
                message="用户名或密码错误",
                code=400,
                status=400,
            )

        if user.status != 1:
            return json_response(
                message="用户已被禁用",
                code=403,
                status=403,
            )

        if not user.check_password(password):
            return json_response(
                message="用户名或密码错误",
                code=400,
                status=400,
            )

        access_token = create_access_token(user)
        refresh_token = create_refresh_token(user)

        return json_response(
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "real_name": user.real_name,
                    "phone": user.phone,
                    "status": user.status,
                    "role_id": user.role_id,
                    "role_code": user.role.role_code,
                    "role_name": user.role.role_name,
                },
            },
            message="登录成功",
        )


@method_decorator(csrf_exempt, name="dispatch")
class RefreshTokenView(View):
    """
    刷新 access_token 接口

    POST /api/token/refresh/
    """

    def post(self, request):
        data = get_json_body(request)

        if data is None:
            return json_response(
                message="请求体不是合法 JSON",
                code=400,
                status=400,
            )

        refresh_token = data.get("refresh_token")

        if not refresh_token:
            return json_response(
                message="refresh_token 不能为空",
                code=400,
                status=400,
            )

        try:
            payload = decode_token(refresh_token)
        except jwt.ExpiredSignatureError:
            return json_response(
                message="refresh_token 已过期，请重新登录",
                code=401,
                status=401,
            )
        except jwt.InvalidTokenError:
            return json_response(
                message="refresh_token 无效",
                code=401,
                status=401,
            )

        if payload.get("token_type") != "refresh":
            return json_response(
                message="token 类型错误",
                code=401,
                status=401,
            )

        user_id = payload.get("user_id")

        user = SysUser.objects.select_related("role").filter(
            user_id=user_id
        ).first()

        if user is None:
            return json_response(
                message="用户不存在",
                code=404,
                status=404,
            )

        if user.status != 1:
            return json_response(
                message="用户已被禁用",
                code=403,
                status=403,
            )

        new_access_token = create_access_token(user)

        return json_response(
            data={
                "access_token": new_access_token,
            },
            message="刷新成功",
        )
```

### 4.3 登录接口流程

登录接口依次执行以下动作：

```text
1. 接收 username 和 password
2. 查询 sys_user 表
3. 判断用户是否存在
4. 判断用户是否被禁用
5. 校验密码是否正确
6. 创建 access_token
7. 创建 refresh_token
8. 返回 token 和用户信息
```

核心流程可概括为：

```text
sys_user 账号密码正确
  ↓
生成 JWT
  ↓
返回给前端
```

刷新接口的校验顺序为：请求体合法性 → refresh_token 非空 → 解析 token（区分过期与无效）→ token_type 必须为 refresh → 用户存在 → 用户状态正常 → 签发新的 access_token。

**本章要点**：

- **要点**：视图基于 Django 原生 Class-Based View，配合 csrf_exempt 放行 JSON 接口。
- **要点**：统一响应结构 code/message/data 由 json_response 函数集中构建，ensure_ascii=False 保证中文正常输出。
- **要点**：登录对"用户不存在"与"密码错误"返回同一提示，避免暴露账号存在性。
- **要点**：密码校验使用模型的 check_password，与明文存储保持距离。
- **要点**：刷新接口对过期、无效、类型错误三种 token 情况分别返回 401。

---

## 5. 配置路由

### 5.1 创建 rbac 的路由文件

新建文件：

```text
backend/rbac/urls.py
```

写入：

```python
from django.urls import path

from .views import LoginView, RefreshTokenView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("token/refresh/", RefreshTokenView.as_view()),
]
```

该文件生成两个接口路径的相对段：

```text
/api/login/
/api/token/refresh/
```

### 5.2 修改项目总路由

打开文件：

```text
backend/config/urls.py
```

改为：

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("rbac.urls")),
]
```

其含义为：

```text
所有 rbac 的接口都放在 /api/ 下面
```

因此 `rbac/urls.py` 中定义的 `login/`，最终访问地址即为：

```text
/api/login/
```

**本章要点**：

- **要点**：模块路由与项目路由分层，rbac.urls 只管 api/ 之下的相对路径。
- **要点**：include("rbac.urls") 挂载在 "api/" 前缀上，决定所有业务接口的最终地址。
- **要点**：完整路径由"总路由前缀 + 模块路由段"两级拼接而成。

---

## 6. 启动服务与接口测试

### 6.1 启动后端服务

确认当前目录为：

```text
rbac_project/backend
```

执行：

```bash
python manage.py runserver
```

启动后，后端地址为：

```text
http://127.0.0.1:8000
```

### 6.2 测试 admin 登录

Windows PowerShell：

```bash
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","password":"123456"}'
```

macOS / Linux：

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

成功时返回类似结果：

```text
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "xxx.xxx.xxx",
    "refresh_token": "xxx.xxx.xxx",
    "user": {
      "user_id": 1,
      "username": "admin",
      "real_name": "管理员",
      "phone": "13800000000",
      "status": 1,
      "role_id": 1,
      "role_code": "admin",
      "role_name": "管理员"
    }
  }
}
```

### 6.3 测试普通用户登录

Windows PowerShell：

```bash
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"zhangsan","password":"123456"}'
```

macOS / Linux：

```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

成功后同样返回：

```text
access_token
refresh_token
用户信息
```

区别在于用户角色为：

```text
普通用户
```

### 6.4 测试刷新 access_token

先从登录接口的返回结果中复制：

```text
refresh_token
```

然后发起刷新请求。

Windows PowerShell：

```bash
curl -Method POST "http://127.0.0.1:8000/api/token/refresh/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"refresh_token":"这里换成你的refresh_token"}'
```

macOS / Linux：

```bash
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"这里换成你的refresh_token"}'
```

成功返回：

```text
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "access_token": "新的 access_token"
  }
}
```

**本章要点**：

- **要点**：三项测试覆盖管理员登录、普通用户登录与 token 刷新，构成完整验收闭环。
- **要点**：Windows 与类 Unix 的 curl 在参数写法上不同，需按所在系统选择。
- **要点**：刷新测试需人工把登录返回的 refresh_token 代入请求体占位处。
- **要点**：admin 与 zhangsan 的返回结构一致，差异仅在 user 内的角色字段。

---

## 7. 完成标准

本阶段结束时，需逐项确认以下事项：

```text
1. pip install PyJWT 成功
2. backend/rbac/jwt_utils.py 创建成功
3. backend/rbac/views.py 写入登录逻辑
4. backend/rbac/urls.py 创建成功
5. backend/config/urls.py 已经 include rbac.urls
6. POST /api/login/ 可以登录成功
7. 登录成功后能拿到 access_token 和 refresh_token
8. POST /api/token/refresh/ 可以刷新 access_token
```

---

## 阶段小结

| 知识模块 | 核心要点 | 在登录体系中的作用 |
|----------|----------|--------------------|
| JWT 选型 | 业务表 sys_user 而非 auth_user，选用 PyJWT | 以 token 承载请求身份 |
| 配置参数 | 有效期 30 分钟 / 7 天、算法 HS256，集中于 settings.py | 统一控制 token 生命周期 |
| 工具文件 | `jwt_utils.py` 提供两个创建函数与一个解析函数 | 签发与验证的唯一出入口 |
| 登录接口 | 校验存在性、状态、密码后签发双 token 与用户信息 | 身份换 token 的入口 |
| 刷新接口 | 校验 refresh 类型与用户状态后重发 access_token | 短效 token 的续期通道 |
| 路由挂载 | rbac.urls 挂入 config/urls.py 的 api/ 前缀 | 决定 /api/login/ 等最终地址 |
| 接口测试 | admin、zhangsan 登录与刷新三组 curl | 验证登录链路端到端可用 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 登录返回"用户名或密码错误" | sys_user 中无该用户名，或 check_password 校验未通过 | 核对阶段 3 插入的账号与密码（123456） |
| 登录返回"用户已被禁用"（403） | `user.status != 1` | 恢复 sys_user 中该用户的 status 为 1 |
| 接口返回"请求体不是合法 JSON"（400） | 请求体 JSON 格式有误或 Content-Type 未设置 | 检查 curl 请求体引号转义与请求头 |
| 刷新返回"refresh_token 已过期"（401） | 距签发已超过 7 天有效期 | 重新登录获取新的双 token |
| 刷新返回"token 类型错误"（401） | 请求体中传入的是 access_token 而非 refresh_token | 改传登录返回的 refresh_token |
| 刷新返回"refresh_token 无效"（401） | token 被改动或非本系统 SECRET_KEY 签发 | 复制完整未截断的 refresh_token 重试 |
| 刷新返回"用户不存在"（404） | token 中的 user_id 已不在 sys_user 表中 | 以现存账号重新登录 |

---

## 下一阶段衔接

本阶段完成后，后端已能签发并解析 JWT，但业务接口本身仍未受保护：任何请求不带 token 也可以直接访问。

阶段 6（`阶段 6：实现接口权限拦截.md`）将复用本阶段的 `decode_token` 与阶段 4 的 RBACService，通过认证函数与权限装饰器把用户列表、新增、删除等接口保护起来，无 token 返回 401、无权限返回 403。此后阶段 7（`阶段 7：实现 Vue3 登录.md`）再让 Vue3 前端对接本阶段的登录接口，形成端到端的登录与权限链路。
