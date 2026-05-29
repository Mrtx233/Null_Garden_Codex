本阶段目标：

```plain
1. 创建几个权限
2. 创建两个角色
3. 给角色分配权限
4. 创建两个系统用户
5. 验证数据库里已经有完整 RBAC 数据
```

---

## 3.1 本阶段要插入的数据
### 3.1.1 权限数据
插入到：

```plain
sys_permission
```

数据如下：

| _*****__**permission_code**__*****_ | _*****__**permission_name**__*****_ | _*****__**menu_path**__*****_ |
| --- | --- | --- |
| user:list | 用户列表 | /users |
| user:add | 新增用户 | /users |
| user:delete | 删除用户 | /users |
| role:list | 角色列表 | /roles |


---

### 3.1.2 角色数据
插入到：

```plain
sys_role
```

数据如下：

| _*****__**role_code**__*****_ | _*****__**role_name**__*****_ |
| --- | --- |
| admin | 管理员 |
| user | 普通用户 |


---

### 3.1.3 角色权限关系
插入到：

```plain
sys_role_permission
```

管理员拥有全部权限：

```plain
admin:
- user:list
- user:add
- user:delete
- role:list
```

普通用户只拥有用户列表权限：

```plain
user:
- user:list
```

---

### 3.1.4 用户数据
插入到：

```plain
sys_user
```

数据如下：

| _*****__**username**__*****_ | _*****__**password**__*****_ | _*****__**role**__*****_ |
| --- | --- | --- |
| admin | 123456 | 管理员 |
| zhangsan | 123456 | 普通用户 |


注意：

```plain
这里的 admin 是 sys_user 表里的业务用户，
不是 Django 后台 /admin/ 的超级管理员。
```

---

## 3.2 创建初始化命令文件
### 3.2.1 第 1 步：创建目录
确认你现在在：

```plain
rbac_project/backend
```

执行：

macOS / Linux

```plain
mkdir -p rbac/management/commands
```

Windows

如果你用的是 PowerShell，可以执行：

```plain
mkdir rbac\management\commands
```

如果提示目录已经存在，没关系。

---

### 3.2.2 第 2 步：创建空的 `__init__.py`
Django 需要识别这是一个 Python 包。

创建这两个空文件：

```plain
backend/rbac/management/__init__.py
backend/rbac/management/commands/__init__.py
```

这两个文件里面什么都不用写。

目录结构变成这样：

```plain
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

---

### 3.2.3 第 3 步：创建初始化命令
新建文件：

```plain
backend/rbac/management/commands/init_rbac_data.py
```

写入下面完整代码：

```plain
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

---

## 3.3 执行初始化命令
确认你在：

```plain
rbac_project/backend
```

执行：

```plain
python manage.py init_rbac_data
```

如果成功，你会看到类似输出：

```plain
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

```plain
get_or_create
```

它的意思是：

```plain
如果数据不存在，就创建；
如果数据已经存在，就直接使用已有数据。
```

---

## 3.4 检查数据库数据
进入 MySQL：

```plain
mysql -u root -p
```

选择数据库：

```plain
USE rbac_db;
```

---

### 3.4.1 查看权限表
```plain
SELECT * FROM sys_permission;
```

你应该看到类似：

```plain
user:list
user:add
user:delete
role:list
```

---

### 3.4.2 查看角色表
```plain
SELECT * FROM sys_role;
```

你应该看到：

```plain
admin    管理员
user     普通用户
```

---

### 3.4.3 查看用户表
```plain
SELECT user_id, username, real_name, phone, role_id, status FROM sys_user;
```

你应该看到：

```plain
admin
zhangsan
```

注意不要直接看 password 字段，因为我们保存的是加密后的密码。

---

### 3.4.4 查看角色权限关系
```plain
SELECT * FROM sys_role_permission;
```

你应该看到管理员有多条权限，普通用户有一条权限。

---

## 3.5 用关联查询看得更清楚
你可以执行下面 SQL：

```plain
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

```plain
管理员    user:list      用户列表
管理员    user:add       新增用户
管理员    user:delete    删除用户
管理员    role:list      角色列表
普通用户  user:list      用户列表
```

这说明：

```plain
角色 -> 权限
```

关系已经成功建立。

---

## 3.6 用 Django shell 检查数据
也可以不用 MySQL，直接用 Django 检查。

执行：

```plain
python manage.py shell
```

进入 shell 后输入：

```plain
from rbac.models import SysUser

admin = SysUser.objects.get(username="admin")
admin.role.role_name
```

结果应该是：

```plain
管理员
```

继续输入：

```plain
admin.role.permissions.all()
```

你应该能看到管理员拥有的权限。

再查普通用户：

```plain
zhangsan = SysUser.objects.get(username="zhangsan")
zhangsan.role.role_name
```

结果应该是：

```plain
普通用户
```

再输入：

```plain
zhangsan.role.permissions.all()
```

你应该只看到：

```plain
user:list
```

退出 shell：

```plain
exit()
```

---

## 3.7 当前阶段完成后的数据关系
现在数据库里的关系是：

```plain
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

```plain
admin 可以查看用户、新增用户、删除用户、查看角色

zhangsan 只能查看用户
```

