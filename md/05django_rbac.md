# Django + MySQL + User + Role 简易 RBAC 权限控制系统

> 本文整理自上传材料，目标是从零搭建一个可运行的 Django 项目，并完成 MySQL 存储、自定义用户模型、角色表、后台管理和基于角色的访问控制。

## 1. 项目目标

本项目实现一个简单的 RBAC（Role-Based Access Control，基于角色的权限控制）系统：

- 使用 Django 创建项目和应用；
- 使用 MySQL 作为数据库；
- 自定义 `User` 用户模型；
- 创建 `Role` 角色模型；
- 实现 `User` 与 `Role` 的关联；
- 在 Django Admin 后台管理用户与角色；
- 通过装饰器实现不同角色访问不同页面。

最终角色关系如下：

```text
一个角色可以对应多个用户
一个用户只能拥有一个角色
```

数据库核心关系：

```text
role.id  ←  user.role_id
```

---

## 2. 创建 Django 项目和应用

### 2.1 创建项目

```bash
django-admin startproject DjangoProject_RBAC
cd DjangoProject_RBAC
```

### 2.2 创建两个 app

```bash
python manage.py startapp user
python manage.py startapp role
```

项目结构大致如下：

```text
DjangoProject_RBAC/
├── manage.py
├── DjangoProject_RBAC/
│   ├── settings.py
│   ├── urls.py
│   └── ...
├── user/
│   ├── models.py
│   ├── admin.py
│   ├── views.py
│   ├── urls.py
│   └── ...
└── role/
    ├── models.py
    ├── admin.py
    └── ...
```

---

## 3. 配置 MySQL

### 3.1 安装 pymysql

```bash
pip install pymysql
```

### 3.2 配置 pymysql

打开：

```text
DjangoProject_RBAC/__init__.py
```

写入：

```python
import pymysql

pymysql.install_as_MySQLdb()
```

### 3.3 创建 MySQL 数据库

进入 MySQL：

```bash
mysql -u root -p
```

创建数据库：

```sql
CREATE DATABASE dj_rbac DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. 修改 settings.py

打开：

```text
DjangoProject_RBAC/settings.py
```

### 4.1 注册 app

在 `INSTALLED_APPS` 中加入：

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "role",
    "user",
]
```

### 4.2 配置自定义用户模型

```python
AUTH_USER_MODEL = "user.User"
```

含义是：使用 `user` app 中的 `User` 模型作为 Django 的用户模型。

### 4.3 配置 MySQL 数据库

将默认 SQLite 配置替换为 MySQL：

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "dj_rbac",
        "USER": "root",
        "PASSWORD": "你的MySQL密码",
        "HOST": "localhost",
        "PORT": "3306",
        "OPTIONS": {
            "charset": "utf8mb4",
        },
    }
}
```

注意：

```python
"USER": "root"
```

不要误写成：

```python
"USER": "roob"
```

否则会导致数据库连接失败。

---

## 5. 创建 Role 模型

打开：

```text
role/models.py
```

写入：

```python
from django.db import models


class Role(models.Model):
    ROLE_CHOICES = (
        ("admin", "管理员"),
        ("editor", "编辑员"),
        ("viewer", "查看者"),
    )

    name = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        unique=True,
        verbose_name="角色名称",
    )

    desc = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="角色描述",
    )

    class Meta:
        db_table = "role"
        verbose_name = "角色"
        verbose_name_plural = "角色"

    def __str__(self):
        return self.get_name_display()
```

该模型会生成 `role` 表，用来保存角色信息：

```text
admin   管理员
editor  编辑员
viewer  查看者
```

---

## 6. 创建 User 模型

打开：

```text
user/models.py
```

写入：

```python
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    role = models.ForeignKey(
        "role.Role",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        verbose_name="角色",
    )

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name="手机号",
    )

    class Meta:
        db_table = "user"
        verbose_name = "用户"
        verbose_name_plural = "用户"

    def __str__(self):
        return self.username

    def is_admin_role(self):
        return self.role and self.role.name == "admin"

    def is_editor_role(self):
        return self.role and self.role.name == "editor"

    def is_viewer_role(self):
        return self.role and self.role.name == "viewer"
```

说明：

- `User` 继承自 Django 的 `AbstractUser`；
- 新增了 `phone` 手机号字段；
- 通过 `role = ForeignKey(...)` 关联角色表；
- 一个用户只能关联一个角色；
- 一个角色可以关联多个用户。

示例关系：

```text
admin 用户 -> 管理员角色
tom 用户   -> 编辑员角色
jack 用户  -> 查看者角色
```

---

## 7. 注册 Django Admin 后台管理

### 7.1 注册 Role

打开：

```text
role/admin.py
```

写入：

```python
from django.contrib import admin
from .models import Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "desc"]
    search_fields = ["name"]
```

### 7.2 注册 User

打开：

```text
user/admin.py
```

写入：

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "id",
        "username",
        "email",
        "phone",
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    ]

    list_filter = [
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    ]

    fieldsets = UserAdmin.fieldsets + (
        (
            "额外信息",
            {
                "fields": (
                    "phone",
                    "role",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "额外信息",
            {
                "fields": (
                    "phone",
                    "role",
                )
            },
        ),
    )
```

这样在后台新增或编辑用户时，就可以看到：

```text
phone
role
```

---

## 8. 执行数据库迁移

执行：

```bash
python manage.py makemigrations
python manage.py migrate
```

