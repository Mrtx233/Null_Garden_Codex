# 阶段 4：实现 RBAC 权限判断

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：4 / 18 ｜ **定位**：基于 RBAC 四表关系实现"用户—权限标识"判断的服务层 ｜ **建议学时**：3–4 小时

大家好，我是小马不起床。

---

## 阶段导语

阶段 1–3 已完成 Django 项目创建、RBAC 四张表建模与测试数据插入。本阶段在这些数据之上实现权限查询服务，即基于角色的访问控制（Role-Based Access Control，RBAC）判断逻辑，为后续 JWT 登录与接口权限拦截提供统一入口。

本阶段的输入为一个用户与一个权限标识 permission_code，输出为该用户是否拥有此权限的布尔结果。内容包含五部分：判断逻辑梳理、权限服务文件编写、核心方法说明、Django shell 验证，以及本阶段完整链路复盘。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 描述 sys_user、sys_role、sys_permission、sys_role_permission 四表在权限判断链路中的串联关系
- [ ] 编写 RBACService 权限服务类，提供按 user_id、username 获取权限标识集合的方法
- [ ] 说明用户不存在与用户状态异常两类情况下返回空集合的处理策略
- [ ] 使用 Django shell 验证 admin 与 zhangsan 的权限判断结果
- [ ] 复述从 username 与 permission_code 输入到 True/False 输出的完整判断流程

---

## 前置知识

本阶段依赖阶段 3（`阶段 3：插入 RBAC 测试数据.md`）的成果：

| 前置条目 | 具体要求 |
|----------|----------|
| RBAC 四张表 | sys_user、sys_role、sys_permission、sys_role_permission 已创建 |
| 测试数据 | admin（管理员角色）、zhangsan（普通用户角色）已插入且可查询 |
| 模型定义 | `backend/rbac/models.py` 中已存在 SysUser、SysRole、SysPermission 模型 |
| 基础操作 | 可进入 `rbac_project/backend` 目录并运行 `python manage.py shell` |

若上述内容尚不熟悉，建议先完成阶段 3 的学习。

---

## 目录

