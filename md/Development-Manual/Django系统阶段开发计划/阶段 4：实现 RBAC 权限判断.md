本阶段目标：

```plain
给一个用户 + 一个权限标识 permission_code
系统能判断这个用户有没有这个权限
```

---

## 4.1 本阶段的判断逻辑
你现在数据库里的关系是：

```plain
sys_user
  ↓ role_id
sys_role
  ↓ sys_role_permission
sys_permission
```

所以判断权限的流程是：

```plain
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

```plain
zhangsan -> 普通用户 -> user:list
```

所以：

```plain
zhangsan 有没有 user:list？   True
zhangsan 有没有 user:delete？ False
```

---

## 4.2 新建权限服务文件
新建文件：

```plain
backend/rbac/services.py
```

完整代码如下：

```plain
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

---

## 4.3 解释这个文件做了什么
这个文件里面最重要的是这几个方法。

### 4.3.1 根据用户名查权限
```plain
RBACService.get_user_permission_codes_by_username("admin")
```

它会返回 admin 拥有的所有权限。

例如：

```plain
{
    "user:list",
    "user:add",
    "user:delete",
    "role:list"
}
```

---

### 4.3.2 根据用户 ID 查权限
```plain
RBACService.get_user_permission_codes_by_id(1)
```

它会根据 `sys_user.user_id` 查询这个用户的权限。

---

### 4.3.3 判断用户有没有某个权限
```plain
RBACService.has_permission_by_username("admin", "user:delete")
```

如果 admin 有 `user:delete`，返回：

```plain
True
```

如果没有，返回：

```plain
False
```

---

## 4.4 用 Django shell 测试
确认你现在在：

```plain
rbac_project/backend
```

然后进入 Django shell：

```plain
python manage.py shell
```

---

### 4.4.1 测试 admin 的所有权限
输入：

```plain
from rbac.services import RBACService

RBACService.get_user_permission_codes_by_username("admin")
```

正常应该返回类似：

```plain
{"user:list", "user:add", "user:delete", "role:list"}
```

说明 admin 拥有全部权限。

---

### 4.4.2 测试 zhangsan 的所有权限
输入：

```plain
RBACService.get_user_permission_codes_by_username("zhangsan")
```

正常应该返回：

```plain
{"user:list"}
```

说明 zhangsan 只有查看用户列表的权限。

---

### 4.4.3 测试 admin 是否有删除权限
输入：

```plain
RBACService.has_permission_by_username("admin", "user:delete")
```

应该返回：

```plain
True
```

因为 admin 是管理员，有删除用户权限。

---

### 4.4.4 测试 zhangsan 是否有删除权限
输入：

```plain
RBACService.has_permission_by_username("zhangsan", "user:delete")
```

应该返回：

```plain
False
```

因为 zhangsan 是普通用户，没有删除权限。

---

### 4.4.5 测试 zhangsan 是否有用户列表权限
输入：

```plain
RBACService.has_permission_by_username("zhangsan", "user:list")
```

应该返回：

```plain
True
```

因为普通用户拥有 `user:list` 权限。

---

## 4.5 当前阶段完整流程
现在权限判断流程已经成立：

```plain
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

---

