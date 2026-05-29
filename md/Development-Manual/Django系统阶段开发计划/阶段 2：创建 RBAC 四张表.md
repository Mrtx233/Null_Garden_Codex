## 2.1 创建 rbac app
在 `backend` 目录下执行：

```plain
python manage.py startapp rbac
```

执行后会多一个目录：

```plain
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

---

## 2.2 注册 rbac app
打开文件：

```plain
backend/config/settings.py
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

告诉 Django：我新建了一个 rbac 应用，你要管理它里面的数据表。

---

## 2.3 编写 RBAC 四张表模型
打开文件：

```plain
backend/rbac/models.py
backend/rbac/models.py
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

---

## 2.4 解释这 4 个模型
在 Django 里面，我们不直接手写建表 SQL，而是写：

```plain
class SysPermission(models.Model):
```

然后 Django 帮你生成 MySQL 表。

---

### 2.4.1 `SysPermission`
对应：

```plain
sys_permission
```

作用：

```plain
保存系统中有哪些权限
```

例如以后会有：

```plain
user:list      用户列表
user:add       新增用户
user:delete    删除用户
role:list      角色列表
```

最重要字段是：

```plain
permission_code
```

后面判断权限时，就是判断用户有没有这个权限标识。

---

### 2.4.2 `SysRole`
对应：

```plain
sys_role
```

作用：

```plain
保存系统中有哪些角色
```

例如：

```plain
admin    管理员
user     普通用户
```

---

### 2.4.3 `SysRolePermission`
对应：

```plain
sys_role_permission
```

作用：

```plain
保存角色和权限之间的关系
```

比如：

```plain
管理员 拥有 user:list
管理员 拥有 user:add
管理员 拥有 user:delete
普通用户 只拥有 user:list
```

这张表就是 RBAC 的核心关联表。

---

### 2.4.4 `SysUser`
对应：

```plain
sys_user
```

作用：

```plain
保存系统用户
```

每个用户会绑定一个角色：

```plain
用户 -> 角色
```

例如：

```plain
admin -> 管理员
zhangsan -> 普通用户
```

---

## 2.5 把模型注册到 Django 后台
这一阶段虽然还不做登录，但我们先把表注册到 Django Admin，方便你后面查看数据。

打开文件：

```plain
backend/rbac/admin.py
```

把内容改成下面这样。

```plain
backend/rbac/admin.py
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

这一步的作用是：让你在 Django Admin 里可以看到并管理这 4 张表。

---

## 2.6 生成迁移文件
在 `backend` 目录下执行：

```plain
python manage.py makemigrations rbac
```

如果成功，你会看到类似：

```plain
Migrations for 'rbac':
  rbac/migrations/0001_initial.py
    + Create model SysPermission
    + Create model SysRole
    + Create model SysRolePermission
    + Create model SysUser
```

这一步只是生成迁移文件，还没有真正创建数据库表。

---

## 2.7 执行迁移，创建 MySQL 表
继续执行：

```plain
python manage.py migrate
```

如果成功，会看到类似：

```plain
Applying rbac.0001_initial... OK
```

这一步完成后，MySQL 中应该会出现 4 张表：

```plain
sys_permission
sys_role
sys_role_permission
sys_user
```

---

## 2.8 检查 MySQL 是否真的创建成功
进入 MySQL：

```plain
mysql -u root -p
```

选择数据库：

```plain
USE rbac_db;
```

查看表：

```plain
SHOW TABLES;
```

---

## 2.9 启动项目测试
执行：

```plain
python manage.py runserver
```

浏览器访问：

```plain
http://127.0.0.1:8000/admin/
```

如果你之前还没有创建 Django 后台管理员，可以执行：

```plain
python manage.py createsuperuser
```

然后再登录后台。

登录后，你应该可以看到：

```plain
系统权限
系统角色
角色权限关联
系统用户
```

---