1. [权限判断逻辑](#1-权限判断逻辑)
2. [新建权限服务文件](#2-新建权限服务文件)
3. [服务方法说明](#3-服务方法说明)
4. [Django shell 测试](#4-django-shell-测试)
5. [阶段完整流程](#5-阶段完整流程)
6. [阶段小结](#阶段小结)
7. [常见问题与排查](#常见问题与排查)
8. [下一阶段衔接](#下一阶段衔接)

---

## 1. 权限判断逻辑

### 1.1 阶段目标

```text
给一个用户 + 一个权限标识 permission_code
系统能判断这个用户有没有这个权限
```

### 1.2 数据库关系

阶段 3 完成后，数据库中已建立的关系链路为：

```text
sys_user
  ↓ role_id
sys_role
  ↓ sys_role_permission
sys_permission
```

用户通过 role_id 关联角色，角色通过 sys_role_permission 关联权限，权限标识 permission_code 存储在 sys_permission 中。

### 1.3 判断流程

基于上述关系，权限判断按以下流程执行：

```text
1. 找到用户
2. 判断用户是否存在
3. 判断用户状态是否正常
4. 找到用户的角色
5. 找到这个角色拥有的所有权限
6. 判断权限列表里面有没有目标 permission_code
7. 有，返回 True
8. 没有，返回 False
```

### 1.4 示例

以测试数据中的用户关系为例：

```text
zhangsan -> 普通用户 -> user:list
```

据此可得两个判断结果：

```text
zhangsan 有没有 user:list？   True
zhangsan 有没有 user:delete？ False
```

**本章要点**：

- **要点**：权限判断的本质是沿"用户 → 角色 → 权限"三级关系链路逐层查询。
- **要点**：判断前先校验用户存在性与用户状态，两项不满足时不再进入权限比对。
- **要点**：最终输出为布尔结果，permission_code 命中角色权限列表则返回 True。
- **要点**：zhangsan 拥有 user:list、不含 user:delete，是本阶段验证的基准结果。

---

## 2. 新建权限服务文件

### 2.1 文件路径

新建文件：

```text
backend/rbac/services.py
```

### 2.2 完整代码

```python
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

### 2.3 方法一览

RBACService 全部为静态方法，按职责可分为三组：

| 分组 | 方法 | 入参 | 返回 |
|------|------|------|------|
| 用户查询 | `get_user_by_id` | user_id | SysUser 对象或 None |
| 用户查询 | `get_user_by_username` | username | SysUser 对象或 None |
| 权限集合 | `get_user_permission_codes_by_user` | 用户对象 | permission_code 集合 |
| 权限集合 | `get_user_permission_codes_by_id` | user_id | permission_code 集合 |
| 权限集合 | `get_user_permission_codes_by_username` | username | permission_code 集合 |
| 权限判断 | `has_permission_by_user` | 用户对象 + permission_code | True / False |
| 权限判断 | `has_permission_by_user_id` | user_id + permission_code | True / False |
| 权限判断 | `has_permission_by_username` | username + permission_code | True / False |

**本章要点**：

- **要点**：服务类以静态方法组织，调用时无需实例化。
- **要点**：用户查询使用 `select_related("role")`，一次查询同时带出角色对象。
- **要点**：权限集合方法对用户不存在、状态异常两种边界统一返回空集合。
- **要点**：权限查询通过 `roles=user.role` 反查角色关联的权限并 `distinct()` 去重。
- **要点**：`has_permission_*` 系列方法复用权限集合方法，仅追加 in 判断。

---

## 3. 服务方法说明

文件中最核心的是以下三类方法。

### 3.1 根据用户名查询权限集合

```python
RBACService.get_user_permission_codes_by_username("admin")
```

该调用返回 admin 拥有的所有权限，例如：

```text
{
    "user:list",
    "user:add",
    "user:delete",
    "role:list"
}
```

### 3.2 根据用户 ID 查询权限集合

```python
RBACService.get_user_permission_codes_by_id(1)
```

该方法根据 `sys_user.user_id` 查询对应用户的权限集合。

### 3.3 判断用户是否拥有某个权限

```python
RBACService.has_permission_by_username("admin", "user:delete")
```

若 admin 拥有 `user:delete`，返回：

```text
True
```

若没有，返回：

```text
False
```

**本章要点**：

- **要点**：权限集合方法返回 set 结构，可直接用于成员判断与前端下发。
- **要点**：按 user_id 与按 username 的两条查询路径最终汇入同一个集合构建逻辑。
- **要点**：权限判断方法只做成员检查，不改变任何数据，可安全用于每次请求。
- **要点**：admin 作为管理员角色，其权限集合覆盖 user:list、user:add、user:delete、role:list。

---

## 4. Django shell 测试

### 4.1 进入 shell

确认当前目录为：

```text
rbac_project/backend
```

进入 Django shell：

```bash
python manage.py shell
```

### 4.2 测试 admin 的所有权限

输入：

```python
from rbac.services import RBACService

RBACService.get_user_permission_codes_by_username("admin")
```

正常应返回类似结果：

```text
{"user:list", "user:add", "user:delete", "role:list"}
```

结果表明 admin 拥有全部权限。

### 4.3 测试 zhangsan 的所有权限

输入：

```python
RBACService.get_user_permission_codes_by_username("zhangsan")
```

正常应返回：

```text
{"user:list"}
```

结果表明 zhangsan 只有查看用户列表的权限。

### 4.4 测试 admin 是否有删除权限

输入：

```python
RBACService.has_permission_by_username("admin", "user:delete")
```

应返回：

```text
True
```

原因是 admin 属于管理员角色，拥有删除用户权限。

### 4.5 测试 zhangsan 是否有删除权限

输入：

```python
RBACService.has_permission_by_username("zhangsan", "user:delete")
```

应返回：

```text
False
```

原因是 zhangsan 属于普通用户角色，没有删除权限。

### 4.6 测试 zhangsan 是否有用户列表权限

输入：

```python
RBACService.has_permission_by_username("zhangsan", "user:list")
```

应返回：

```text
True
```

原因是普通用户角色拥有 `user:list` 权限。

**本章要点**：

- **要点**：全部测试通过 `from rbac.services import RBACService` 在服务文件所在项目内进行。
- **要点**：集合类测试验证权限数据完整性，布尔类测试验证判断逻辑正确性。
- **要点**：admin 返回四权限、zhangsan 仅返回 user:list，是阶段 3 数据插入正确的直接证据。
- **要点**：删除权限的 True/False 对照测试覆盖了"有权限"与"无权限"两条分支。

---

## 5. 阶段完整流程

本阶段完成后，权限判断链路已经成立。以 username = zhangsan、permission_code = user:delete 为例：

```text
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

**本章要点**：

- **要点**：一次完整判断横跨 sys_user、sys_role、sys_role_permission、sys_permission 四张表。
- **要点**：中间结果"普通用户的权限列表"由 RBACService 一次性取出为集合。
- **要点**：该链路是后续接口权限拦截的执行内核，阶段 6 的装饰器将直接调用这里的判断方法。

---

## 阶段小结

| 知识模块 | 核心要点 | 在权限体系中的作用 |
|----------|----------|--------------------|
| 判断逻辑 | 用户 → 角色 → 权限三级链路，先校验存在性与状态再比对权限 | 定义权限判断的执行顺序 |
| 服务文件 | `backend/rbac/services.py`，RBACService 静态方法集合 | 权限判断的统一服务入口 |
| 用户查询 | `select_related("role")` 连表取角色，不存在时返回 None | 为权限集合查询提供完整用户对象 |
| 权限集合 | 按角色反查 SysPermission 并 `distinct()` 去重，转为 permission_code 集合 | 屏蔽表结构细节，输出可直接判断的数据 |
| 权限判断 | `has_permission_*` 系列做成员检查，返回 True/False | 供视图、装饰器与后续阶段调用 |
| shell 验证 | admin 四权限、zhangsan 仅 user:list | 确认服务逻辑与测试数据一致 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 权限集合查询返回空集合 | 用户不存在，或 `user.status != 1` 状态异常 | 核对 sys_user 中该用户记录是否存在、status 是否为 1 |
| 权限集合缺少预期的 permission_code | sys_role_permission 中缺少对应角色与权限的关联数据 | 对照阶段 3 的测试数据补齐角色—权限关联 |
| `get_user_by_id` 返回 None | 传入的 user_id 在 sys_user 中无匹配记录 | 确认 user_id 与表中主键值一致 |
| 权限集合中出现重复项 | 查询链路未去重 | 保留权限查询中的 `distinct()` 调用 |
| shell 中导入服务失败 | 未处于 `rbac_project/backend` 目录，或未经由 `python manage.py shell` 进入 | 切换到正确目录并使用 Django shell |

---

## 下一阶段衔接

本阶段交付的 RBACService 解决了"给定用户与权限标识，判断是否放行"这一核心问题，但系统尚未具备"识别当前请求来自哪个用户"的能力。

阶段 5（`阶段 5：实现 JWT 登录.md`）将引入 JSON Web Token（JWT）登录：用户以账号密码换取 token，后端从 token 中解析出 user_id，再交由本阶段的 RBACService 完成权限判断。阶段 6 会进一步把这条链路封装为接口级权限拦截，最终由阶段 7（`阶段 7：实现 Vue3 登录.md`）在前端接入完整的登录与权限体系。
