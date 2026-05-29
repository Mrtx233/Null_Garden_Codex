本阶段目标：

```plain
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

---

## 5.1 为什么这一阶段要用 JWT？
前面我们已经有了：

```plain
sys_user
sys_role
sys_permission
sys_role_permission
```

现在的问题是：

```plain
用户每次请求接口时，后端怎么知道这个请求是谁发来的？
```

答案就是 JWT。

登录成功后，后端给前端一个 token。

前端以后每次请求接口都带上这个 token。

后端解析 token，就能知道：

```plain
当前用户是谁
```

---

## 5.2 本阶段最终效果
我们会实现两个接口：

```plain
POST /api/login/
POST /api/token/refresh/
```

### 5.2.1 登录接口
请求：

```plain
{
  "username": "admin",
  "password": "123456"
}
```

返回：

```plain
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

### 5.2.2 刷新 token 接口
请求：

```plain
{
  "refresh_token": "xxx"
}
```

返回新的：

```plain
{
  "access_token": "新的 access_token"
}
```

---

## 5.3 安装 JWT 依赖
确认你在：

```plain
rbac_project/backend
```

并且虚拟环境已经启动。

安装：

```plain
pip install PyJWT
```

这里使用 `PyJWT`，因为我们现在的 `sys_user` 是你自己设计的业务用户表，不是 Django 默认的 `auth_user` 表。

---

## 5.4 修改配置文件
打开文件：

```plain
backend/config/settings.py
```

在文件最后添加：

```plain
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30

JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

JWT_ALGORITHM = "HS256"
```

完整意思是：

```plain
access_token 有效期：30 分钟
refresh_token 有效期：7 天
加密算法：HS256
```

---

## 5.5 新建 JWT 工具文件
新建文件：

```plain
backend/rbac/jwt_utils.py
```

写入完整代码：

```plain
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

---

## 5.6 解释这个文件
这个文件做三件事。

### 5.6.1 创建 access_token
```plain
access_token 是访问接口用的
```

例如以后访问用户列表接口：

```plain
GET /api/users/
```

前端要带：

```plain
Authorization: Bearer access_token
```

---

### 5.6.2 创建 refresh_token
```plain
refresh_token 是刷新 access_token 用的
```

因为 access_token 有效期短，比如 30 分钟。

过期后，前端可以用 refresh_token 换新的 access_token。

---

### 5.6.3 解析 token
后面阶段 6 会用它。

阶段 6 的流程会是：

```plain
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

---

## 5.7 编写登录接口
打开文件：

```plain
backend/rbac/views.py
```

如果里面原来只有默认内容，直接替换成下面代码：

```plain
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

---

## 5.8 解释登录接口流程
登录接口做了这些事：

```plain
1. 接收 username 和 password
2. 查询 sys_user 表
3. 判断用户是否存在
4. 判断用户是否被禁用
5. 校验密码是否正确
6. 创建 access_token
7. 创建 refresh_token
8. 返回 token 和用户信息
```

核心流程是：

```plain
sys_user 账号密码正确
  ↓
生成 JWT
  ↓
返回给前端
```

---

## 5.9 创建 rbac 的路由文件
新建文件：

```plain
backend/rbac/urls.py
```

写入：

```plain
from django.urls import path

from .views import LoginView, RefreshTokenView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("token/refresh/", RefreshTokenView.as_view()),
]
```

这里会生成两个接口：

```plain
/api/login/
/api/token/refresh/
```

---

## 5.10 修改项目总路由
打开文件：

```plain
backend/config/urls.py
```

改成下面这样：

```plain
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("rbac.urls")),
]
```

意思是：

```plain
所有 rbac 的接口都放在 /api/ 下面
```

所以：

```plain
rbac/urls.py 里面的 login/
```

最终访问地址就是：

```plain
/api/login/
```

---

## 5.11 启动后端服务
确认在：

```plain
rbac_project/backend
```

执行：

```plain
python manage.py runserver
```

启动后，后端地址是：

```plain
http://127.0.0.1:8000
```

---

## 5.12 测试登录接口
Windows PowerShell

```plain
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","password":"123456"}'
```

macOS / Linux

```plain
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

如果成功，你会看到类似结果：

```plain
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

---

## 5.13 测试普通用户登录
Windows PowerShell

```plain
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"zhangsan","password":"123456"}'
```

macOS / Linux

```plain
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

成功后也会返回：

```plain
access_token
refresh_token
用户信息
```

区别是用户角色是：

```plain
普通用户
```

---

## 5.14 测试刷新 access_token
先从登录接口返回结果里复制：

```plain
refresh_token
```

然后请求：

Windows PowerShell

```plain
curl -Method POST "http://127.0.0.1:8000/api/token/refresh/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"refresh_token":"这里换成你的refresh_token"}'
```

macOS / Linux

```plain
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"这里换成你的refresh_token"}'
```

成功返回：

```plain
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "access_token": "新的 access_token"
  }
}
```

---

## 5.15 阶段 5 完成标准
你只需要确认这几件事：

```plain
1. pip install PyJWT 成功
2. backend/rbac/jwt_utils.py 创建成功
3. backend/rbac/views.py 写入登录逻辑
4. backend/rbac/urls.py 创建成功
5. backend/config/urls.py 已经 include rbac.urls
6. POST /api/login/ 可以登录成功
7. 登录成功后能拿到 access_token 和 refresh_token
8. POST /api/token/refresh/ 可以刷新 access_token
```

