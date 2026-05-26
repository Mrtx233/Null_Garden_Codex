# 阶段 1：创建 Django 项目 + 连接 MySQL

## 1.1 项目名称

我们统一使用这个项目名：

```
rbac_project
rbac_project/
└── backend/
    ├── manage.py
    └── config/
        ├── settings.py
        ├── urls.py
        ├── asgi.py
        └── wsgi.py
rbac_project 是总项目文件夹
backend 是 Django 后端文件夹
config 是 Django 的配置目录
```

------

## 1.2 安装当前阶段需要的包

```
pip install django mysqlclient
```

如果你是 Windows，`mysqlclient` 安装失败，可以先用：

```
pip install pymysql
```

不过优先推荐先试 `mysqlclient`。

------

## 1.3 创建 Django 项目

```
backend/
├── manage.py
├── venv/
└── config/
    ├── __init__.py
    ├── settings.py
    ├── urls.py
    ├── asgi.py
    └── wsgi.py
```

------

## 1.4 创建 MySQL 数据库

```
mysql -u root -p
CREATE DATABASE rbac_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
exit;
```

------

## 1.5 修改 Django 配置连接 MySQL

```
backend/config/settings.py
```

找到原来的 `DATABASES`：

把它改成：

```
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "rbac_db",
        "USER": "root",
        "PASSWORD": "你的MySQL密码",
        "HOST": "127.0.0.1",
        "PORT": "3306",
        "OPTIONS": {
            "charset": "utf8mb4",
        },
    }
}
```

------

## 1.6 修改语言和时区

还是在：

```
backend/config/settings.py
```

找到：

```
LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"
```

改成：

```
LANGUAGE_CODE = "zh-hans"

TIME_ZONE = "Asia/Shanghai"
```

------

## 1.7 测试数据库连接

执行：

```
python manage.py migrate
```

这一步的作用是：

```
让 Django 创建它自己默认需要的表。
```

如果成功，你会看到类似：

```
Applying contenttypes.0001_initial... OK
Applying auth.0001_initial... OK
Applying admin.0001_initial... OK
Applying sessions.0001_initial... OK
```

然后你的 MySQL 数据库 `rbac_db` 里会多出一些 Django 默认表。

------

## 1.8 启动 Django 项目

执行：

```
python manage.py runserver
```

浏览器访问：

```
http://127.0.0.1:8000/
```

如果看到 Django 的欢迎页面，说明阶段 1 成功。

------

# 阶段 2：创建 RBAC 四张表

## 2.1 创建 rbac app

在 `backend` 目录下执行：

```
python manage.py startapp rbac
```

执行后会多一个目录：

```
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

------

## 2.2 注册 rbac app

打开文件：

```
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

------

## 2.3 编写 RBAC 四张表模型

打开文件：

```
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

------

## 2.4 解释这 4 个模型

在 Django 里面，我们不直接手写建表 SQL，而是写：

```
class SysPermission(models.Model):
```

然后 Django 帮你生成 MySQL 表。

------

### 2.4.1 `SysPermission`

对应：

```
sys_permission
```

作用：

```
保存系统中有哪些权限
```

例如以后会有：

```
user:list      用户列表
user:add       新增用户
user:delete    删除用户
role:list      角色列表
```

最重要字段是：

```
permission_code
```

后面判断权限时，就是判断用户有没有这个权限标识。

------

### 2.4.2 `SysRole`

对应：

```
sys_role
```

作用：

```
保存系统中有哪些角色
```

例如：

```
admin    管理员
user     普通用户
```

------

### 2.4.3 `SysRolePermission`

对应：

```
sys_role_permission
```

作用：

```
保存角色和权限之间的关系
```

比如：

```
管理员 拥有 user:list
管理员 拥有 user:add
管理员 拥有 user:delete
普通用户 只拥有 user:list
```

这张表就是 RBAC 的核心关联表。

------

### 2.4.4 `SysUser`

对应：

```
sys_user
```

作用：

```
保存系统用户
```

每个用户会绑定一个角色：

```
用户 -> 角色
```

例如：

```
admin -> 管理员
zhangsan -> 普通用户
```

------

## 2.5 把模型注册到 Django 后台

这一阶段虽然还不做登录，但我们先把表注册到 Django Admin，方便你后面查看数据。

打开文件：

```
backend/rbac/admin.py
```

把内容改成下面这样。

```
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

------

## 2.6 生成迁移文件

在 `backend` 目录下执行：

```
python manage.py makemigrations rbac
```

如果成功，你会看到类似：

```
Migrations for 'rbac':
  rbac/migrations/0001_initial.py
    + Create model SysPermission
    + Create model SysRole
    + Create model SysRolePermission
    + Create model SysUser
```

这一步只是生成迁移文件，还没有真正创建数据库表。

------

## 2.7 执行迁移，创建 MySQL 表

继续执行：

```
python manage.py migrate
```

如果成功，会看到类似：

```
Applying rbac.0001_initial... OK
```

这一步完成后，MySQL 中应该会出现 4 张表：

```
sys_permission
sys_role
sys_role_permission
sys_user
```

------

## 2.8 检查 MySQL 是否真的创建成功

进入 MySQL：

```
mysql -u root -p
```

选择数据库：

```
USE rbac_db;
```

查看表：

```
SHOW TABLES;
```

------

## 2.9 启动项目测试

执行：

```
python manage.py runserver
```

浏览器访问：

```
http://127.0.0.1:8000/admin/
```

如果你之前还没有创建 Django 后台管理员，可以执行：

```
python manage.py createsuperuser
```

然后再登录后台。

登录后，你应该可以看到：

```
系统权限
系统角色
角色权限关联
系统用户
```

------

# 阶段 3：插入 RBAC 测试数据

本阶段目标：

```
1. 创建几个权限
2. 创建两个角色
3. 给角色分配权限
4. 创建两个系统用户
5. 验证数据库里已经有完整 RBAC 数据
```

------

## 3.1 本阶段要插入的数据

### 3.1.1 权限数据

插入到：

```
sys_permission
```

数据如下：

| ***\*permission_code\**** | ***\*permission_name\**** | ***\*menu_path\**** |
| ------------------------- | ------------------------- | ------------------- |
| user:list                 | 用户列表                  | /users              |
| user:add                  | 新增用户                  | /users              |
| user:delete               | 删除用户                  | /users              |
| role:list                 | 角色列表                  | /roles              |

------

### 3.1.2 角色数据

插入到：

```
sys_role
```

数据如下：

| ***\*role_code\**** | ***\*role_name\**** |
| ------------------- | ------------------- |
| admin               | 管理员              |
| user                | 普通用户            |

------

### 3.1.3 角色权限关系

插入到：

```
sys_role_permission
```

管理员拥有全部权限：

```
admin:
- user:list
- user:add
- user:delete
- role:list
```

普通用户只拥有用户列表权限：

```
user:
- user:list
```

------

### 3.1.4 用户数据

插入到：

```
sys_user
```

数据如下：

| ***\*username\**** | ***\*password\**** | ***\*role\**** |
| ------------------ | ------------------ | -------------- |
| admin              | 123456             | 管理员         |
| zhangsan           | 123456             | 普通用户       |

注意：

```
这里的 admin 是 sys_user 表里的业务用户，
不是 Django 后台 /admin/ 的超级管理员。
```

------

## 3.2 创建初始化命令文件

### 3.2.1 第 1 步：创建目录

确认你现在在：

```
rbac_project/backend
```

执行：

macOS / Linux

```
mkdir -p rbac/management/commands
```

Windows

如果你用的是 PowerShell，可以执行：

```
mkdir rbac\management\commands
```

如果提示目录已经存在，没关系。

------

### 3.2.2 第 2 步：创建空的 `__init__.py`

Django 需要识别这是一个 Python 包。

创建这两个空文件：

```
backend/rbac/management/__init__.py
backend/rbac/management/commands/__init__.py
```

这两个文件里面什么都不用写。

目录结构变成这样：

```
backend/
└── rbac/
    ├── management/
    │   ├── __init__.py
    │   └── commands/
    │       ├── __init__.py
    │       └── init_rbac_data.py
    ├── models.py
    ├── admin.py
    └── ...
```

------

### 3.2.3 第 3 步：创建初始化命令

新建文件：

```
backend/rbac/management/commands/init_rbac_data.py
```

写入下面完整代码：

