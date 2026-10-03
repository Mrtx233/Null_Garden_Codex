---
title: "阶段 2：创建 RBAC 四张表"
description: "创建 rbac 应用，以模型方式定义并生成基于角色的访问控制（Role-Based Access Control, RBAC）的四张核心表"
tags:
  - "Django"
  - "开发手册"
---

# 阶段 2：创建 RBAC 四张表

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：2 / 18 ｜ **定位**：创建 rbac 应用，以模型方式定义并生成基于角色的访问控制（Role-Based Access Control, RBAC）的四张核心表 ｜ **建议学时**：4–6 小时

大家好，我是小马不起床。

---

## 阶段导语

阶段 1 交付了可运行且已连接 MySQL 的 Django 项目，本阶段在其 `backend` 目录内创建 `rbac` 应用，完成 RBAC 数据层的落地：编写权限、角色、角色权限关联、用户四个模型，注册到 Django 后台管理（Admin），再通过迁移（migration）在 `rbac_db` 中生成 `sys_permission`、`sys_role`、`sys_role_permission`、`sys_user` 四张表。

四张表构成后续全部权限体系的骨架：阶段 3 向其中填充测试数据，阶段 4 起基于这些数据实现权限判断与接口拦截。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 创建并注册 `rbac` 应用，说明 `INSTALLED_APPS` 的作用
- [ ] 实现四个 RBAC 模型类，描述每张表对应的字段与含义
- [ ] 说明外键（ForeignKey）与多对多（ManyToManyField）关系在权限模型中的用法，以及 `through` 指定中间表的意义
- [ ] 将四个模型注册到 Django Admin，并配置列表展示、搜索与过滤
- [ ] 执行 `makemigrations` 与 `migrate`，在 MySQL 中生成四张表
- [ ] 通过 `SHOW TABLES;` 与 Admin 后台确认建表结果

---

## 前置知识

本阶段依赖阶段 1（阶段 1：创建 Django 项目 + 连接 MySQL.md）的产出：

| 前置条目 | 具体要求 |
|----------|----------|
| 项目结构 | `rbac_project/backend` 已建立，可在 `backend` 下执行 `python manage.py` 系列命令 |
| 数据库连接 | `settings.py` 的 `DATABASES` 已指向 `rbac_db`，`python manage.py migrate` 可成功执行 |
| 语言与时区 | `LANGUAGE_CODE = "zh-hans"`、`TIME_ZONE = "Asia/Shanghai"` 已配置 |

若上述内容尚未完成，建议先完成阶段 1。

---

## 目录

