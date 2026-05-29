本阶段目标：

```plain
1. 登录后根据 permissions 显示菜单
2. 根据 permissions 显示按钮
3. 没有页面权限时跳转 403 页面
4. 请求用户列表接口
5. admin 可以新增、删除用户
6. zhangsan 只能查看用户，不能新增、不能删除
```

这一阶段只做前端。

---

## 8.1 本阶段要修改 / 新增的文件
```plain
frontend/src/api/user.js              新增
frontend/src/views/UserList.vue       新增
frontend/src/views/Forbidden.vue      新增
frontend/src/router/index.js          修改
frontend/src/views/Home.vue           修改
```

---

## 8.2 确认当前前端已有权限判断方法
你在阶段 7 的文件：

```plain
frontend/src/stores/auth.js
```

里面已经有这个方法：

```plain
hasPermission: state => {
  return permissionCode => {
    return state.permissions.includes(permissionCode)
  }
}
```

它的作用是：

```plain
判断当前用户有没有某个权限
```

比如：

```plain
authStore.hasPermission("user:list")
authStore.hasPermission("user:add")
authStore.hasPermission("user:delete")
```

返回结果是：

```plain
true 或 false
```

所以阶段 8 直接复用它。

---

## 8.3 新增用户接口文件
新建文件：

```plain
frontend/src/api/user.js
```

写入：

```plain
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

```plain
GET    /api/users/           查看用户列表
POST   /api/users/           新增用户
DELETE /api/users/<user_id>/ 删除用户
```

权限对应关系：

```plain
GET    /api/users/           user:list
POST   /api/users/           user:add
DELETE /api/users/<user_id>/ user:delete
```

---

## 8.4 新增 403 页面
新建文件：

```plain
frontend/src/views/Forbidden.vue
```

写入：

```plain
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

```plain
当用户没有权限访问某个路由时，显示 403 页面。
```

---

## 8.5 新增用户管理页面
新建文件：

```plain
frontend/src/views/UserList.vue
```

写入完整代码：

```plain
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

---

## 8.6 解释用户管理页面
这个页面里有 3 个权限判断。

### 8.6.1 页面权限
用户能不能进入这个页面，看：

```plain
user:list
```

这个在路由里判断。

---

### 8.6.2 新增按钮权限
新增按钮这里：

```plain
<button
  v-if="authStore.hasPermission('user:add')"
  @click="handleAddUser"
>
  新增用户
</button>

```

意思是：

```plain
有 user:add 权限，显示新增按钮
没有 user:add 权限，不显示新增按钮
```

---

### 8.6.3 删除按钮权限
删除按钮这里：

```plain
<button
  v-if="authStore.hasPermission('user:delete')"
  class="danger"
  @click="handleDeleteUser(user)"
>
  删除
</button>

```

意思是：

```plain
有 user:delete 权限，显示删除按钮
没有 user:delete 权限，不显示删除按钮
```

---

## 8.7 修改路由文件
打开文件：

```plain
frontend/src/router/index.js
```

替换成下面完整代码：

```plain
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

---

## 8.8 解释路由权限
这个路由：

```plain
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

```plain
访问 /users 页面，必须满足两个条件：
1. 已登录
2. 拥有 user:list 权限
```

如果没有登录：

```plain
跳转 /login
```

如果登录了，但没有权限：

```plain
跳转 /403
```

---

## 8.9 修改首页，显示菜单
打开文件：

```plain
frontend/src/views/Home.vue
```

替换成下面完整代码：

```plain
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

---

## 8.10 解释首页菜单权限
菜单这里：

```plain
<router-link
  v-if="authStore.hasPermission('user:list')"
  class="menu-item"
  to="/users"
>
  用户管理
</router-link>

```

意思是：

```plain
如果当前用户有 user:list 权限，
就显示 用户管理 菜单。
```

角色管理这里：

```plain
<span
  v-if="authStore.hasPermission('role:list')"
  class="menu-item disabled"
>
  角色管理（后续阶段再做页面）
</span>

```

意思是：

```plain
如果当前用户有 role:list 权限，
就显示角色管理菜单。
```

不过我们目前还没有做角色管理页面，所以先显示成灰色。

---

## 8.11 启动项目测试
### 8.11.1 启动后端
进入：

```plain
rbac_project/backend
```

执行：

```plain
python manage.py runserver
```

---

### 8.11.2 启动前端
新开终端，进入：

```plain
rbac_project/frontend
```

执行：

```plain
npm run dev
```

浏览器打开：

```plain
http://localhost:5173/login
```

---

## 8.12 测试 admin
登录：

```plain
admin / 123456
```

首页应该看到：

```plain
用户管理
角色管理（后续阶段再做页面）
```

进入用户管理页面：

```plain
http://localhost:5173/users
```

应该看到：

```plain
新增用户按钮
删除用户按钮
```

因为 admin 有：

```plain
user:list
user:add
user:delete
role:list
```

---

## 8.13 测试 zhangsan
退出登录，然后登录：

```plain
zhangsan / 123456
```

首页应该看到：

```plain
用户管理
```

但是看不到：

```plain
角色管理
```

进入用户管理页面后，应该看到：

```plain
当前账号没有 user:add 权限，所以不显示新增按钮
```

每一行用户后面应该显示：

```plain
无删除权限
```

因为 zhangsan 只有：

```plain
user:list
```

没有：

```plain
user:add
user:delete
role:list
```

---

## 8.14 重点理解：前端权限不是安全核心
前端现在做的是：

```plain
有权限就显示按钮
没权限就隐藏按钮
```

但是这只是用户体验。

真正的安全还是后端做的。

比如 zhangsan 虽然看不到删除按钮，但如果他手动请求：

```plain
DELETE /api/users/3/
```

后端仍然会判断：

```plain
zhangsan 有没有 user:delete？
```

结果没有，所以后端返回：

```plain
403
```

所以正确结构是：

```plain
前端：控制显示
后端：控制安全
```

---

## 8.15 本阶段完整流程
现在完整流程是：

```plain
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

---

## 8.16 阶段 8 完成标准
你需要确认：

```plain
1. admin 登录后可以看到用户管理菜单
2. admin 登录后可以看到新增用户按钮
3. admin 登录后可以看到删除用户按钮
4. zhangsan 登录后可以看到用户管理菜单
5. zhangsan 登录后看不到新增用户按钮
6. zhangsan 登录后看不到删除用户按钮
7. /users 页面必须登录后才能访问
8. /users 页面需要 user:list 权限
```