```
from django.core.management.base import BaseCommand

from rbac.models import SysPermission, SysRole, SysUser


class Command(BaseCommand):
    help = "初始化 RBAC 测试数据"

    def handle(self, *args, **options):
        """
        执行命令：
        python manage.py init_rbac_data
        """

        # 1. 创建权限数据
        permissions_data = [
            {
                "permission_code": "user:list",
                "permission_name": "用户列表",
                "menu_path": "/users",
            },
            {
                "permission_code": "user:add",
                "permission_name": "新增用户",
                "menu_path": "/users",
            },
            {
                "permission_code": "user:delete",
                "permission_name": "删除用户",
                "menu_path": "/users",
            },
            {
                "permission_code": "role:list",
                "permission_name": "角色列表",
                "menu_path": "/roles",
            },
        ]

        permission_map = {}

        for item in permissions_data:
            permission, created = SysPermission.objects.get_or_create(
                permission_code=item["permission_code"],
                defaults={
                    "permission_name": item["permission_name"],
                    "menu_path": item["menu_path"],
                },
            )

            permission_map[item["permission_code"]] = permission

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"创建权限：{permission.permission_name}")
                )
            else:
                self.stdout.write(f"权限已存在：{permission.permission_name}")

        # 2. 创建角色数据
        admin_role, admin_created = SysRole.objects.get_or_create(
            role_code="admin",
            defaults={
                "role_name": "管理员",
            },
        )

        user_role, user_created = SysRole.objects.get_or_create(
            role_code="user",
            defaults={
                "role_name": "普通用户",
            },
        )

        if admin_created:
            self.stdout.write(self.style.SUCCESS("创建角色：管理员"))
        else:
            self.stdout.write("角色已存在：管理员")

        if user_created:
            self.stdout.write(self.style.SUCCESS("创建角色：普通用户"))
        else:
            self.stdout.write("角色已存在：普通用户")

        # 3. 给管理员分配所有权限
        admin_role.permissions.set([
            permission_map["user:list"],
            permission_map["user:add"],
            permission_map["user:delete"],
            permission_map["role:list"],
        ])

        self.stdout.write(
            self.style.SUCCESS("已给管理员分配权限：user:list, user:add, user:delete, role:list")
        )

        # 4. 给普通用户分配 user:list 权限
        user_role.permissions.set([
            permission_map["user:list"],
        ])

        self.stdout.write(
            self.style.SUCCESS("已给普通用户分配权限：user:list")
        )

        # 5. 创建 admin 用户
        if not SysUser.objects.filter(username="admin").exists():
            admin_user = SysUser(
                username="admin",
                real_name="管理员",
                phone="13800000000",
                role=admin_role,
                status=1,
            )
            admin_user.set_password("123456")
            admin_user.save()

            self.stdout.write(
                self.style.SUCCESS("创建用户：admin / 123456")
            )
        else:
            self.stdout.write("用户已存在：admin")

        # 6. 创建 zhangsan 用户
        if not SysUser.objects.filter(username="zhangsan").exists():
            normal_user = SysUser(
                username="zhangsan",
                real_name="张三",
                phone="13900000000",
                role=user_role,
                status=1,
            )
            normal_user.set_password("123456")
            normal_user.save()

            self.stdout.write(
                self.style.SUCCESS("创建用户：zhangsan / 123456")
            )
        else:
            self.stdout.write("用户已存在：zhangsan")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("RBAC 测试数据初始化完成"))
        self.stdout.write("")
        self.stdout.write("当前测试账号：")
        self.stdout.write("admin / 123456")
        self.stdout.write("zhangsan / 123456")
```

------

## 3.3 执行初始化命令

确认你在：

```
rbac_project/backend
```

执行：

```
python manage.py init_rbac_data
```

如果成功，你会看到类似输出：

```
创建权限：用户列表
创建权限：新增用户
创建权限：删除用户
创建权限：角色列表
创建角色：管理员
创建角色：普通用户
已给管理员分配权限：user:list, user:add, user:delete, role:list
已给普通用户分配权限：user:list
创建用户：admin / 123456
创建用户：zhangsan / 123456

RBAC 测试数据初始化完成

当前测试账号：
admin / 123456
zhangsan / 123456
```

如果你重复执行一次，也不会重复创建，因为代码用了：

```
get_or_create
```

它的意思是：

```
如果数据不存在，就创建；
如果数据已经存在，就直接使用已有数据。
```

------

## 3.4 检查数据库数据

进入 MySQL：

```
mysql -u root -p
```

选择数据库：

```
USE rbac_db;
```

------

### 3.4.1 查看权限表

```
SELECT * FROM sys_permission;
```

你应该看到类似：

```
user:list
user:add
user:delete
role:list
```

------

### 3.4.2 查看角色表

```
SELECT * FROM sys_role;
```

你应该看到：

```
admin    管理员
user     普通用户
```

------

### 3.4.3 查看用户表

```
SELECT user_id, username, real_name, phone, role_id, status FROM sys_user;
```

你应该看到：

```
admin
zhangsan
```

注意不要直接看 password 字段，因为我们保存的是加密后的密码。

------

### 3.4.4 查看角色权限关系

```
SELECT * FROM sys_role_permission;
```

你应该看到管理员有多条权限，普通用户有一条权限。

------

## 3.5 用关联查询看得更清楚

你可以执行下面 SQL：

```
SELECT
    r.role_name,
    p.permission_code,
    p.permission_name
FROM sys_role_permission rp
JOIN sys_role r ON rp.role_id = r.id
JOIN sys_permission p ON rp.permission_id = p.id
ORDER BY r.id, p.id;
```

你应该看到类似：

```
管理员    user:list      用户列表
管理员    user:add       新增用户
管理员    user:delete    删除用户
管理员    role:list      角色列表
普通用户  user:list      用户列表
```

这说明：

```
角色 -> 权限
```

关系已经成功建立。

------

## 3.6 用 Django shell 检查数据

也可以不用 MySQL，直接用 Django 检查。

执行：

```
python manage.py shell
```

进入 shell 后输入：

```
from rbac.models import SysUser

admin = SysUser.objects.get(username="admin")
admin.role.role_name
```

结果应该是：

```
管理员
```

继续输入：

```
admin.role.permissions.all()
```

你应该能看到管理员拥有的权限。

再查普通用户：

```
zhangsan = SysUser.objects.get(username="zhangsan")
zhangsan.role.role_name
```

结果应该是：

```
普通用户
```

再输入：

```
zhangsan.role.permissions.all()
```

你应该只看到：

```
user:list
```

退出 shell：

```
exit()
```

------

## 3.7 当前阶段完成后的数据关系

现在数据库里的关系是：

```
admin 用户
  ↓
管理员角色
  ↓
user:list
user:add
user:delete
role:list
zhangsan 用户
  ↓
普通用户角色
  ↓
user:list
```

也就是说：

```
admin 可以查看用户、新增用户、删除用户、查看角色

zhangsan 只能查看用户
```

------

# 阶段 4：实现 RBAC 权限判断

本阶段目标：

```
给一个用户 + 一个权限标识 permission_code
系统能判断这个用户有没有这个权限
```

------

## 4.1 本阶段的判断逻辑

你现在数据库里的关系是：

```
sys_user
  ↓ role_id
sys_role
  ↓ sys_role_permission
sys_permission
```

所以判断权限的流程是：

```
1. 找到用户
2. 判断用户是否存在
3. 判断用户状态是否正常
4. 找到用户的角色
5. 找到这个角色拥有的所有权限
6. 判断权限列表里面有没有目标 permission_code
7. 有，返回 True
8. 没有，返回 False
```

例如：

```
zhangsan -> 普通用户 -> user:list
```

所以：

```
zhangsan 有没有 user:list？   True
zhangsan 有没有 user:delete？ False
```

------

## 4.2 新建权限服务文件

新建文件：

```
backend/rbac/services.py
```

完整代码如下：

```
from .models import SysUser, SysPermission


class RBACService:
    """
    RBAC 权限判断服务

    这个类专门负责判断：
    某个用户有没有某个权限。
    """

    @staticmethod
    def get_user_by_id(user_id):
        """
        根据 user_id 获取用户
        """
        try:
            return SysUser.objects.select_related("role").get(user_id=user_id)
        except SysUser.DoesNotExist:
            return None

    @staticmethod
    def get_user_by_username(username):
        """
        根据 username 获取用户
        """
        try:
            return SysUser.objects.select_related("role").get(username=username)
        except SysUser.DoesNotExist:
            return None

    @staticmethod
    def get_user_permission_codes_by_user(user):
        """
        根据用户对象，获取这个用户拥有的所有权限标识
        """

        # 用户不存在
        if user is None:
            return set()

        # 用户状态不是正常
        if user.status != 1:
            return set()

        # 根据用户角色，查询这个角色拥有的所有权限
        permissions = SysPermission.objects.filter(
            roles=user.role
        ).distinct()

        # 把权限对象转换成 permission_code 集合
        permission_codes = set()

        for permission in permissions:
            permission_codes.add(permission.permission_code)

        return permission_codes

    @staticmethod
    def get_user_permission_codes_by_id(user_id):
        """
        根据 user_id 获取用户权限标识集合
        """
        user = RBACService.get_user_by_id(user_id)

        return RBACService.get_user_permission_codes_by_user(user)

    @staticmethod
    def get_user_permission_codes_by_username(username):
        """
        根据 username 获取用户权限标识集合
        """
        user = RBACService.get_user_by_username(username)

        return RBACService.get_user_permission_codes_by_user(user)

    @staticmethod
    def has_permission_by_user(user, permission_code):
        """
        根据用户对象判断是否有权限
        """
        permission_codes = RBACService.get_user_permission_codes_by_user(user)

        return permission_code in permission_codes

    @staticmethod
    def has_permission_by_user_id(user_id, permission_code):
        """
        根据 user_id 判断是否有权限
        """
        user = RBACService.get_user_by_id(user_id)

        return RBACService.has_permission_by_user(user, permission_code)

    @staticmethod
    def has_permission_by_username(username, permission_code):
        """
        根据 username 判断是否有权限
        """
        user = RBACService.get_user_by_username(username)

        return RBACService.has_permission_by_user(user, permission_code)
```

------

## 4.3 解释这个文件做了什么

这个文件里面最重要的是这几个方法。

### 4.3.1 根据用户名查权限

```
RBACService.get_user_permission_codes_by_username("admin")
```

它会返回 admin 拥有的所有权限。

例如：

```
{
    "user:list",
    "user:add",
    "user:delete",
    "role:list"
}
```

------

### 4.3.2 根据用户 ID 查权限

```
RBACService.get_user_permission_codes_by_id(1)
```

它会根据 `sys_user.user_id` 查询这个用户的权限。

------

### 4.3.3 判断用户有没有某个权限

```
RBACService.has_permission_by_username("admin", "user:delete")
```

如果 admin 有 `user:delete`，返回：

```
True
```

如果没有，返回：

```
False
```

------

## 4.4 用 Django shell 测试

确认你现在在：

```
rbac_project/backend
```

然后进入 Django shell：

```
python manage.py shell
```

------

### 4.4.1 测试 admin 的所有权限

输入：

```
from rbac.services import RBACService

RBACService.get_user_permission_codes_by_username("admin")
```

正常应该返回类似：

```
{"user:list", "user:add", "user:delete", "role:list"}
```