迁移成功后，MySQL 中会生成多张表，其中核心表是：

```text
role
user
```

由于 `User` 继承了 `AbstractUser`，Django 还会自动生成：

```text
user_groups
user_user_permissions
```

这是正常现象。

---

## 9. 创建超级管理员

执行：

```bash
python manage.py createsuperuser
```

示例：

```text
Username: admin
Superuser created successfully.
```

创建成功后，`user` 表中会出现一个超级管理员用户。

---

## 10. 启动项目并进入后台

启动服务：

```bash
python manage.py runserver
```

访问后台：

```text
http://127.0.0.1:8000/admin/
```

使用刚创建的管理员账号登录。

---

## 11. 在后台创建角色

进入 Django Admin 后台，找到：

```text
Role / 角色
```

新增三条角色：

```text
name: admin
desc: 管理员
```

```text
name: editor
desc: 编辑员
```

```text
name: viewer
desc: 查看者
```

创建成功后，后台会显示：

```text
管理员 admin
编辑员 editor
查看者 viewer
```

---

## 12. 给 admin 用户分配角色

进入后台：

```text
User / 用户
```

打开 `admin` 用户，找到“角色”字段，选择：

```text
管理员
```

保存后，关系为：

```text
admin 用户 -> admin 角色
```

---

## 13. 编写角色权限判断逻辑

打开：

```text
user/views.py
```

写入：

```python
from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse


def role_required(role_name):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user

            if not user.is_authenticated:
                raise PermissionDenied("请先登录")

            if not user.role:
                raise PermissionDenied("你还没有分配角色")

            if user.role.name != role_name:
                raise PermissionDenied("你没有权限访问这个页面")

            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


@login_required
@role_required("admin")
def admin_page(request):
    return HttpResponse("这是管理员页面，只有 admin 可以访问")


@login_required
@role_required("editor")
def editor_page(request):
    return HttpResponse("这是编辑员页面，只有 editor 可以访问")


@login_required
@role_required("viewer")
def viewer_page(request):
    return HttpResponse("这是查看者页面，只有 viewer 可以访问")
```

核心逻辑是：

```python
@role_required("admin")
```

表示只有 `role.name == "admin"` 的用户才能访问该页面。

---

## 14. 创建 user app 路由

在 `user` 目录下创建：

```text
user/urls.py
```

写入：

```python
from django.urls import path
from . import views


urlpatterns = [
    path("admin-page/", views.admin_page, name="admin_page"),
    path("editor-page/", views.editor_page, name="editor_page"),
    path("viewer-page/", views.viewer_page, name="viewer_page"),
]
```

对应访问地址：

```text
/user/admin-page/
/user/editor-page/
/user/viewer-page/
```

---

## 15. 配置项目主路由

打开：

```text
DjangoProject_RBAC/urls.py
```

写入：

```python
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path("admin/", admin.site.urls),
    path("user/", include("user.urls")),
]
```

注意：

```python
include("user.urls")
```

不要写成：

```python
include("user.urls.py")
```

---

## 16. 测试权限访问

重新启动项目：

```bash
python manage.py runserver
```

先登录后台：

```text
http://127.0.0.1:8000/admin/
```

然后访问管理员页面：

```text
http://127.0.0.1:8000/user/admin-page/
```

如果当前用户是 `admin` 角色，会看到：

```text
这是管理员页面，只有 admin 可以访问
```

完整访问链路如下：

```text
浏览器访问 /user/admin-page/
↓
Django 匹配 DjangoProject_RBAC/urls.py
↓
进入 user/urls.py
↓
执行 views.admin_page
↓
login_required 判断是否登录
↓
role_required("admin") 判断角色是否是 admin
↓
当前用户是 admin 角色
↓
允许访问
```

---

## 17. 测试无权限页面

继续访问：

```text
http://127.0.0.1:8000/user/editor-page/
```

因为当前用户是：

```text
admin 角色
```

而页面要求：

```text
editor 角色
```

所以应该返回：

```text
403 Forbidden
```

访问：

```text
http://127.0.0.1:8000/user/viewer-page/
```

也应返回 `403 Forbidden`。

这是正确结果，说明权限控制生效。

---

## 18. 项目核心文件汇总

最终需要重点关注这些文件：

```text
DjangoProject_RBAC/settings.py
DjangoProject_RBAC/urls.py

role/models.py
role/admin.py

user/models.py
user/admin.py
user/views.py
user/urls.py
```

---

## 19. 完整访问路径

```text
/admin/
```

Django 后台管理页面。

```text
/user/admin-page/
```

管理员页面。

```text
/user/editor-page/
```

编辑员页面。

```text
/user/viewer-page/
```

查看者页面。

---

## 20. 最终流程总结

本项目完整流程如下：

1. 创建 Django 项目；
2. 创建 `user` app；
3. 创建 `role` app；
4. 配置 MySQL；
5. 使用 `pymysql` 连接 MySQL；
6. 自定义 `User` 模型；
7. 创建 `Role` 模型；
8. 建立 `User` 与 `Role` 的外键关系；
9. 执行数据库迁移；
10. 创建超级管理员；
11. 在后台创建角色；
12. 给用户分配角色；
13. 编写角色权限装饰器；
14. 配置 `user` 路由；
15. 配置项目主路由；
16. 测试不同角色页面访问权限。

最终效果：项目已经具备一个完整可运行的 `Django + MySQL + User + Role` 简易权限控制系统。

---
