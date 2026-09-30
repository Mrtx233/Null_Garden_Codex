# 阶段 8：Vue3 根据权限显示菜单和按钮

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：8 / 18 ｜ **定位**：在前端按权限动态渲染菜单与按钮，并对接用户管理接口 ｜ **建议学时**：6–8 小时

大家好，我是小马不起床。

---

## 阶段导语

阶段 7 完成了前端登录，首页仅做固定的用户与权限展示。本阶段在此基础上把权限数据接入渲染逻辑，实现"有权限才显示、无权限则隐藏"的前端体验控制，并对接用户列表接口。本阶段只涉及前端。

本阶段目标：

```text
1. 登录后根据 permissions 显示菜单
2. 根据 permissions 显示按钮
3. 没有页面权限时跳转 403 页面
4. 请求用户列表接口
5. admin 可以新增、删除用户
6. zhangsan 只能查看用户，不能新增、不能删除
```

---

## 学习目标

完成本阶段后，应能够：

- [ ] 复用 `hasPermission` 方法，对页面、按钮的可见性做权限判定
- [ ] 封装用户接口，映射 `user:list`、`user:add`、`user:delete` 三类权限
- [ ] 构建 403 页面，并在路由层通过 `meta.permission` 拦截无权限访问
- [ ] 实现用户管理页面，按权限条件渲染新增与删除按钮
- [ ] 在首页按权限动态显示菜单项
- [ ] 区分前端权限渲染与后端权限校验的职责边界

---

## 前置知识

本阶段直接依赖阶段 7（阶段 7：实现 Vue3 登录.md）：

| 前置条目 | 具体要求 |
|----------|----------|
| 登录状态管理 | `stores/auth.js` 已提供 `isLogin`、`hasPermission` 与 permissions 数据 |
| 请求封装 | `utils/request.js` 会自动携带 access_token 并处理 401 |
| 路由守卫 | `router/index.js` 已配置 `beforeEach`，本阶段在其上扩展权限判定 |
| 权限编码约定 | 后端下发 user:list、user:add、user:delete、role:list 等编码 |

---

## 目录