说明 admin 拥有全部权限。

------

### 4.4.2 测试 zhangsan 的所有权限

输入：

```
RBACService.get_user_permission_codes_by_username("zhangsan")
```

正常应该返回：

```
{"user:list"}
```

说明 zhangsan 只有查看用户列表的权限。

------

### 4.4.3 测试 admin 是否有删除权限

输入：

```
RBACService.has_permission_by_username("admin", "user:delete")
```

应该返回：

```
True
```

因为 admin 是管理员，有删除用户权限。

------

### 4.4.4 测试 zhangsan 是否有删除权限

输入：

```
RBACService.has_permission_by_username("zhangsan", "user:delete")
```

应该返回：

```
False
```

因为 zhangsan 是普通用户，没有删除权限。

------

### 4.4.5 测试 zhangsan 是否有用户列表权限

输入：

```
RBACService.has_permission_by_username("zhangsan", "user:list")
```

应该返回：

```
True
```

因为普通用户拥有 `user:list` 权限。

------

## 4.5 当前阶段完整流程

现在权限判断流程已经成立：

```
输入 username = zhangsan
输入 permission_code = user:delete

系统查询 sys_user
  ↓
找到 zhangsan
  ↓
找到 zhangsan 的 role_id
  ↓
找到普通用户角色
  ↓
查询 sys_role_permission
  ↓
找到普通用户拥有的权限
  ↓
查询 sys_permission
  ↓
得到权限列表：user:list
  ↓
判断 user:delete 是否在权限列表中
  ↓
不在
  ↓
返回 False
```

------

# 阶段 5：实现 JWT 登录

本阶段目标：

```
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

------

## 5.1 为什么这一阶段要用 JWT？

前面我们已经有了：

```
sys_user
sys_role
sys_permission
sys_role_permission
```

现在的问题是：

```
用户每次请求接口时，后端怎么知道这个请求是谁发来的？
```

答案就是 JWT。

登录成功后，后端给前端一个 token。

前端以后每次请求接口都带上这个 token。

后端解析 token，就能知道：

```
当前用户是谁
```

------

## 5.2 本阶段最终效果

我们会实现两个接口：

```
POST /api/login/
POST /api/token/refresh/
```

### 5.2.1 登录接口

请求：

```
{
  "username": "admin",
  "password": "123456"
}
```

返回：

```
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

```
{
  "refresh_token": "xxx"
}
```

返回新的：

```
{
  "access_token": "新的 access_token"
}
```

------

## 5.3 安装 JWT 依赖

确认你在：

```
rbac_project/backend
```

并且虚拟环境已经启动。

安装：

```
pip install PyJWT
```

这里使用 `PyJWT`，因为我们现在的 `sys_user` 是你自己设计的业务用户表，不是 Django 默认的 `auth_user` 表。

------

## 5.4 修改配置文件

打开文件：

```
backend/config/settings.py
```

在文件最后添加：

```
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30

JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

JWT_ALGORITHM = "HS256"
```

完整意思是：

```
access_token 有效期：30 分钟
refresh_token 有效期：7 天
加密算法：HS256
```

------

## 5.5 新建 JWT 工具文件

新建文件：

```
backend/rbac/jwt_utils.py
```

写入完整代码：

```
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

------

## 5.6 解释这个文件

这个文件做三件事。

### 5.6.1 创建 access_token

```
access_token 是访问接口用的
```

例如以后访问用户列表接口：

```
GET /api/users/
```

前端要带：

```
Authorization: Bearer access_token
```

------

### 5.6.2 创建 refresh_token

```
refresh_token 是刷新 access_token 用的
```

因为 access_token 有效期短，比如 30 分钟。

过期后，前端可以用 refresh_token 换新的 access_token。

------

### 5.6.3 解析 token

后面阶段 6 会用它。

阶段 6 的流程会是：

```
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

------

## 5.7 编写登录接口

打开文件：

```
backend/rbac/views.py
```

如果里面原来只有默认内容，直接替换成下面代码：

```
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

------

## 5.8 解释登录接口流程

登录接口做了这些事：

```
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

```
sys_user 账号密码正确
  ↓
生成 JWT
  ↓
返回给前端
```

------

## 5.9 创建 rbac 的路由文件

新建文件：

```
backend/rbac/urls.py
```

写入：

```
from django.urls import path

from .views import LoginView, RefreshTokenView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("token/refresh/", RefreshTokenView.as_view()),
]
```

这里会生成两个接口：

```
/api/login/
/api/token/refresh/
```

------

## 5.10 修改项目总路由

打开文件：

```
backend/config/urls.py
```

改成下面这样：

```
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("rbac.urls")),
]
```

意思是：

```
所有 rbac 的接口都放在 /api/ 下面
```

所以：

```
rbac/urls.py 里面的 login/
```

最终访问地址就是：

```
/api/login/
```

------

## 5.11 启动后端服务

确认在：

```
rbac_project/backend
```

执行：

```
python manage.py runserver
```

启动后，后端地址是：

```
http://127.0.0.1:8000
```

------

## 5.12 测试登录接口

Windows PowerShell

```
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","password":"123456"}'
```

macOS / Linux

```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

如果成功，你会看到类似结果：

```
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

------

## 5.13 测试普通用户登录

Windows PowerShell

```
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"zhangsan","password":"123456"}'
```

macOS / Linux

```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

成功后也会返回：

```
access_token
refresh_token
用户信息
```

区别是用户角色是：

```
普通用户
```

------

## 5.14 测试刷新 access_token

先从登录接口返回结果里复制：

```
refresh_token
```

然后请求：

Windows PowerShell

```
curl -Method POST "http://127.0.0.1:8000/api/token/refresh/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"refresh_token":"这里换成你的refresh_token"}'
```

macOS / Linux

```
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"这里换成你的refresh_token"}'
```

成功返回：

```
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "access_token": "新的 access_token"
  }
}
```

------

## 5.15 阶段 5 完成标准

你只需要确认这几件事：

```
1. pip install PyJWT 成功
2. backend/rbac/jwt_utils.py 创建成功
3. backend/rbac/views.py 写入登录逻辑
4. backend/rbac/urls.py 创建成功
5. backend/config/urls.py 已经 include rbac.urls
6. POST /api/login/ 可以登录成功
7. 登录成功后能拿到 access_token 和 refresh_token
8. POST /api/token/refresh/ 可以刷新 access_token
```

# 阶段 6：实现接口权限拦截

本阶段目标：

```
前端请求接口时携带 access_token
  ↓
后端解析 access_token
  ↓
找到当前用户
  ↓
判断用户是否有接口所需权限
  ↓
有权限：允许访问
  ↓
无权限：返回 403
```

------

## 6.1 本阶段要实现的接口

我们这次做 4 个接口：

```
GET    /api/me/              查看当前登录用户
GET    /api/users/           查看用户列表，需要 user:list
POST   /api/users/           新增用户，需要 user:add
DELETE /api/users/<user_id>/ 删除用户，需要 user:delete
```

权限关系是：

```
admin:
- user:list
- user:add
- user:delete
- role:list

zhangsan:
- user:list
```

所以最终效果应该是：

```
admin 可以查看、新增、删除用户

zhangsan 只能查看用户
zhangsan 不能新增用户
zhangsan 不能删除用户
```

------

## 6.2 本阶段会修改 / 新增的文件

```
backend/rbac/responses.py     新增：统一返回 JSON
backend/rbac/auth.py          新增：JWT 认证 + RBAC 权限装饰器
backend/rbac/views.py         修改：增加受保护接口
backend/rbac/urls.py          修改：增加接口路由
```

------

### 6.2.1 新增统一响应文件

新建文件：

```
backend/rbac/responses.py
```

写入：

```
from django.http import JsonResponse


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
```

这个文件的作用是让所有接口返回格式统一。

例如成功：

```
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

例如没有权限：

```
{
  "code": 403,
  "message": "没有权限访问该接口",
  "data": null
}
```

------

### 6.2.2 新增认证和权限拦截文件

新建文件：

```
backend/rbac/auth.py
```

写入完整代码：

```
from functools import wraps

import jwt

from .jwt_utils import decode_token
from .models import SysUser
from .responses import json_response
from .services import RBACService


def get_token_from_request(request):
    """
    从请求头中获取 token

    前端请求时需要携带：

    Authorization: Bearer access_token
    """

    authorization = request.headers.get("Authorization", "")

    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "", 1).strip()

    return token


def authenticate_request(request):
    """
    认证当前请求

    作用：
    1. 从请求头获取 access_token
    2. 解析 access_token
    3. 根据 token 中的 user_id 查询 sys_user
    4. 把当前用户挂载到 request.current_user
    """

    token = get_token_from_request(request)

    if not token:
        return None, json_response(
            message="未提供 access_token",
            code=401,
            status=401,
        )

    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        return None, json_response(
            message="access_token 已过期",
            code=401,
            status=401,
        )
    except jwt.InvalidTokenError:
        return None, json_response(
            message="access_token 无效",
            code=401,
            status=401,
        )

    if payload.get("token_type") != "access":
        return None, json_response(
            message="token 类型错误，需要 access_token",
            code=401,
            status=401,
        )

    user_id = payload.get("user_id")

    if not user_id:
        return None, json_response(
            message="token 中缺少 user_id",
            code=401,
            status=401,
        )

    user = SysUser.objects.select_related("role").filter(
        user_id=user_id
    ).first()

    if user is None:
        return None, json_response(
            message="用户不存在",
            code=401,
            status=401,
        )

    if user.status != 1:
        return None, json_response(
            message="用户已被禁用",
            code=403,
            status=403,
        )

    request.current_user = user

    return user, None


def login_required(view_func):
    """
    只校验用户是否登录，不校验具体权限
    """

    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        user, error_response = authenticate_request(request)

        if error_response:
            return error_response

        return view_func(self, request, *args, **kwargs)

    return wrapper


def permission_required(permission_code):
    """
    校验用户是否拥有指定权限

    例如：

    @permission_required("user:list")
    def get(...):
        ...
    """

    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            user, error_response = authenticate_request(request)

            if error_response:
                return error_response

            has_permission = RBACService.has_permission_by_user(
                user,
                permission_code
            )

            if not has_permission:
                return json_response(
                    message=f"没有权限访问该接口，需要权限：{permission_code}",
                    code=403,
                    status=403,
                )

            return view_func(self, request, *args, **kwargs)

        return wrapper

    return decorator
```