1. [创建并注册 rbac 应用](#1-创建并注册-rbac-应用)
2. [编写 RBAC 四张表模型](#2-编写-rbac-四张表模型)
3. [四个模型说明](#3-四个模型说明)
4. [把模型注册到 Django 后台](#4-把模型注册到-django-后台)
5. [生成并执行迁移](#5-生成并执行迁移)
6. [验证建表结果](#6-验证建表结果)
7. [阶段小结](#阶段小结)
8. [常见问题与排查](#常见问题与排查)
9. [下一阶段衔接](#下一阶段衔接)

---

## 1. 创建并注册 rbac 应用

### 1.1 创建 rbac app

在 `backend` 目录下执行：

```bash
python manage.py startapp rbac
```

执行后会多一个目录：

```text
backend/
├── manage.py
├── config/
└── rbac/
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── tests.py
    └── views.py
```

### 1.2 注册 rbac app

打开文件：

```text
backend/config/settings.py
```

配置为：

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rbac",
]
```

该配置用于告知 Django：新建了一个 rbac 应用，需要管理它里面的数据表。

**要点**

- `startapp` 生成的 `models.py` 与 `admin.py` 是本阶段的两个主要工作文件
- 应用必须写入 `INSTALLED_APPS`，否则 Django 不会为其生成迁移
- `rbac` 追加在 Django 内置应用之后，不影响原有条目

---

## 2. 编写 RBAC 四张表模型

### 2.1 建模方式说明

在 Django 中不直接手写建表 SQL，而是编写继承自 `models.Model` 的模型类：

```python
class SysPermission(models.Model):
```

随后由 Django 依据模型定义生成对应的 MySQL 表。

### 2.2 模型完整代码

文件路径：

```text
backend/rbac/models.py
```

写入以下完整代码：

```python
from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class SysPermission(models.Model):
    """
    系统功能权限定义表
    对应 MySQL 表：sys_permission
    """

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="权限ID"
    )

    permission_code = models.CharField(
        max_length=64,
        verbose_name="权限标识符"
    )

    permission_name = models.CharField(
        max_length=64,
        verbose_name="权限名称"
    )

    menu_path = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="前端路由路径"
    )

    class Meta:
        db_table = "sys_permission"
        verbose_name = "系统权限"
        verbose_name_plural = "系统权限"

    def __str__(self):
        return f"{self.permission_name}({self.permission_code})"


class SysRole(models.Model):
    """
    角色元数据表
    对应 MySQL 表：sys_role
    """

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="角色ID"
    )

    role_code = models.CharField(
        max_length=64,
        verbose_name="角色代码"
    )

    role_name = models.CharField(
        max_length=64,
        verbose_name="角色名称"
    )

    permissions = models.ManyToManyField(
        SysPermission,
        through="SysRolePermission",
        related_name="roles",
        verbose_name="角色权限"
    )

    class Meta:
        db_table = "sys_role"
        verbose_name = "系统角色"
        verbose_name_plural = "系统角色"

    def __str__(self):
        return f"{self.role_name}({self.role_code})"


class SysRolePermission(models.Model):
    """
    角色与权限关联表
    对应 MySQL 表：sys_role_permission
    """

    id = models.BigAutoField(
        primary_key=True,
        verbose_name="关联ID"
    )

    role = models.ForeignKey(
        SysRole,
        on_delete=models.PROTECT,
        db_column="role_id",
        verbose_name="角色ID"
    )

    permission = models.ForeignKey(
        SysPermission,
        on_delete=models.PROTECT,
        db_column="permission_id",
        verbose_name="权限ID"
    )

    class Meta:
        db_table = "sys_role_permission"
        verbose_name = "角色权限关联"
        verbose_name_plural = "角色权限关联"

    def __str__(self):
        return f"{self.role} -> {self.permission}"


class SysUser(models.Model):
    """
    系统用户基础信息表
    对应 MySQL 表：sys_user
    """

    STATUS_CHOICES = (
        (1, "正常"),
        (0, "禁用"),
    )

    user_id = models.BigAutoField(
        primary_key=True,
        verbose_name="用户ID"
    )

    role = models.ForeignKey(
        SysRole,
        on_delete=models.PROTECT,
        db_column="role_id",
        verbose_name="角色ID"
    )

    username = models.CharField(
        max_length=64,
        verbose_name="用户名"
    )

    password = models.CharField(
        max_length=128,
        verbose_name="密码"
    )

    real_name = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="真实姓名"
    )

    phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="手机号"
    )

    status = models.IntegerField(
        default=1,
        choices=STATUS_CHOICES,
        verbose_name="状态"
    )

    class Meta:
        db_table = "sys_user"
        verbose_name = "系统用户"
        verbose_name_plural = "系统用户"

    def set_password(self, raw_password):
        """
        设置密码：把明文密码加密后保存
        """
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """
        校验密码：登录时使用
        """
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username
```

**要点**

- 每个模型通过 `Meta.db_table` 显式指定 MySQL 表名，与数据库设计保持一致
- `SysRole.permissions` 使用多对多关系，并以 `through="SysRolePermission"` 指定中间表
- 外键均设置 `on_delete=models.PROTECT`，防止误删被引用的角色或权限
- `SysUser` 自带 `set_password` 与 `check_password` 两个方法，密码以加密形式存储

---

## 3. 四个模型说明

四个模型与四张表的对应关系及职责如下：

| 模型类 | 对应 MySQL 表 | 作用 |
|--------|---------------|------|
| `SysPermission` | `sys_permission` | 保存系统中有哪些权限 |
| `SysRole` | `sys_role` | 保存系统中有哪些角色 |
| `SysRolePermission` | `sys_role_permission` | 保存角色和权限之间的关系 |
| `SysUser` | `sys_user` | 保存系统用户 |

### 3.1 SysPermission

保存系统中有哪些权限，例如后续会出现的权限项：

| permission_code | 含义 |
|-----------------|------|
| `user:list` | 用户列表 |
| `user:add` | 新增用户 |
| `user:delete` | 删除用户 |
| `role:list` | 角色列表 |

最重要的字段是 `permission_code`，后续判断权限时，即判断用户是否拥有该权限标识。

### 3.2 SysRole

保存系统中有哪些角色，例如：

| role_code | 含义 |
|-----------|------|
| admin | 管理员 |
| user | 普通用户 |

### 3.3 SysRolePermission

保存角色和权限之间的关系，例如：

```text
管理员   拥有 user:list
管理员   拥有 user:add
管理员   拥有 user:delete
普通用户  只拥有 user:list
```

这张表是 RBAC 的核心关联表。

### 3.4 SysUser

保存系统用户。每个用户绑定一个角色，关系方向为：

```text
用户 -> 角色
```

例如：

```text
admin    -> 管理员
zhangsan -> 普通用户
```

**要点**

- 权限判断的依据是 `permission_code`，而非权限名称
- 角色与权限为多对多，用户与角色为一对多（外键）
- `sys_role_permission` 作为中间表承载角色的全部授权记录

---

## 4. 把模型注册到 Django 后台

本阶段虽不实现登录，但先把表注册到 Django Admin，便于后续查看数据。

文件路径：

```text
backend/rbac/admin.py
```

把内容改为以下完整代码：

```python
from django.contrib import admin

from .models import SysPermission, SysRole, SysRolePermission, SysUser


@admin.register(SysPermission)
class SysPermissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "permission_code",
        "permission_name",
        "menu_path",
    )

    search_fields = (
        "permission_code",
        "permission_name",
    )


@admin.register(SysRole)
class SysRoleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "role_code",
        "role_name",
    )

    search_fields = (
        "role_code",
        "role_name",
    )

@admin.register(SysRolePermission)
class SysRolePermissionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "role",
        "permission",
    )


