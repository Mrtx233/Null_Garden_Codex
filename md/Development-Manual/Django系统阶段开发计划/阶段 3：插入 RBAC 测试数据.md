# 阶段 3：插入 RBAC 测试数据

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：3 / 18 ｜ **定位**：以自定义管理命令初始化 RBAC 测试数据，并多渠道验证四张表中的数据关系 ｜ **建议学时**：3–4 小时

大家好，我是小马不起床。

---

## 阶段导语

阶段 2 建成的 RBAC 四张表尚无数据，本阶段向其中写入一批可支撑后续开发的测试数据，包含五个环节：

```text
1. 创建几个权限
2. 创建两个角色
3. 给角色分配权限
4. 创建两个系统用户
5. 验证数据库里已经有完整 RBAC 数据
```

数据通过 Django 自定义管理命令 `init_rbac_data` 灌入，命令使用 `get_or_create` 保证可重复执行。验证环节覆盖 MySQL 客户端、关联查询与 Django shell 三种途径。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 描述本阶段初始化数据的范围：权限、角色、角色权限关系、用户四组数据
- [ ] 创建 `management/commands` 包结构，实现自定义管理命令 `init_rbac_data`
- [ ] 使用 `get_or_create` 与 `permissions.set` 实现幂等的数据初始化
- [ ] 通过 `SELECT` 语句与多表 JOIN 查询验证 `sys_role_permission` 中的授权关系
- [ ] 在 Django shell 中以对象方式验证用户、角色、权限的关联

---

## 前置知识

本阶段依赖阶段 2（阶段 2：创建 RBAC 四张表.md）的产出：

| 前置条目 | 具体要求 |
|----------|----------|
| 四张表已创建 | `rbac_db` 中存在 `sys_permission`、`sys_role`、`sys_role_permission`、`sys_user` |
| 模型定义 | `backend/rbac/models.py` 中四个模型类可正常导入，`SysUser.set_password` 可用 |
| 阶段 1 基础 | 可在 `backend` 目录执行 `python manage.py` 系列命令 |

若上述内容尚未完成，建议先完成阶段 2。

---

## 目录