------

解释 `auth.py` 的核心逻辑

1. 先拿 token

后端会从请求头里拿：

```
Authorization: Bearer access_token
```

如果没有 token，返回：

```
401 未提供 access_token
```

------

1. 再解析 token

解析成功后，可以拿到：

```
user_id
username
role_id
token_type
```

如果 token 过期，返回：

```
401 access_token 已过期
```

如果 token 是假的，返回：

```
401 access_token 无效
```

------

1. 再查当前用户

通过 token 里的：

```
user_id
```

去查：

```
sys_user
```

如果用户不存在，返回：

```
401 用户不存在
```

如果用户被禁用，返回：

```
403 用户已被禁用
```

------

1. 最后判断权限

例如接口需要：

```
user:delete
```

后端就判断当前用户是否拥有：

```
user:delete
```

有权限，继续执行接口。

没有权限，返回：

```
403 没有权限访问该接口
```

------

### 6.2.3 修改 views.py

打开文件：

```
backend/rbac/views.py
```

把内容替换成下面完整代码：

```
import json

import jwt
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .auth import login_required, permission_required
from .jwt_utils import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from .models import SysUser, SysRole
from .responses import json_response
from .services import RBACService


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

        permission_codes = RBACService.get_user_permission_codes_by_user(user)

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
                "permissions": list(permission_codes),
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


class MeView(View):
    """
    查看当前登录用户

    GET /api/me/
    """

    @login_required
    def get(self, request):
        user = request.current_user

        permission_codes = RBACService.get_user_permission_codes_by_user(user)

        return json_response(
            data={
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
                "permissions": list(permission_codes),
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserListView(View):
    """
    用户列表和新增用户接口

    GET /api/users/   需要 user:list
    POST /api/users/  需要 user:add
    """

    @permission_required("user:list")
    def get(self, request):
        users = SysUser.objects.select_related("role").all().order_by("user_id")

        user_list = []

        for user in users:
            user_list.append({
                "user_id": user.user_id,
                "username": user.username,
                "real_name": user.real_name,
                "phone": user.phone,
                "status": user.status,
                "role_id": user.role_id,
                "role_code": user.role.role_code,
                "role_name": user.role.role_name,
            })

        return json_response(
            data=user_list,
            message="获取用户列表成功",
        )

    @permission_required("user:add")
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
        real_name = data.get("real_name")
        phone = data.get("phone")
        role_id = data.get("role_id")
        status_value = data.get("status", 1)

        if not username or not password or not role_id:
            return json_response(
                message="username、password、role_id 不能为空",
                code=400,
                status=400,
            )

        if SysUser.objects.filter(username=username).exists():
            return json_response(
                message="用户名已存在",
                code=400,
                status=400,
            )

        role = SysRole.objects.filter(id=role_id).first()

        if role is None:
            return json_response(
                message="角色不存在",
                code=400,
                status=400,
            )

        user = SysUser(
            username=username,
            real_name=real_name,
            phone=phone,
            role=role,
            status=status_value,
        )
        user.set_password(password)
        user.save()

        return json_response(
            data={
                "user_id": user.user_id,
                "username": user.username,
                "real_name": user.real_name,
                "phone": user.phone,
                "status": user.status,
                "role_id": user.role_id,
                "role_code": user.role.role_code,
                "role_name": user.role.role_name,
            },
            message="新增用户成功",
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserDetailView(View):
    """
    删除用户接口

    DELETE /api/users/<user_id>/  需要 user:delete
    """

    @permission_required("user:delete")
    def delete(self, request, user_id):
        current_user = request.current_user

        user = SysUser.objects.filter(user_id=user_id).first()

        if user is None:
            return json_response(
                message="用户不存在",
                code=404,
                status=404,
            )

        if user.user_id == current_user.user_id:
            return json_response(
                message="不能删除自己",
                code=400,
                status=400,
            )

        user.delete()

        return json_response(
            message="删除用户成功",
        )
```

------

#### 6.2.3.1 `/api/me/`

```
GET /api/me/
```

只需要登录，不需要具体权限。

作用是查看当前登录用户是谁。

------

#### 6.2.3.2 `/api/users/`

```
GET /api/users/
```

需要权限：

```
user:list
```

有这个权限才可以查看用户列表。

------

#### 6.2.3.3 `/api/users/`

```
POST /api/users/
```

需要权限：

```
user:add
```

有这个权限才可以新增用户。

------

#### 6.2.3.4 `/api/users/<user_id>/`

```
DELETE /api/users/3/
```

需要权限：

```
user:delete
```

有这个权限才可以删除用户。

------

### 6.2.4 修改 urls.py

打开文件：

```
backend/rbac/urls.py
```

替换成下面完整代码：

```
from django.urls import path

from .views import (
    LoginView,
    RefreshTokenView,
    MeView,
    UserListView,
    UserDetailView,
)

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("token/refresh/", RefreshTokenView.as_view()),

    path("me/", MeView.as_view()),

    path("users/", UserListView.as_view()),
    path("users/<int:user_id>/", UserDetailView.as_view()),
]
```

现在接口地址是：

```
POST   /api/login/
POST   /api/token/refresh/

GET    /api/me/
GET    /api/users/
POST   /api/users/
DELETE /api/users/<user_id>/
```

------

## 6.3 启动后端

确认你在：

```
rbac_project/backend
```

执行：

```
python manage.py runserver
```

------

## 6.4 测试接口权限拦截

### 6.4.1 第 1 步：登录 admin

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

Windows PowerShell：

```
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"admin","password":"123456"}'
```

复制返回结果里的：

```
access_token
```

下面用它替换：

```
你的admin_access_token
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGVfaWQiOjEsImlhdCI6MTc3OTc2NzM4NiwiZXhwIjoxNzc5NzY5MTg2fQ.2kwnsXoJiT019gC09iRgDGBkDTL3AqNgldow3zGddeY", "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsInVzZXJfaWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlX2lkIjoxLCJpYXQiOjE3Nzk3NjczODYsImV4cCI6MTc4MDM3MjE4Nn0.SV_Mmz3k_xcKCceJcB0G6dTBR1S52JqGoa9vS0emAYk"
```

------

### 6.4.2 第 2 步：admin 查看用户列表

macOS / Linux：

```
curl -X GET http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGVfaWQiOjEsImlhdCI6MTc3OTc2NzM4NiwiZXhwIjoxNzc5NzY5MTg2fQ.2kwnsXoJiT019gC09iRgDGBkDTL3AqNgldow3zGddeY"
```

Windows PowerShell：

```
curl -Method GET "http://127.0.0.1:8000/api/users/" `
  -Headers @{"Authorization"="Bearer 你的admin_access_token"}
```

正常返回：

```
获取用户列表成功
```

因为 admin 有：

```
user:list
```

------

### 6.4.3 第 3 步：admin 新增用户

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的admin_access_token" \
  -d '{"username":"lisi","password":"123456","real_name":"李四","phone":"13700000000","role_id":2,"status":1}'
```

Windows PowerShell：

```
curl -Method POST "http://127.0.0.1:8000/api/users/" `
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer 你的admin_access_token"
  } `
  -Body '{"username":"lisi","password":"123456","real_name":"李四","phone":"13700000000","role_id":2,"status":1}'
```

正常返回：

```
新增用户成功
```

因为 admin 有：

```
user:add
```

------

### 6.4.4 第 4 步：登录 zhangsan

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

Windows PowerShell：

```
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"zhangsan","password":"123456"}'
```

复制返回结果里的：

```
access_token
```

下面用它替换：

```
你的zhangsan_access_token
```

------

### 6.4.5 第 5 步：zhangsan 查看用户列表

macOS / Linux：

```
curl -X GET http://127.0.0.1:8000/api/users/ \
  -H "Authorization: Bearer 你的zhangsan_access_token"
```

Windows PowerShell：

```
curl -Method GET "http://127.0.0.1:8000/api/users/" `
  -Headers @{"Authorization"="Bearer 你的zhangsan_access_token"}
```

正常应该成功。

因为 zhangsan 有：

```
user:list
```

------

### 6.4.6 第 6 步：zhangsan 新增用户

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的zhangsan_access_token" \
  -d '{"username":"wangwu","password":"123456","real_name":"王五","phone":"13600000000","role_id":2,"status":1}'
```

Windows PowerShell：

```
curl -Method POST "http://127.0.0.1:8000/api/users/" `
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer 你的zhangsan_access_token"
  } `
  -Body '{"username":"wangwu","password":"123456","real_name":"王五","phone":"13600000000","role_id":2,"status":1}'
```

正常应该返回：

```
{
  "code": 403,
  "message": "没有权限访问该接口，需要权限：user:add",
  "data": null
}
```

因为 zhangsan 没有：

```
user:add
```

------

### 6.4.7 第 7 步：zhangsan 删除用户

假设你要删除用户 ID 为 3 的用户：

macOS / Linux：

```
curl -X DELETE http://127.0.0.1:8000/api/users/3/ \
  -H "Authorization: Bearer 你的zhangsan_access_token"
```

Windows PowerShell：

```
curl -Method DELETE "http://127.0.0.1:8000/api/users/3/" `
  -Headers @{"Authorization"="Bearer 你的zhangsan_access_token"}