@admin.register(SysUser)
class SysUserAdmin(admin.ModelAdmin):
    list_display = (
        "user_id",
        "username",
        "real_name",
        "phone",
        "role",
        "status",
    )

    search_fields = (
        "username",
        "real_name",
        "phone",
    )

    list_filter = (
        "status",
        "role",
    )

    def save_model(self, request, obj, form, change):
        """
        在后台保存用户时，如果输入的是明文密码，就自动加密。
        """
        if obj.password and not obj.password.startswith("pbkdf2_"):
            obj.set_password(obj.password)

        super().save_model(request, obj, form, change)
```

该步骤的效果：在 Django Admin 中可以看到并管理这 4 张表。

**要点**

- 四个模型分别以 `@admin.register` 装饰器注册
- `list_display`、`search_fields`、`list_filter` 决定后台列表页的展示与检索能力
- `save_model` 中对 `pbkdf2_` 前缀的判断，用于避免对已加密密码二次加密

---

## 5. 生成并执行迁移

### 5.1 生成迁移文件

在 `backend` 目录下执行：

```bash
python manage.py makemigrations rbac
```

成功时输出类似：

```text
Migrations for 'rbac':
  rbac/migrations/0001_initial.py
    + Create model SysPermission
    + Create model SysRole
    + Create model SysRolePermission
    + Create model SysUser
```

该步骤只生成迁移文件，还没有真正创建数据库表。

### 5.2 执行迁移，创建 MySQL 表

继续执行：

```bash
python manage.py migrate
```

成功时输出类似：

```text
Applying rbac.0001_initial... OK
```

完成后，MySQL 中应出现 4 张表：

```text
sys_permission
sys_role
sys_role_permission
sys_user
```

**要点**

- `makemigrations` 与 `migrate` 是两个不可省略、顺序固定的步骤
- 生成迁移时带上应用名 `rbac`，只针对该应用做变更检测
- `Applying rbac.0001_initial... OK` 是建表成功的判定依据

---

## 6. 验证建表结果

### 6.1 检查 MySQL 是否真的创建成功

进入 MySQL：

```bash
mysql -u root -p
```

选择数据库：

```sql
USE rbac_db;
```

查看表：

```sql
SHOW TABLES;
```

### 6.2 启动项目测试

执行：

```bash
python manage.py runserver
```

浏览器访问：

```text
http://127.0.0.1:8000/admin/
```

若此前尚未创建 Django 后台管理员，可执行：

```bash
python manage.py createsuperuser
```

然后再登录后台。登录后可在后台看到：

```text
系统权限
系统角色
角色权限关联
系统用户
```

**要点**

- 验证分两条路径：MySQL 侧以 `SHOW TABLES;` 确认物理表，Admin 侧确认后台管理入口
- Admin 中四个条目名称来自模型 `Meta.verbose_name` 的中文定义
- `createsuperuser` 创建的后台管理员与业务用户 `sys_user` 是两套账号

---

## 阶段小结

| 步骤 | 说明 |
|------|------|
| 创建应用 | `python manage.py startapp rbac` 生成应用目录 |
| 注册应用 | `INSTALLED_APPS` 追加 `"rbac"` |
| 定义模型 | `models.py` 编写四个模型类，显式指定表名与字段 |
| 注册后台 | `admin.py` 配置四个 Admin 类，含明文密码自动加密逻辑 |
| 生成迁移 | `makemigrations rbac` 产出 `0001_initial.py` |
| 执行迁移 | `migrate` 在 `rbac_db` 中创建四张表 |
| 结果验证 | `SHOW TABLES;` 与 Admin 后台双重确认 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| `makemigrations rbac` 提示没有变更 | `rbac` 未写入 `INSTALLED_APPS`，Django 不检测该应用 | 在 `settings.py` 中注册 `"rbac"` 后重新执行 |
| `migrate` 后 MySQL 中没有四张表 | 只执行了 `makemigrations`，未执行 `migrate` | 补执行 `python manage.py migrate`，确认输出 `Applying rbac.0001_initial... OK` |
| 后台 `/admin/` 无法进入 | 尚未创建后台管理员账号 | 执行 `python manage.py createsuperuser` 后再登录 |
| 后台用户表中密码显示为一长串字符 | `save_model` 已按设计将明文密码加密存储 | 属正常现象；核对密码需使用模型的 `check_password` 方法 |
| 模型字段名与表列名不一致导致排查困难 | 未显式指定 `db_column` | 保持代码中 `role_id`、`permission_id` 等 `db_column` 定义，与数据库列名对齐 |

---

## 下一阶段衔接

阶段 2 完成了 RBAC 数据层的建表工作，但四张表尚为空表。阶段 3（阶段 3：插入 RBAC 测试数据.md）将编写自定义管理命令 `init_rbac_data`，向四张表写入权限、角色、授权关系与测试用户数据，使本阶段建立的数据结构具备可验证的内容，为阶段 4 实现 RBAC 权限判断提供数据基础。