1. [本阶段要插入的数据](#1-本阶段要插入的数据)
2. [创建初始化命令文件](#2-创建初始化命令文件)
3. [执行初始化命令](#3-执行初始化命令)
4. [检查数据库数据](#4-检查数据库数据)
5. [用关联查询看得更清楚](#5-用关联查询看得更清楚)
6. [用 Django shell 检查数据](#6-用-django-shell-检查数据)
7. [当前阶段完成后的数据关系](#7-当前阶段完成后的数据关系)
8. [阶段小结](#阶段小结)
9. [常见问题与排查](#常见问题与排查)
10. [下一阶段衔接](#下一阶段衔接)

---

## 1. 本阶段要插入的数据

### 1.1 权限数据

插入到 `sys_permission` 表，数据如下：

| permission_code | permission_name | menu_path |
| --- | --- | --- |
| user:list | 用户列表 | /users |
| user:add | 新增用户 | /users |
| user:delete | 删除用户 | /users |
| role:list | 角色列表 | /roles |

### 1.2 角色数据

插入到 `sys_role` 表，数据如下：

| role_code | role_name |
| --- | --- |
| admin | 管理员 |
| user | 普通用户 |

### 1.3 角色权限关系

插入到 `sys_role_permission` 表。管理员拥有全部权限：

```text
admin:
- user:list
- user:add
- user:delete
- role:list
```

普通用户只拥有用户列表权限：

```text
user:
- user:list
```

### 1.4 用户数据

插入到 `sys_user` 表，数据如下：

| username | password | role |
| --- | --- | --- |
| admin | 123456 | 管理员 |
| zhangsan | 123456 | 普通用户 |

需要注意：这里的 admin 是 `sys_user` 表里的业务用户，不是 Django 后台 `/admin/` 的超级管理员。

**要点**

- 四组数据的写入顺序为权限 → 角色 → 授权关系 → 用户，后者依赖前者
- 权限以 `permission_code` 作为唯一标识，授权关系引用该标识
- 业务用户 admin 与后台超级管理员是两套互不相干的账号

---

## 2. 创建初始化命令文件

### 2.1 第 1 步：创建目录

确认当前位于：

```text
rbac_project/backend
```

macOS / Linux 下执行：

```bash
mkdir -p rbac/management/commands
```

Windows 的 PowerShell 环境下执行：

```powershell
mkdir rbac\management\commands
```

若提示目录已经存在，不影响后续步骤。

### 2.2 第 2 步：创建空的 `__init__.py`

Django 需要识别这是一个 Python 包，创建以下两个空文件：

```text
backend/rbac/management/__init__.py
backend/rbac/management/commands/__init__.py
```

两个文件内部无需任何内容。目录结构随之变为：

```text
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

### 2.3 第 3 步：创建初始化命令

新建文件：

```text
backend/rbac/management/commands/init_rbac_data.py
```

写入以下完整代码：

```python
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

**要点**

- `management/commands` 两级目录及各自的 `__init__.py` 缺一不可，否则命令无法被识别
- 命令文件名 `init_rbac_data` 即后续 manage.py 子命令名
- 权限与角色用 `get_or_create` 写入，用户用 `filter(...).exists()` 判重后写入

---

## 3. 执行初始化命令

确认当前位于：

```text
rbac_project/backend
```

执行：

```bash
python manage.py init_rbac_data
```

成功时输出类似：

```text
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

重复执行该命令也不会重复创建数据，因为代码使用了：

```text
get_or_create
```

其含义为：

```text
如果数据不存在，就创建；
如果数据已经存在，就直接使用已有数据。
```

**要点**

- 首次执行输出"创建……"，重复执行输出"已存在……"，两种情况均为正常
- 幂等性来自 `get_or_create` 与用户写入前的存在性判断
- 授权关系使用 `permissions.set`，每次执行都会按目标列表重置

---

## 4. 检查数据库数据

进入 MySQL：

```bash
mysql -u root -p
```

选择数据库：

```sql
USE rbac_db;
```

### 4.1 查看权限表

```sql
SELECT * FROM sys_permission;
```

应看到类似：

```text
user:list
user:add
user:delete
role:list
```

### 4.2 查看角色表

```sql
SELECT * FROM sys_role;
```

应看到：

```text
admin    管理员
user     普通用户
```

### 4.3 查看用户表

```sql
SELECT user_id, username, real_name, phone, role_id, status FROM sys_user;
```

应看到：

```text
admin
zhangsan
```

不直接查看 password 字段，其中保存的是加密后的密码。

### 4.4 查看角色权限关系

```sql
SELECT * FROM sys_role_permission;
```

管理员对应多条权限记录，普通用户对应一条权限记录。

**要点**

- 用户表查询显式列出字段，跳过加密的 password 列
- `sys_role_permission` 中的记录条数即角色授权数量
- 每张表的预期结果与第 1 章的数据设计一一对应

---

## 5. 用关联查询看得更清楚

执行下面 SQL：

```sql
SELECT
    r.role_name,
    p.permission_code,
    p.permission_name
FROM sys_role_permission rp
JOIN sys_role r ON rp.role_id = r.id
JOIN sys_permission p ON rp.permission_id = p.id
ORDER BY r.id, p.id;
```

应看到类似：

```text
管理员    user:list      用户列表
管理员    user:add       新增用户
管理员    user:delete    删除用户
管理员    role:list      角色列表
普通用户  user:list      用户列表
```

这说明角色到权限（`角色 -> 权限`）的关系已成功建立。

**要点**

- 中间表 `sys_role_permission` 通过 `role_id`、`permission_id` 两个外键关联主表
- JOIN 查询是核对授权关系最直观的手段
- 结果共 5 行：管理员 4 条、普通用户 1 条

---

## 6. 用 Django shell 检查数据

除 MySQL 外，也可以直接用 Django 检查。执行：

```bash
python manage.py shell
```

进入 shell 后输入：

```python
from rbac.models import SysUser

admin = SysUser.objects.get(username="admin")
admin.role.role_name
```

结果应为：

```text
管理员
```

继续输入：

```python
admin.role.permissions.all()
```

可看到管理员拥有的权限。再查普通用户：

```python
zhangsan = SysUser.objects.get(username="zhangsan")
zhangsan.role.role_name
```

结果应为：

```text
普通用户
```

再输入：

```python
zhangsan.role.permissions.all()
```

只应看到：

```text
user:list
```

退出 shell：

```python
exit()
```

**要点**

- 对象路径 `user.role.role_name`、`role.permissions.all()` 直接体现模型层的关系设计
- shell 验证与 SQL 验证结果应一致，二者互为印证
- 模型间的反向与正向访问均基于阶段 2 定义的外键和多对多关系

---

## 7. 当前阶段完成后的数据关系

现在数据库中的关系为：

```text
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

即：

```text
admin 可以查看用户、新增用户、删除用户、查看角色

zhangsan 只能查看用户
```

**要点**

- 完整链路为：用户 → 角色 → 权限，两级传递
- admin 持有 4 项权限，zhangsan 仅持有 user:list
- 该关系图是阶段 4 权限判断逻辑要还原的目标

---

## 阶段小结

| 步骤 | 说明 |
|------|------|
| 数据设计 | 4 项权限、2 个角色、5 条授权关系、2 个测试用户 |
| 命令实现 | 建立 `management/commands` 包，编写 `init_rbac_data.py` |
| 执行初始化 | `python manage.py init_rbac_data`，重复执行保持幂等 |
| SQL 验证 | 四张表分别 `SELECT`，并以 JOIN 查询核对角色-权限关系 |
| shell 验证 | 通过模型对象访问 role 与 permissions 确认关联 |
| 关系确认 | admin 拥有 4 项权限，zhangsan 仅拥有 user:list |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| `python manage.py init_rbac_data` 提示无法识别该命令 | `management` 或 `commands` 目录缺少 `__init__.py`，或命令文件不在 `backend/rbac/management/commands/` 下 | 按 2.2 的目录树核对包结构与文件名 |
| 重复执行命令后权限输出"已存在" | `get_or_create` 判定数据已存在，属预期行为 | 无需处理；该设计保证命令可重复执行 |
| `sys_user` 表 password 字段显示为一长串加密文本 | 写入时经过 `set_password` 加密 | 属正常现象；核对密码应使用 `check_password`，不要与明文比对 |
| JOIN 查询结果条数与预期不符 | 授权数据未写入完整，或执行命令前四张表尚未创建 | 先确认阶段 2 迁移已完成，再重新执行初始化命令 |
| shell 中 `admin.role` 访问报错 | 用户记录未成功绑定角色 | 用 `SELECT user_id, username, role_id FROM sys_user;` 核对 `role_id` 是否有值 |

---

## 下一阶段衔接

阶段 3 使四张 RBAC 表具备了完整的测试数据，"用户 → 角色 → 权限"的数据链路已可查询验证。阶段 4（阶段 4：实现 RBAC 权限判断.md）将基于这些数据实现权限判断逻辑：给定一个登录用户，沿本阶段建立的关系链取出其全部 `permission_code`，作为后续接口权限拦截与前端菜单控制的依据。