```

正常应该返回：

```
{
  "code": 403,
  "message": "没有权限访问该接口，需要权限：user:delete",
  "data": null
}
```

因为 zhangsan 没有：

```
user:delete
```

------

## 6.5 没有 token 的情况

直接请求：

```
curl -X GET http://127.0.0.1:8000/api/users/
```

会返回：

```
{
  "code": 401,
  "message": "未提供 access_token",
  "data": null
}
```

说明接口已经被保护起来了。

------

## 6.6 这一阶段的核心流程

现在后端接口请求流程变成了：

```
请求 /api/users/
  ↓
检查 Authorization 请求头
  ↓
获取 access_token
  ↓
解析 JWT
  ↓
得到 user_id
  ↓
查询 sys_user
  ↓
得到当前用户
  ↓
查询当前用户的角色
  ↓
查询角色拥有的权限
  ↓
判断是否有 user:list
  ↓
有权限：返回用户列表
  ↓
没权限：返回 403
```

------

## 6.7 阶段 6 完成标准

你需要确认下面 4 件事：

```
1. 不带 token 请求 /api/users/，返回 401
2. admin 带 token 请求 /api/users/，成功
3. admin 带 token 新增用户，成功
4. zhangsan 带 token 新增或删除用户，返回 403
```

完成后，你的后端已经具备：

```
JWT 认证
RBAC 权限判断
接口权限拦截
```

------

# 阶段 7：实现 Vue3 登录

本阶段目标：

```
Vue3 登录页面
  ↓
输入 username 和 password
  ↓
请求 Django 后端 /api/login/
  ↓
后端返回 access_token、refresh_token、用户信息、权限列表
  ↓
Vue3 保存这些数据
  ↓