1. [本阶段文件清单与权限方法复用](#1-本阶段文件清单与权限方法复用)
2. [新增用户接口文件](#2-新增用户接口文件)
3. [新增 403 页面](#3-新增-403-页面)
4. [新增用户管理页面](#4-新增用户管理页面)
5. [修改路由与配置页面权限](#5-修改路由与配置页面权限)
6. [修改首页显示菜单](#6-修改首页显示菜单)
7. [启动项目与测试](#7-启动项目与测试)
8. [前端权限与安全边界](#8-前端权限与安全边界)
9. [阶段完整流程与完成标准](#9-阶段完整流程与完成标准)
10. [阶段小结](#阶段小结)
11. [常见问题与排查](#常见问题与排查)
12. [下一阶段衔接](#下一阶段衔接)

---

## 1. 本阶段文件清单与权限方法复用

### 1.1 涉及文件

本阶段修改或新增的文件：

```text
frontend/src/api/user.js              新增
frontend/src/views/UserList.vue       新增
frontend/src/views/Forbidden.vue      新增
frontend/src/router/index.js          修改
frontend/src/views/Home.vue           修改
```

### 1.2 复用权限判断方法

阶段 7 的文件：

```text
frontend/src/stores/auth.js
```

中已存在该方法：

```javascript
hasPermission: state => {
  return permissionCode => {
    return state.permissions.includes(permissionCode)
  }
}
```

其作用是判断当前用户是否拥有某个权限，调用形式：

```javascript
authStore.hasPermission("user:list")
authStore.hasPermission("user:add")
authStore.hasPermission("user:delete")
```

返回结果为：

```text
true 或 false
```

因此本阶段直接复用该方法，无需重复实现。

**要点**

- 本阶段仅改动前端，不触碰后端接口。
- 权限渲染统一依赖已存在的 `hasPermission` getter，返回布尔值。
- 新增文件集中于接口封装、页面与 403 页面，改动文件集中于路由与首页。

---

## 2. 新增用户接口文件

新建文件：

```text
frontend/src/api/user.js
```

写入：

```javascript
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

该文件对应后端接口：

```text
GET    /api/users/           查看用户列表
POST   /api/users/           新增用户
DELETE /api/users/<user_id>/ 删除用户
```

接口与权限的对应关系：

```text
GET    /api/users/           user:list
POST   /api/users/           user:add
DELETE /api/users/<user_id>/ user:delete
```

**要点**

- 每个方法对应一个后端接口，路径以 `/api` 为基础由 request 实例拼接。
- 接口方法与所需权限一一对应。
- 删除接口以 `userId` 拼入路径参数。

---

## 3. 新增 403 页面

新建文件：

```text
frontend/src/views/Forbidden.vue
```

写入：

```vue
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

该页面用于用户无权限访问某个路由时的提示。

**要点**

- 403 页面为纯展示组件，提供返回首页的链接。
- 该页面本身不设权限门槛，作为无权限访问的落地页。

---

## 4. 新增用户管理页面

### 4.1 页面代码

新建文件：

```text
frontend/src/views/UserList.vue
```

写入完整代码：

```vue
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

### 4.2 页面权限判断说明

该页面包含三处权限判断。

其一为页面权限，决定用户能否进入该页面，判定编码为 `user:list`，在路由中处理。

其二为新增按钮权限：

```vue
<button
  v-if="authStore.hasPermission('user:add')"
  @click="handleAddUser"
>
  新增用户
</button>

```

含义为：

```text
有 user:add 权限，显示新增按钮
没有 user:add 权限，不显示新增按钮
```

其三为删除按钮权限：

```vue
<button
  v-if="authStore.hasPermission('user:delete')"
  class="danger"
  @click="handleDeleteUser(user)"
>
  删除
</button>

```

含义为：

```text
有 user:delete 权限，显示删除按钮
没有 user:delete 权限，不显示删除按钮
```

**要点**

- 页面挂载时通过 `onMounted` 调用 `loadUsers` 拉取列表。
- 新增与删除按钮分别由 `user:add`、`user:delete` 权限控制可见性。
- 页面准入权限 `user:list` 在路由层判定，而非组件内部。
- 无权限时以 `v-else` 分支显示占位提示，保持布局稳定。

---

## 5. 修改路由与配置页面权限

### 5.1 路由代码

打开文件：

```text
frontend/src/router/index.js
```

替换为完整代码：

```javascript
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

### 5.2 路由权限说明

该路由配置：

```javascript
{
  path: "/users",
  component: UserList,
  meta: {
    requiresAuth: true,
    permission: "user:list"
  }
}
```

含义为：访问 `/users` 页面需同时满足两个条件：

```text
1. 已登录
2. 拥有 user:list 权限
```

若未登录：

```text
跳转 /login
```

若已登录但缺少权限：

```text
跳转 /403
```

**要点**

- 路由守卫在阶段 7 基础上新增一条 `meta.permission` 判定分支。
- `/users` 通过 meta 同时声明登录要求与权限编码。
- 未登录优先重定向 `/login`，登录后权限不足才重定向 `/403`。

---

## 6. 修改首页显示菜单

### 6.1 首页代码

打开文件：

```text
frontend/src/views/Home.vue
```

替换为完整代码：

```vue
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

### 6.2 菜单权限说明

用户管理菜单：

```vue
<router-link
  v-if="authStore.hasPermission('user:list')"
  class="menu-item"
  to="/users"
>
  用户管理
</router-link>

```

含义为：当前用户拥有 `user:list` 权限时显示用户管理菜单。

角色管理菜单：

```vue
<span
  v-if="authStore.hasPermission('role:list')"
  class="menu-item disabled"
>
  角色管理（后续阶段再做页面）
</span>

```

含义为：当前用户拥有 `role:list` 权限时显示角色管理菜单。由于角色管理页面尚未在本阶段实现，该菜单先以灰色状态呈现。

**要点**

- 菜单项以 `hasPermission` 结果决定是否渲染。
- 用户管理菜单为可跳转的 `router-link`，角色管理为占位的禁用样式。
- 当两项菜单权限均缺失时，展示无菜单权限提示。

---

## 7. 启动项目与测试

### 7.1 启动后端

进入：

```text
rbac_project/backend
```

执行：

```bash
python manage.py runserver
```

### 7.2 启动前端

新开一个终端，进入：

```text
rbac_project/frontend
```

执行：

```bash
npm run dev
```

浏览器打开：

```text
http://localhost:5173/login
```

### 7.3 测试 admin

登录：

```text
admin / 123456
```

首页应显示：

```text
用户管理
角色管理（后续阶段再做页面）
```

进入用户管理页面：

```text
http://localhost:5173/users
```

应显示：

```text
新增用户按钮
删除用户按钮
```

原因在于 admin 拥有以下权限：

```text
user:list
user:add
user:delete
role:list
```

### 7.4 测试 zhangsan

退出登录后改用另一账号登录：

```text
zhangsan / 123456
```

首页应显示：

```text
用户管理
```

但不显示：

```text
角色管理
```

进入用户管理页面后应显示：

```text
当前账号没有 user:add 权限，所以不显示新增按钮
```

每行用户后应显示：

```text
无删除权限
```

原因在于 zhangsan 仅拥有：

```text
user:list
```

而不拥有：

```text
user:add
user:delete
role:list
```

**要点**

- 前后端需同时运行，后端提供接口，前端负责渲染。
- admin 拥有全部权限，菜单与按钮全部可见。
- zhangsan 仅拥有 `user:list`，新增、删除按钮与角色管理菜单均不可见。
- 渲染差异完全由后端下发的 permissions 决定。

---

## 8. 前端权限与安全边界

前端当前的逻辑是：

```text
有权限就显示按钮
没权限就隐藏按钮
```

这属于用户体验层面的控制，真正的安全由后端保证。以 zhangsan 为例，即便看不到删除按钮，若手动发起请求：

```text
DELETE /api/users/3/
```

后端仍会判定：

```text
zhangsan 有没有 user:delete？
```

结果不具备该权限，后端返回：

```text
403
```

因此正确的职责结构为：

```text
前端：控制显示
后端：控制安全
```

**要点**

- 前端隐藏按钮仅影响可见性，不阻止请求发出。
- 后端独立校验 JWT 与 RBAC 权限，构成实际安全边界。
- 无权限的手动请求由后端返回 403，与前端渲染无关。

---

## 9. 阶段完整流程与完成标准

### 9.1 阶段完整流程

本阶段完成后的流程：

```text
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

### 9.2 阶段完成标准

需逐项确认：

```text
1. admin 登录后可以看到用户管理菜单
2. admin 登录后可以看到新增用户按钮
3. admin 登录后可以看到删除用户按钮
4. zhangsan 登录后可以看到用户管理菜单
5. zhangsan 登录后看不到新增用户按钮
6. zhangsan 登录后看不到删除用户按钮
7. /users 页面必须登录后才能访问
8. /users 页面需要 user:list 权限
```

**要点**

- 完整流程贯通登录、菜单渲染、按钮渲染到后端校验。
- 完成标准围绕两个账号的可见性差异与页面准入条件。
- 前端渲染与后端拦截共同构成本阶段的验证闭环。

---

## 阶段小结

| 环节 | 产出 | 关键文件 |
|------|------|----------|
| 接口封装 | 用户列表、新增、删除三类接口 | `frontend/src/api/user.js` |
| 403 页面 | 无权限访问的落地页 | `frontend/src/views/Forbidden.vue` |
| 用户管理页面 | 按权限渲染的新增、删除按钮与用户表格 | `frontend/src/views/UserList.vue` |
| 路由权限 | `meta.permission` 与守卫拦截 | `frontend/src/router/index.js` |
| 首页菜单 | 按权限动态显示的菜单 | `frontend/src/views/Home.vue` |
| 安全边界 | 前端控制显示、后端控制安全 | 前后端协同 |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| zhangsan 登录后仍显示新增或删除按钮 | 前端读取的 permissions 与预期不符 | 核对 localStorage 中的 permissions，zhangsan 应为 `["user:list"]`；确认阶段 7 保存的权限数据正确 |
| 已登录访问 `/users` 被跳转至 `/403` | 路由 `meta.permission` 判定的 `user:list` 权限缺失 | 确认该用户权限列表包含 `user:list`，并检查 `hasPermission` 返回值 |
| 无权限用户手动请求删除接口仍被拒绝返回 403 | 后端独立校验 JWT 与 RBAC 权限 | 属预期行为，前端隐藏仅为体验，安全由后端保障（见第 8 章） |
| 首页菜单未随权限变化 | 菜单渲染依赖的 permissions 未更新 | 确认登录动作已将最新 permissions 写入 store 与 localStorage |

---

## 下一阶段衔接

阶段 8 打通了前端侧的权限渲染：菜单、按钮、页面准入均依据 permissions 生效，用户管理接口完成对接。阶段 9（阶段 9：前后端完整联调和问题修复.md）将把前后端放在一起完整联调，逐项验证 admin 与 zhangsan 的登录、菜单、按钮、接口拦截效果，并对 CORS、404、401、403 等常见问题进行集中排查与修复。本阶段建立的前端渲染逻辑，是阶段 9 联调验证的直接对象。