跳转到首页
```

------

## 7.1 先处理后端跨域

因为你的后端是：

```
http://127.0.0.1:8000
```

Vue3 前端是：

```
http://localhost:5173
```

端口不一样，所以浏览器会拦截跨域请求。

所以我们先让 Django 允许 Vue3 访问。

------

### 7.1.1 第 1 步：安装跨域包

安装：

```
pip install django-cors-headers
```

------

### 7.1.2 第 2 步：修改后端配置

打开文件：

```
backend/config/settings.py
```

找到：

```
INSTALLED_APPS = [
```

加入：

```
"corsheaders",
```

例如：

```
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "corsheaders",

    "rbac",
]
```

------

找到：

```
MIDDLEWARE = [
```

把：

```
"corsheaders.middleware.CorsMiddleware",
```

放到最上面。

例如：

```
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
```

------

在 `settings.py` 文件最后加入：

```
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

------

### 7.1.3 第 3 步：重启后端

如果后端正在运行，先停掉：

```
Ctrl + C
```

重新启动：

```
python manage.py runserver
```

------

## 7.2 创建 Vue3 项目

现在回到项目根目录：

```
cd ..
```

如果你现在在：

```
rbac_project/backend
```

执行：

```
cd ..
```

现在应该在：

```
rbac_project
```

创建前端项目：

```
npm create vite@latest frontend -- --template vue
```

进入前端目录：

```
cd frontend
```

安装依赖：

```
npm install
```

安装登录需要的包：

```
npm install axios vue-router pinia
```

------

## 7.3 前端目录结构

本阶段我们要写这些文件：

```
frontend/
└── src/
    ├── api/
    │   └── auth.js
    ├── router/
    │   └── index.js
    ├── stores/
    │   └── auth.js
    ├── utils/
    │   └── request.js
    ├── views/
    │   ├── Home.vue
    │   └── Login.vue
    ├── App.vue
    └── main.js
```

如果没有这些文件夹，就自己创建：

```
mkdir src\api src\router src\stores src\utils src\views
```

macOS / Linux：

```
mkdir -p src/api src/router src/stores src/utils src/views
```

------

## 7.4 编写前端代码

### 7.4.1 `frontend/src/main.js`

```
import { createApp } from "vue"
import { createPinia } from "pinia"

import App from "./App.vue"
import router from "./router"

createApp(App)
  .use(createPinia())
  .use(router)
  .mount("#app")
```

这个文件的作用是：

```
启动 Vue 项目
加载 Pinia 状态管理
加载 Vue Router 路由
```

------

### 7.4.2 `frontend/src/App.vue`

```
<template>
  <router-view />
</template>
```

这个文件很简单。

意思是：

```
当前路由是什么，就显示什么页面
```

比如：

```
/login 显示登录页
/      显示首页
```

------

### 7.4.3 `frontend/src/utils/request.js`

```
import axios from "axios"

const request = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem("access_token")

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("permissions")

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default request
```

这个文件的作用是封装 axios。

以后你请求后端接口，不直接用 axios，而是用这个 `request`。

它会自动做一件事：

```
如果 localStorage 里面有 access_token，
就自动放到请求头 Authorization 里面。
```

请求头最终是：

```
Authorization: Bearer access_token
```

------

### 7.4.4 `frontend/src/api/auth.js`

```
import request from "../utils/request"

export function loginApi(data) {
  return request.post("/login/", data)
}

export function getMeApi() {
  return request.get("/me/")
}
```

这个文件专门放登录相关接口。

目前有两个：

```
loginApi    登录
getMeApi    获取当前用户信息
```

本阶段主要用 `loginApi`。

------

### 7.4.5 `frontend/src/stores/auth.js`

```
import { defineStore } from "pinia"

import { loginApi } from "../api/auth"

function getLocalJson(key, defaultValue) {
  try {
    const value = localStorage.getItem(key)

    if (!value) {
      return defaultValue
    }

    return JSON.parse(value)
  } catch {
    return defaultValue
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: localStorage.getItem("access_token") || "",
    refreshToken: localStorage.getItem("refresh_token") || "",
    user: getLocalJson("user", null),
    permissions: getLocalJson("permissions", [])
  }),

  getters: {
    isLogin: state => {
      return !!state.accessToken
    },

    hasPermission: state => {
      return permissionCode => {
        return state.permissions.includes(permissionCode)
      }
    }
  },

  actions: {
    async login(form) {
      const res = await loginApi(form)

      if (res.code !== 200) {
        throw new Error(res.message || "登录失败")
      }

      const data = res.data

      this.accessToken = data.access_token
      this.refreshToken = data.refresh_token
      this.user = data.user
      this.permissions = data.permissions || []

      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []))
    },

    logout() {
      this.accessToken = ""
      this.refreshToken = ""
      this.user = null
      this.permissions = []

      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("permissions")
    }
  }
})
```

这个文件是登录状态管理。

它负责：

```
保存 token
保存用户信息
保存权限列表
判断用户是否登录
退出登录
```

登录成功后，会把数据保存到：

```
localStorage
```

这样刷新页面后，登录状态还在。

------

### 7.4.6 `frontend/src/router/index.js`

```
import { createRouter, createWebHistory } from "vue-router"

import { useAuthStore } from "../stores/auth"

import Login from "../views/Login.vue"
import Home from "../views/Home.vue"

const routes = [
  {
    path: "/login",
    component: Login
  },
  {
    path: "/",
    component: Home,
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLogin) {
    next("/login")
    return
  }

  if (to.path === "/login" && authStore.isLogin) {
    next("/")
    return
  }

  next()
})

export default router
```

这个文件负责页面跳转。

目前有两个页面：

```
/login 登录页
/      首页
```

路由守卫的意思是：

```
如果没登录，不能进首页，自动跳到 /login
如果已经登录，再访问 /login，会自动跳到首页
```

------

### 7.4.7 `frontend/src/views/Login.vue`

```
<template>
  <div class="page">
    <div class="login-box">
      <h2>RBAC 系统登录</h2>

      <div class="form-item">
        <label>用户名</label>
        <input
          v-model="form.username"
          placeholder="请输入用户名"
        />
      </div>

      <div class="form-item">
        <label>密码</label>
        <input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
        />
      </div>

      <button
        class="login-button"
        :disabled="loading"
        @click="handleLogin"
      >
        {{ loading ? "登录中..." : "登录" }}
      </button>

      <p class="error" v-if="errorMessage">
        {{ errorMessage }}
      </p>

      <div class="tips">
        <p>管理员：admin / 123456</p>
        <p>普通用户：zhangsan / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"

import { useAuthStore } from "../stores/auth"

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const errorMessage = ref("")

const form = reactive({
  username: "admin",
  password: "123456"
})

async function handleLogin() {
  errorMessage.value = ""

  if (!form.username) {
    errorMessage.value = "请输入用户名"
    return
  }

  if (!form.password) {
    errorMessage.value = "请输入密码"
    return
  }

  try {
    loading.value = true

    await authStore.login({
      username: form.username,
      password: form.password
    })

    router.push("/")
  } catch (error) {
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || "登录失败"
    } else {
      errorMessage.value = error.message || "登录失败"
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 360px;
  padding: 28px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

h2 {
  text-align: center;
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  color: #333;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.login-button {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.login-button:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 12px;
}

.tips {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}
</style>
```

这个页面做了几件事：

```
1. 输入用户名
2. 输入密码
3. 点击登录
4. 请求 /api/login/
5. 登录成功后跳转首页
6. 登录失败显示错误信息
```

------

### 7.4.8 `frontend/src/views/Home.vue`

```
<template>
  <div class="page">
    <h2>首页</h2>

    <div class="card">
      <h3>当前登录用户</h3>

      <p>
        用户名：{{ authStore.user?.username }}
      </p>

      <p>
        真实姓名：{{ authStore.user?.real_name }}
      </p>

      <p>
        当前角色：{{ authStore.user?.role_name }}
      </p>
    </div>

    <div class="card">
      <h3>当前权限</h3>

      <ul>
        <li
          v-for="permission in authStore.permissions"
          :key="permission"
        >
          {{ permission }}
        </li>
      </ul>
    </div>

    <button @click="handleLogout">
      退出登录
    </button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"

import { useAuthStore } from "../stores/auth"

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push("/login")
}
</script>

<style scoped>
.page {
  padding: 32px;
}

.card {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

button {
  padding: 10px 18px;
  cursor: pointer;
}
</style>
```

首页目前只做三件事：

```
显示当前用户
显示当前角色
显示当前权限
```

------

## 7.5 启动前端

确认你在：

```
rbac_project/frontend
```

执行：

```
npm run dev
```

成功后会看到：

```
Local: http://localhost:5173/
```

打开浏览器访问：

```
http://localhost:5173/login
```

------

## 7.6 测试登录

确保后端也在运行：

```
http://127.0.0.1:8000
```

然后前端登录：

```
admin / 123456
```

成功后跳转首页。

你应该看到：

```
用户名：admin
真实姓名：管理员
当前角色：管理员
当前权限：
- user:list
- user:add
- user:delete
- role:list
```

然后退出，再测试：

```
zhangsan / 123456
```

你应该看到：

```
用户名：zhangsan
真实姓名：张三
当前角色：普通用户
当前权限：
- user:list
```

------

## 7.7 当前阶段完整流程

现在已经实现：

```
用户打开 Vue3 登录页
  ↓
输入 admin / 123456
  ↓
点击登录
  ↓
Vue3 请求 http://127.0.0.1:8000/api/login/
  ↓
Django 查询 sys_user
  ↓
密码正确
  ↓
Django 返回 access_token、refresh_token、user、permissions
  ↓
Vue3 保存到 Pinia 和 localStorage
  ↓
跳转首页
  ↓
首页显示当前用户和权限
```

------

## 7.8 阶段 7 完成标准

你只需要确认：

```
1. Vue3 项目能启动
2. 可以打开 http://localhost:5173/login
3. admin / 123456 可以登录成功
4. zhangsan / 123456 可以登录成功
5. 登录成功后跳转首页
6. 首页能显示用户信息和权限列表
7. localStorage 里有 access_token 和 refresh_token
```

# 阶段 8：Vue3 根据权限显示菜单和按钮

本阶段目标：

```
1. 登录后根据 permissions 显示菜单
2. 根据 permissions 显示按钮
3. 没有页面权限时跳转 403 页面
4. 请求用户列表接口
5. admin 可以新增、删除用户
6. zhangsan 只能查看用户，不能新增、不能删除
```

这一阶段只做前端。

------

## 8.1 本阶段要修改 / 新增的文件

```
frontend/src/api/user.js              新增
frontend/src/views/UserList.vue       新增
frontend/src/views/Forbidden.vue      新增
frontend/src/router/index.js          修改
frontend/src/views/Home.vue           修改
```

------

## 8.2 确认当前前端已有权限判断方法

你在阶段 7 的文件：

```
frontend/src/stores/auth.js
```

里面已经有这个方法：

```
hasPermission: state => {
  return permissionCode => {
    return state.permissions.includes(permissionCode)
  }
}
```

它的作用是：

```
判断当前用户有没有某个权限
```

比如：

```
authStore.hasPermission("user:list")
authStore.hasPermission("user:add")
authStore.hasPermission("user:delete")
```

返回结果是：

```
true 或 false
```

所以阶段 8 直接复用它。

------

## 8.3 新增用户接口文件

新建文件：

```
frontend/src/api/user.js
```

写入：

```
import request from "../utils/request"

export function getUserListApi() {
  return request.get("/users/")
}

export function createUserApi(data) {
  return request.post("/users/", data)
}

export function deleteUserApi(userId) {
  return request.delete(`/users/${userId}/`)
}
```

这个文件对应后端接口：

```
GET    /api/users/           查看用户列表
POST   /api/users/           新增用户
DELETE /api/users/<user_id>/ 删除用户
```

权限对应关系：

```
GET    /api/users/           user:list
POST   /api/users/           user:add
DELETE /api/users/<user_id>/ user:delete
```

------

## 8.4 新增 403 页面

新建文件：

```
frontend/src/views/Forbidden.vue
```

写入：

```
<template>
  <div class="page">
    <h2>403</h2>

    <p>你没有权限访问这个页面。</p>

    <router-link to="/">
      返回首页
    </router-link>
  </div>
</template>

<style scoped>
.page {
  padding: 32px;
}

h2 {
  color: #dc2626;
}
</style>
```

这个页面的作用是：

```
当用户没有权限访问某个路由时，显示 403 页面。
```

------

## 8.5 新增用户管理页面

新建文件：

```
frontend/src/views/UserList.vue
```

写入完整代码：

```
<template>
  <div class="page">
    <div class="header">
      <div>
        <h2>用户管理</h2>
        <p>当前页面需要权限：user:list</p>
      </div>

      <router-link to="/">
        返回首页
      </router-link>
    </div>

    <div class="toolbar">
      <button
        v-if="authStore.hasPermission('user:add')"
        @click="handleAddUser"
      >
        新增用户
      </button>

      <span
        v-else
        class="no-permission"
      >
        当前账号没有 user:add 权限，所以不显示新增按钮
      </span>
    </div>

    <table>
      <thead>
        <tr>
          <th>用户ID</th>
          <th>用户名</th>
          <th>真实姓名</th>
          <th>手机号</th>
          <th>角色</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="user in users"
          :key="user.user_id"
        >
          <td>{{ user.user_id }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.real_name || "-" }}</td>
          <td>{{ user.phone || "-" }}</td>
          <td>{{ user.role_name }}</td>
          <td>
            {{ user.status === 1 ? "正常" : "禁用" }}
          </td>
          <td>
            <button
              v-if="authStore.hasPermission('user:delete')"
              class="danger"
              @click="handleDeleteUser(user)"
            >
              删除
            </button>

            <span
              v-else
              class="no-permission"
            >
              无删除权限
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <p
      v-if="users.length === 0"
      class="empty"
    >
      暂无用户数据
    </p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue"

import { useAuthStore } from "../stores/auth"
import {
  getUserListApi,
  createUserApi,
  deleteUserApi
} from "../api/user"

const authStore = useAuthStore()

const users = ref([])

async function loadUsers() {
  try {
    const res = await getUserListApi()

    if (res.code === 200) {
      users.value = res.data
    } else {
      alert(res.message || "获取用户列表失败")
    }
  } catch (error) {
    if (error.response && error.response.data) {
      alert(error.response.data.message || "获取用户列表失败")
    } else {
      alert("获取用户列表失败")
    }
  }
}

async function handleAddUser() {
  const username = prompt("请输入用户名")

  if (!username) {
    return
  }

  const password = prompt("请输入密码")

  if (!password) {
    return
  }

  const realName = prompt("请输入真实姓名")

  if (!realName) {
    return
  }

  try {
    const res = await createUserApi({
      username,
      password,
      real_name: realName,
      phone: "",
      role_id: 2,
      status: 1
    })

    if (res.code === 200) {
      alert("新增用户成功")
      await loadUsers()
    } else {
      alert(res.message || "新增用户失败")
    }
  } catch (error) {
    if (error.response && error.response.data) {
      alert(error.response.data.message || "新增用户失败")
    } else {
      alert("新增用户失败")
    }
  }
}

async function handleDeleteUser(user) {
  const confirmed = confirm(`确定删除用户 ${user.username} 吗？`)

  if (!confirmed) {
    return
  }

  try {
    const res = await deleteUserApi(user.user_id)

    if (res.code === 200) {
      alert("删除用户成功")
      await loadUsers()
    } else {
      alert(res.message || "删除用户失败")
    }
  } catch (error) {
    if (error.response && error.response.data) {
      alert(error.response.data.message || "删除用户失败")
    } else {
      alert("删除用户失败")
    }
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.page {
  padding: 32px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toolbar {
  margin: 20px 0;
}

button {
  padding: 8px 14px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

button:hover {
  background: #f3f4f6;
}

.danger {
  color: #dc2626;
  border-color: #dc2626;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  padding: 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f9fafb;
}

.no-permission {
  color: #999;
  font-size: 14px;
}

.empty {
  color: #999;
  margin-top: 20px;
}
</style>
```

------

## 8.6 解释用户管理页面

这个页面里有 3 个权限判断。

### 8.6.1 页面权限

用户能不能进入这个页面，看：

```
user:list
```

这个在路由里判断。

------

### 8.6.2 新增按钮权限

新增按钮这里：

```
<button
  v-if="authStore.hasPermission('user:add')"
  @click="handleAddUser"
>
  新增用户
</button>
```

意思是：

```
有 user:add 权限，显示新增按钮
没有 user:add 权限，不显示新增按钮
```

------

### 8.6.3 删除按钮权限

删除按钮这里：

```
<button
  v-if="authStore.hasPermission('user:delete')"
  class="danger"
  @click="handleDeleteUser(user)"
>
  删除
</button>
```

意思是：

```
有 user:delete 权限，显示删除按钮
没有 user:delete 权限，不显示删除按钮
```

------

## 8.7 修改路由文件

打开文件：

```
frontend/src/router/index.js
```

替换成下面完整代码：

```
import { createRouter, createWebHistory } from "vue-router"

import { useAuthStore } from "../stores/auth"

import Login from "../views/Login.vue"
import Home from "../views/Home.vue"
import UserList from "../views/UserList.vue"
import Forbidden from "../views/Forbidden.vue"

const routes = [
  {
    path: "/login",
    component: Login
  },
  {
    path: "/",
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/users",
    component: UserList,
    meta: {
      requiresAuth: true,
      permission: "user:list"
    }
  },
  {
    path: "/403",
    component: Forbidden
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLogin) {
    next("/login")
    return
  }

  if (to.path === "/login" && authStore.isLogin) {
    next("/")
    return
  }

  if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
    next("/403")
    return
  }

  next()
})

export default router
```

------

## 8.8 解释路由权限

这个路由：

```
{
  path: "/users",
  component: UserList,
  meta: {
    requiresAuth: true,
    permission: "user:list"
  }
}
```

意思是：

```
访问 /users 页面，必须满足两个条件：
1. 已登录
2. 拥有 user:list 权限
```

如果没有登录：

```
跳转 /login
```

如果登录了，但没有权限：

```
跳转 /403
```

------

## 8.9 修改首页，显示菜单

打开文件：

```
frontend/src/views/Home.vue
```

替换成下面完整代码：

```
<template>
  <div class="page">
    <h2>首页</h2>

    <div class="card">
      <h3>当前登录用户</h3>

      <p>
        用户名：{{ authStore.user?.username }}
      </p>

      <p>
        真实姓名：{{ authStore.user?.real_name }}
      </p>

      <p>
        当前角色：{{ authStore.user?.role_name }}
      </p>
    </div>

    <div class="card">
      <h3>菜单</h3>

      <div class="menu-list">
        <router-link
          v-if="authStore.hasPermission('user:list')"
          class="menu-item"
          to="/users"
        >
          用户管理
        </router-link>

        <span
          v-if="authStore.hasPermission('role:list')"
          class="menu-item disabled"
        >
          角色管理（后续阶段再做页面）
        </span>
      </div>

      <p
        v-if="!authStore.hasPermission('user:list') && !authStore.hasPermission('role:list')"
        class="no-permission"
      >
        当前用户没有任何菜单权限
      </p>
    </div>

    <div class="card">
      <h3>当前权限</h3>

      <ul>
        <li
          v-for="permission in authStore.permissions"
          :key="permission"
        >
          {{ permission }}
        </li>
      </ul>
    </div>

    <button @click="handleLogout">
      退出登录
    </button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"

import { useAuthStore } from "../stores/auth"

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push("/login")
}
</script>

<style scoped>
.page {
  padding: 32px;
}

.card {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

.menu-list {
  display: flex;
  gap: 12px;
}

.menu-item {
  display: inline-block;
  padding: 10px 16px;
  border: 1px solid #2563eb;
  border-radius: 6px;
  color: #2563eb;
  text-decoration: none;
}

.menu-item:hover {
  background: #eff6ff;
}

.disabled {
  border-color: #d1d5db;
  color: #999;
  cursor: not-allowed;
}

.no-permission {
  color: #999;
}

button {
  padding: 10px 18px;
  cursor: pointer;
}
</style>
```

------

## 8.10 解释首页菜单权限

菜单这里：

```
<router-link
  v-if="authStore.hasPermission('user:list')"
  class="menu-item"
  to="/users"
>
  用户管理
</router-link>
```

意思是：

```
如果当前用户有 user:list 权限，
就显示 用户管理 菜单。
```

角色管理这里：

```
<span
  v-if="authStore.hasPermission('role:list')"
  class="menu-item disabled"
>
  角色管理（后续阶段再做页面）
</span>
```

意思是：

```
如果当前用户有 role:list 权限，
就显示角色管理菜单。
```

不过我们目前还没有做角色管理页面，所以先显示成灰色。

------

## 8.11 启动项目测试

### 8.11.1 启动后端

进入：

```
rbac_project/backend
```

执行：

```
python manage.py runserver
```

------

### 8.11.2 启动前端

新开终端，进入：

```
rbac_project/frontend
```

执行：

```
npm run dev
```

浏览器打开：

```
http://localhost:5173/login
```

------

## 8.12 测试 admin

登录：

```
admin / 123456
```

首页应该看到：

```
用户管理
角色管理（后续阶段再做页面）
```

进入用户管理页面：

```
http://localhost:5173/users
```

应该看到：

```
新增用户按钮
删除用户按钮
```

因为 admin 有：

```
user:list
user:add
user:delete
role:list
```

------

## 8.13 测试 zhangsan

退出登录，然后登录：

```
zhangsan / 123456
```

首页应该看到：

```
用户管理
```

但是看不到：

```
角色管理
```

进入用户管理页面后，应该看到：

```
当前账号没有 user:add 权限，所以不显示新增按钮
```

每一行用户后面应该显示：

```
无删除权限
```

因为 zhangsan 只有：

```
user:list
```

没有：

```
user:add
user:delete
role:list
```

------

## 8.14 重点理解：前端权限不是安全核心

前端现在做的是：

```
有权限就显示按钮
没权限就隐藏按钮
```

但是这只是用户体验。

真正的安全还是后端做的。

比如 zhangsan 虽然看不到删除按钮，但如果他手动请求：

```
DELETE /api/users/3/
```

后端仍然会判断：

```
zhangsan 有没有 user:delete？
```

结果没有，所以后端返回：

```
403
```

所以正确结构是：

```
前端：控制显示
后端：控制安全
```

------

## 8.15 本阶段完整流程

现在完整流程是：

```
用户登录
  ↓
后端返回 permissions
  ↓
Vue3 保存 permissions
  ↓
首页根据 permissions 显示菜单
  ↓
进入用户管理页面
  ↓
页面根据 permissions 显示按钮
  ↓
点击按钮请求后端接口
  ↓
后端再次判断 JWT + RBAC 权限
  ↓
有权限执行
  ↓
没权限返回 403
```

------

## 8.16 阶段 8 完成标准

你需要确认：

```
1. admin 登录后可以看到用户管理菜单
2. admin 登录后可以看到新增用户按钮
3. admin 登录后可以看到删除用户按钮
4. zhangsan 登录后可以看到用户管理菜单
5. zhangsan 登录后看不到新增用户按钮
6. zhangsan 登录后看不到删除用户按钮
7. /users 页面必须登录后才能访问
8. /users 页面需要 user:list 权限
```

# 阶段 9：前后端完整联调和问题修复

本阶段目标：

```
1. 同时启动 Django 后端和 Vue3 前端
2. 测试登录流程
3. 测试 JWT 是否正常携带
4. 测试 RBAC 权限是否生效
5. 修复常见问题
6. 让 admin 和 zhangsan 的权限效果完全跑通
```

最终你要看到：

```
admin：
- 可以登录
- 可以查看用户列表
- 可以新增用户
- 可以删除用户

zhangsan：
- 可以登录
- 可以查看用户列表
- 看不到新增按钮
- 看不到删除按钮
- 手动请求新增 / 删除接口也会被后端拒绝
```

------

## 9.1 先确认完整项目结构

你的项目现在应该是：

```
rbac_project/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   └── rbac/
│       ├── models.py
│       ├── services.py
│       ├── jwt_utils.py
│       ├── auth.py
│       ├── responses.py
│       ├── views.py
│       ├── urls.py
│       └── management/
│           └── commands/
│               ├── init_rbac_data.py
│               └── check_permission.py
└── frontend/
    └── src/
        ├── api/
        │   ├── auth.js
        │   └── user.js
        ├── router/
        │   └── index.js
        ├── stores/
        │   └── auth.js
        ├── utils/
        │   └── request.js
        ├── views/
        │   ├── Login.vue
        │   ├── Home.vue
        │   ├── UserList.vue
        │   └── Forbidden.vue
        ├── App.vue
        └── main.js
```

------

## 9.2 启动后端

进入后端目录：

```
cd rbac_project/backend
```

启动虚拟环境。

Windows：

```
venv\Scripts\activate
```

macOS / Linux：

```
source venv/bin/activate
```

确认数据库迁移已经完成：

```
python manage.py migrate
```

确认测试数据已经初始化：

```
python manage.py init_rbac_data
```

启动后端：

```
python manage.py runserver
```

后端地址：

```
http://127.0.0.1:8000
```

------

## 9.3 启动前端

新开一个终端。

进入前端目录：

```
cd rbac_project/frontend
```

启动前端：

```
npm run dev
```

前端地址：

```
http://localhost:5173
```

------

## 9.4 先清理浏览器缓存数据

因为我们前面多次改过 token、权限、接口，浏览器里可能有旧数据。

打开浏览器控制台：

```
F12
```

进入：

```
Application
  ↓
Local Storage
  ↓
http://localhost:5173
```

删除这些内容：

```
access_token
refresh_token
user
permissions
```

或者直接在控制台执行：

```
localStorage.clear()
```

然后刷新页面。

------

## 9.5 完整测试流程 1：admin 登录

访问：

```
http://localhost:5173/login
```

输入：

```
admin
123456
```

登录成功后，应该跳转到：

```
http://localhost:5173/
```

首页应该显示：

```
用户名：admin
真实姓名：管理员
当前角色：管理员
```

权限列表应该包含：

```
user:list
user:add
user:delete
role:list
```

菜单应该显示：

```
用户管理
角色管理（后续阶段再做页面）
```

------

## 9.6 完整测试流程 2：admin 用户管理

点击：

```
用户管理
```

进入：

```
http://localhost:5173/users
```

admin 应该看到：

```
新增用户按钮
删除用户按钮
用户列表
```

点击新增用户，输入：

```
用户名：lisi
密码：123456
真实姓名：李四
```

如果新增成功，用户列表里应该出现：

```
lisi
```

点击删除按钮，应该可以删除用户。

注意：

```
admin 不能删除自己
```

如果你删除 admin 自己，后端会返回：

```
不能删除自己
```

这是正常的保护逻辑。

------

## 9.7 完整测试流程 3：zhangsan 登录

先退出登录。

然后登录：

```
zhangsan
123456
```

登录成功后首页应该显示：

```
用户名：zhangsan
真实姓名：张三
当前角色：普通用户
```

权限列表应该只有：

```
user:list
```

首页应该能看到：

```
用户管理
```

但是不应该看到：

```
角色管理
```

------

## 9.8 完整测试流程 4：zhangsan 用户管理

进入：

```
http://localhost:5173/users
```

zhangsan 应该能看到用户列表。

但是应该看不到：

```
新增用户按钮
删除用户按钮
```

页面上应该显示类似：

```
当前账号没有 user:add 权限，所以不显示新增按钮
无删除权限
```

这说明前端权限显示已经生效。

------

## 9.9 验证后端权限是否真的安全

前端隐藏按钮只是用户体验，真正安全必须靠后端。

所以我们要测试：

```
zhangsan 即使手动请求新增 / 删除接口，也必须失败。
```

### 9.9.1 登录 zhangsan 获取 token

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"123456"}'
```

Windows PowerShell：

```
curl -Method POST "http://127.0.0.1:8000/api/login/" `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"username":"zhangsan","password":"123456"}'
```

复制返回的：

```
access_token
```

------

### 9.9.2 用 zhangsan token 新增用户

macOS / Linux：

```
curl -X POST http://127.0.0.1:8000/api/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 你的zhangsan_access_token" \
  -d '{"username":"test001","password":"123456","real_name":"测试用户","phone":"13600000000","role_id":2,"status":1}'
```

正常应该返回：

```
{
  "code": 403,
  "message": "没有权限访问该接口，需要权限：user:add",
  "data": null
}
```

这说明后端权限拦截成功。

------

### 9.9.3 用 zhangsan token 删除用户

```
curl -X DELETE http://127.0.0.1:8000/api/users/3/ \
  -H "Authorization: Bearer 你的zhangsan_access_token"
```

正常应该返回：

```
{
  "code": 403,
  "message": "没有权限访问该接口，需要权限：user:delete",
  "data": null
}
```

这说明：

```
前端隐藏按钮成功
后端接口拦截也成功
```

------

## 9.10 建议修复 1：完善 token 过期自动刷新

阶段 5 里我们做了：

```
/api/token/refresh/
```

但是阶段 7 的前端目前遇到 401 会直接跳回登录页。

现在我们把它优化成：

```
access_token 过期
  ↓
自动用 refresh_token 换新的 access_token
  ↓
重新请求刚才失败的接口
  ↓
如果 refresh_token 也失效，再跳登录页
```

打开文件：

```
frontend/src/utils/request.js
```

替换成下面完整代码：

```
import axios from "axios"

const request = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  timeout: 10000
})

let isRefreshing = false
let waitingQueue = []

function clearLoginInfo() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user")
  localStorage.removeItem("permissions")
}

function retryWaitingQueue(newAccessToken) {
  waitingQueue.forEach(callback => {
    callback(newAccessToken)
  })

  waitingQueue = []
}

request.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem("access_token")

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response.data
  },
  async error => {
    const originalRequest = error.config

    if (!error.response) {
      return Promise.reject(error)
    }

    if (error.response.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest.url === "/token/refresh/") {
      clearLoginInfo()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      clearLoginInfo()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem("refresh_token")

    if (!refreshToken) {
      clearLoginInfo()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise(resolve => {
        waitingQueue.push(newAccessToken => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          resolve(request(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const refreshResponse = await axios.post(
        "http://127.0.0.1:8000/api/token/refresh/",
        {
          refresh_token: refreshToken
        }
      )

      const res = refreshResponse.data

      if (res.code !== 200) {
        throw new Error(res.message || "刷新 token 失败")
      }

      const newAccessToken = res.data.access_token

      localStorage.setItem("access_token", newAccessToken)

      retryWaitingQueue(newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

      return request(originalRequest)
    } catch (refreshError) {
      clearLoginInfo()
      window.location.href = "/login"
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default request
```

这个修复完成后：

```
access_token 过期时不会立刻退出登录
会先自动刷新 token
```

------

## 9.11 建议修复 2：后端返回菜单路径

现在前端是根据 `permission_code` 写死菜单：

```
有 user:list 显示用户管理
有 role:list 显示角色管理
```

这个阶段可以先不改。

但是如果你想让后端也返回菜单，可以在登录接口里返回：

```
menu_path
permission_name
permission_code
```

目前我们已经有：

```
sys_permission.menu_path
```

下一步如果想做动态菜单，可以再进入新阶段：

```
阶段 10：后端返回菜单，Vue3 动态生成菜单
```

现在阶段 9 先不展开，避免一下子太多。

------

## 9.12 常见问题修复

### 9.12.1 问题 1：前端登录时报 CORS 错误

错误一般长这样：

```
Access to XMLHttpRequest has been blocked by CORS policy
```

检查后端：

```
backend/config/settings.py
```

确认有：

```
INSTALLED_APPS = [
    ...
    "corsheaders",
    ...
]
```

确认中间件最上面有：

```
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    ...
]
```

确认最后有：

```
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

改完后必须重启后端：

```
python manage.py runserver
```

------

### 9.12.2 问题 2：登录接口 404

如果前端提示：

```
404 Not Found
```

说明接口地址不对。

确认前端请求地址是：

```
http://127.0.0.1:8000/api/login/
```

确认后端文件：

```
backend/config/urls.py
```

里面有：

```
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("rbac.urls")),
]
```

确认：

```
backend/rbac/urls.py
```

里面有：

```
path("login/", LoginView.as_view()),
```

最终地址才是：

```
/api/login/
```

------

### 9.12.3 问题 3：登录提示用户名或密码错误

先确认初始化数据执行过：

```
python manage.py init_rbac_data
```

然后确认数据库里有用户：

```
python manage.py shell
```

输入：

```
from rbac.models import SysUser

SysUser.objects.values("username", "real_name", "status")
```

应该能看到：

```
admin
zhangsan
```

再测试密码是否正确：

```
user = SysUser.objects.get(username="admin")
user.check_password("123456")
```

应该返回：

```
True
```

如果返回 `False`，说明密码没有正确加密。

可以重新初始化，或者在 shell 里手动改：

```
user.set_password("123456")
user.save()
```

------

### 9.12.4 问题 4：请求用户列表返回 401

401 表示：

```
没有登录，或者 token 不正确
```

检查浏览器 Local Storage 里有没有：

```
access_token
```

再检查请求头里有没有：

```
Authorization: Bearer xxx
```

在浏览器控制台 Network 里点 `/api/users/` 请求，看 Request Headers。

应该有：

```
Authorization: Bearer access_token
```

如果没有，重点检查：

```
frontend/src/utils/request.js
```

里面是否有：

```
config.headers.Authorization = `Bearer ${accessToken}`
```

------

### 9.12.5 问题 5：zhangsan 能看到新增按钮

这说明前端权限判断有问题。

检查登录后 Local Storage 里的：

```
permissions
```

zhangsan 应该只有：

```
["user:list"]
```

如果 zhangsan 有：

```
user:add
user:delete
```

说明后端初始化数据分配错了。

重新执行：

```
python manage.py init_rbac_data
```

然后退出登录，清空 localStorage，再重新登录。

------

### 9.12.6 问题 6：zhangsan 看不到按钮，但接口还能新增

这说明前端正常，后端权限拦截有问题。

重点检查：

```
backend/rbac/views.py
```

新增用户接口必须有：

```
@permission_required("user:add")
def post(self, request):
```

删除用户接口必须有：

```
@permission_required("user:delete")
def delete(self, request, user_id):
```

如果没有这两个装饰器，后端不会拦截。

------

### 9.12.7 问题 7：admin 新增用户时提示角色不存在

我们前端新增用户默认传：

```
role_id: 2
```

这个默认认为：

```
普通用户角色 id = 2
```

如果你的数据库里普通用户角色不是 2，就会失败。

进入 MySQL 查看：

```
SELECT * FROM sys_role;
```

看普通用户的 `id` 是多少。

如果不是 2，就把：

```
frontend/src/views/UserList.vue
```

里面的：

```
role_id: 2
```

改成你实际的普通用户角色 ID。

更好的做法是后面做一个角色下拉框接口，但本阶段先用固定值。

------

## 9.13 最终联调检查清单

你可以按这个清单逐项检查。

### 9.13.1 后端检查

```
1. python manage.py runserver 能启动
2. /api/login/ 能登录
3. /api/me/ 不带 token 返回 401
4. /api/users/ 不带 token 返回 401
5. admin token 请求 /api/users/ 成功
6. zhangsan token 请求 /api/users/ 成功
7. zhangsan token 请求 POST /api/users/ 返回 403
8. zhangsan token 请求 DELETE /api/users/3/ 返回 403
```

------

### 9.13.2 前端检查

```
1. npm run dev 能启动
2. /login 能打开
3. admin 能登录
4. zhangsan 能登录
5. 登录后 localStorage 有 token
6. admin 首页显示用户管理和角色管理
7. zhangsan 首页只显示用户管理
8. admin 用户管理页有新增和删除按钮
9. zhangsan 用户管理页没有新增和删除按钮
10. 退出登录后不能访问 /users
```

------

## 9.14 现在你已经完成的完整流程

到阶段 9，你的系统已经跑通了：

```
Vue3 登录页面
  ↓
输入账号密码
  ↓
请求 Django /api/login/
  ↓
Django 查询 MySQL 的 sys_user
  ↓
校验密码
  ↓
生成 JWT
  ↓
返回 access_token、refresh_token、用户信息、权限列表
  ↓
Vue3 保存 token 和 permissions
  ↓
Vue3 根据 permissions 显示菜单
  ↓
Vue3 根据 permissions 显示按钮
  ↓
Vue3 请求接口时自动携带 access_token
  ↓
Django 解析 JWT
  ↓
Django 获取当前用户
  ↓
Django 根据用户角色查询权限
  ↓
Django 判断接口需要的 permission_code
  ↓
有权限，执行接口
  ↓
没权限，返回 403
```

------

## 9.15 阶段 9 完成标准

你只要确认这 4 个效果，就说明完整项目已经跑通：

```
admin 登录：
可以查看用户列表
可以新增用户
可以删除用户

zhangsan 登录：
可以查看用户列表
不能新增用户
不能删除用户
```

到这里，当前版本的：

```
Django + MySQL + JWT + RBAC + Vue3
```

已经完成最小闭环。