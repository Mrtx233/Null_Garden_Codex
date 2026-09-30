# 阶段 7：实现 Vue3 登录

> **合辑**：Django 系统阶段开发手册 ｜ **阶段**：7 / 18 ｜ **定位**：搭建 Vue3 前端并打通与 Django 后端的跨域登录链路 ｜ **建议学时**：8–10 小时

大家好，我是小马不起床。

---

## 阶段导语

前六个阶段完成了后端侧的能力：数据表建模、权限数据初始化、RBAC 权限判断、JWT 登录与接口权限拦截。本阶段进入前端侧，目标是建立单页应用（SPA）形态的 Vue3 工程，并让它与 Django 后端完成一次可用的登录交互。

本阶段的核心链路为：

```text
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

由于后端与前端运行在不同端口，链路建立前需先处理后端的跨域问题，随后创建前端工程、编写登录相关代码，最终以 admin 与 zhangsan 两个账号验证登录结果。

---

## 学习目标

完成本阶段后，应能够：

- [ ] 使用 django-cors-headers 配置后端，放行 Vue3 前端的跨域请求
- [ ] 使用 Vite 创建 Vue3 项目，并安装 axios、vue-router、pinia 三个依赖
- [ ] 封装 axios 请求实例，实现 token 自动携带与 401 状态跳转
- [ ] 使用 Pinia 管理登录状态，将 token、用户信息与权限列表持久化至 localStorage
- [ ] 配置 Vue Router 路由守卫，未登录时拦截受保护路由
- [ ] 完成登录页与首页，在首页展示当前用户信息与权限列表

---

## 前置知识

本阶段直接依赖阶段 6（阶段 6：实现接口权限拦截.md），并以阶段 5 建成的登录接口为基础：

| 前置条目 | 具体要求 |
|----------|----------|
| 后端登录接口 | `/api/login/` 接收 username、password，返回 access_token、refresh_token、user、permissions |
| 接口权限拦截 | 后端已按 permission_code 对业务接口进行校验 |
| 权限编码约定 | 熟悉 user:list、user:add、user:delete、role:list 等编码的含义 |

若后端登录接口尚不可用，建议先完成阶段 5 与阶段 6。

---

## 目录

1. [后端跨域配置](#1-后端跨域配置)
2. [创建 Vue3 前端项目](#2-创建-vue3-前端项目)
3. [前端目录结构](#3-前端目录结构)
4. [编写前端代码](#4-编写前端代码)
5. [启动前端](#5-启动前端)
6. [测试登录](#6-测试登录)
7. [阶段完整流程与完成标准](#7-阶段完整流程与完成标准)
8. [阶段小结](#阶段小结)
9. [常见问题与排查](#常见问题与排查)
10. [下一阶段衔接](#下一阶段衔接)

---

## 1. 后端跨域配置

跨域资源共享（CORS）问题源于前后端端口不一致：后端运行在 `http://127.0.0.1:8000`，Vue3 前端运行在 `http://localhost:5173`，端口不同会导致浏览器拦截前端发出的跨域请求。需先让 Django 接受 Vue3 的访问。

### 1.1 第 1 步：安装跨域包

```bash
pip install django-cors-headers
```

### 1.2 第 2 步：修改后端配置

打开文件：

```text
backend/config/settings.py
```

找到 `INSTALLED_APPS`：

```python
INSTALLED_APPS = [
```

加入 corsheaders：

```python
"corsheaders",
```

配置结果示例：

```python
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

找到 `MIDDLEWARE`：

```python
MIDDLEWARE = [
```

将 corsheaders 中间件置于列表最上方：

```python
"corsheaders.middleware.CorsMiddleware",
```

配置结果示例：

```python
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

在 `settings.py` 文件末尾加入允许的来源：

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### 1.3 第 3 步：重启后端

若后端正在运行，先停止：

```text
Ctrl + C
```

重新启动：

```bash
python manage.py runserver
```

**要点**

- 前后端端口不同，浏览器会按同源策略拦截跨域请求，需后端显式放行。
- `CorsMiddleware` 必须位于中间件列表最上方，否则跨域头部无法正确注入。
- `CORS_ALLOWED_ORIGINS` 同时登记 localhost 与 127.0.0.1 两种来源，覆盖不同访问方式。
- 配置生效前需重启后端。

---

## 2. 创建 Vue3 前端项目

回到项目根目录：

```bash
cd ..
```

若当前位于 `rbac_project/backend`：

```text
rbac_project/backend
```

执行上一步的 `cd ..` 后应位于：

```text
rbac_project
```

创建前端项目：

```bash
npm create vite@latest frontend -- --template vue
```

进入前端目录：

```bash
cd frontend
```

安装依赖：

```bash
npm install
```

安装登录所需的包：

```bash
npm install axios vue-router pinia
```

**要点**

- 前端工程与后端 `backend` 目录同级，位于项目根目录下。
- 使用 Vite 的 vue 模板初始化工程。
- axios 负责请求，vue-router 负责路由，pinia 负责状态管理，三者为本阶段的依赖底座。

---

## 3. 前端目录结构

本阶段涉及的源码文件组织如下：

```text
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

若缺少对应目录，Windows 下创建：

```bash
mkdir src\api src\router src\stores src\utils src\views
```

macOS / Linux 下创建：

```bash
mkdir -p src/api src/router src/stores src/utils src/views
```

**要点**

- `api` 存放接口封装，`utils` 存放请求实例，`stores` 存放状态管理，`router` 存放路由，`views` 存放页面。
- 目录名与职责一一对应，后续阶段沿用同一结构扩展。
- 两种平台的目录创建命令不同，按操作系统选用。

---

## 4. 编写前端代码

### 4.1 `frontend/src/main.js`

```javascript
import { createApp } from "vue"
import { createPinia } from "pinia"

import App from "./App.vue"
import router from "./router"

createApp(App)
  .use(createPinia())
  .use(router)
  .mount("#app")
```

该文件为工程入口，作用为：

```text
启动 Vue 项目
加载 Pinia 状态管理
加载 Vue Router 路由
```

### 4.2 `frontend/src/App.vue`

```vue
<template>
  <router-view />
</template>

```

该文件仅承载根容器，含义为：

```text
当前路由是什么，就显示什么页面
```

例如：

```text
/login 显示登录页
/      显示首页
```

### 4.3 `frontend/src/utils/request.js`

```javascript
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

该文件封装 axios。对后端接口的请求统一经由 `request` 发出，而非直接使用 axios。请求拦截器会执行一项处理：

```text
如果 localStorage 里面有 access_token，
就自动放到请求头 Authorization 里面。
```

最终生成的请求头为：

```text
Authorization: Bearer access_token
```

响应拦截器在收到 401 状态时清除本地登录数据并跳转登录页。

### 4.4 `frontend/src/api/auth.js`

```javascript
import request from "../utils/request"

export function loginApi(data) {
  return request.post("/login/", data)
}

export function getMeApi() {
  return request.get("/me/")
}
```

该文件集中存放登录相关接口，当前包含两个：

```text
loginApi    登录
getMeApi    获取当前用户信息
```

本阶段主要使用 `loginApi`。

### 4.5 `frontend/src/stores/auth.js`

```javascript
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

该文件为登录状态管理，负责：

```text
保存 token
保存用户信息
保存权限列表
判断用户是否登录
退出登录
```

登录成功后数据写入 localStorage：

```text
localStorage
```

由此刷新页面后登录状态仍然保留。

### 4.6 `frontend/src/router/index.js`

```javascript
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

该文件负责页面跳转，当前包含两个页面：

```text
/login 登录页
/      首页
```

路由守卫的规则为：

```text
如果没登录，不能进首页，自动跳到 /login
如果已经登录，再访问 /login，会自动跳到首页
```

### 4.7 `frontend/src/views/Login.vue`

```vue
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

该页面完成以下事项：

```text
1. 输入用户名
2. 输入密码
3. 点击登录
4. 请求 /api/login/
5. 登录成功后跳转首页
6. 登录失败显示错误信息
```

### 4.8 `frontend/src/views/Home.vue`

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

首页当前完成三项展示：

```text
显示当前用户
显示当前角色
显示当前权限
```

**要点**

- `main.js` 挂载 Pinia 与 Router，是整个前端的启动入口。
- `request.js` 是唯一的请求出口，统一注入 Authorization 头并集中处理 401。
- `stores/auth.js` 在登录成功后把 token、user、permissions 同步写入 Pinia 与 localStorage。
- 路由守卫以 `isLogin` 为依据控制首页与登录页的互斥访问。
- `Login.vue` 调用 store 的 `login` 动作，`Home.vue` 读取 store 展示用户与权限。

---

## 5. 启动前端

确认当前位于：

```text
rbac_project/frontend
```

执行：

```bash
npm run dev
```

启动成功后输出：

```text
Local: http://localhost:5173/
```

在浏览器访问：

```text
http://localhost:5173/login
```

**要点**

- 前端默认监听 5173 端口，与后端配置的 `CORS_ALLOWED_ORIGINS` 保持一致。
- 访问 `/login` 进入登录页，未登录访问 `/` 会被守卫重定向。

---

## 6. 测试登录

确认后端处于运行状态：

```text
http://127.0.0.1:8000
```

在前端使用以下账号登录：

```text
admin / 123456
```

登录成功后跳转首页，应显示：

```text
用户名：admin
真实姓名：管理员
当前角色：管理员
当前权限：
- user:list
- user:add
- user:delete
- role:list
```

退出后改用另一账号登录：

```text
zhangsan / 123456
```

应显示：

```text
用户名：zhangsan
真实姓名：张三
当前角色：普通用户
当前权限：
- user:list
```

**要点**

- 测试前需保证后端已启动，否则前端请求无法到达 `/api/login/`。
- admin 与 zhangsan 的权限列表差异，直接对应后端下发的 permissions。
- 首页展示的权限来源于 store 中的 permissions 数组。

---

## 7. 阶段完整流程与完成标准

### 7.1 阶段完整流程

本阶段实现后的登录链路为：

```text
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

### 7.2 阶段完成标准

需逐项确认：

```text
1. Vue3 项目能启动
2. 可以打开 http://localhost:5173/login
3. admin / 123456 可以登录成功
4. zhangsan / 123456 可以登录成功
5. 登录成功后跳转首页
6. 首页能显示用户信息和权限列表
7. localStorage 里有 access_token 和 refresh_token
```

**要点**

- 完整链路串联了前端请求、后端校验、状态存储与页面展示四个环节。
- 完成标准以两个账号的可观测结果为准。
- localStorage 中 token 的存在是刷新页面后保持登录的前提。

---

## 阶段小结

| 环节 | 产出 | 关键文件 |
|------|------|----------|
| 后端跨域配置 | Django 放行 5173 前端的跨域请求 | `backend/config/settings.py` |
| 前端工程创建 | 可运行的 Vue3 项目 | `frontend/` |
| 请求封装 | 统一注入 token、处理 401 | `frontend/src/utils/request.js` |
| 状态管理 | token、用户、权限持久化 | `frontend/src/stores/auth.js` |
| 路由与守卫 | 受保护路由拦截 | `frontend/src/router/index.js` |
| 页面实现 | 登录页与首页展示 | `frontend/src/views/Login.vue`、`Home.vue` |

---

## 常见问题与排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 前端请求被浏览器拦截，无法访问后端接口 | 后端 8000 与前端 5173 端口不同，跨域未放行 | 按第 1 章安装并配置 django-cors-headers，`CorsMiddleware` 置于最上方，配置 `CORS_ALLOWED_ORIGINS` 后重启后端 |
| 访问 `/` 被重定向回 `/login` | 路由守卫判定未登录（`isLogin` 为假） | 使用 admin 或 zhangsan 账号登录，确认 localStorage 中存在 access_token |
| 刷新页面后登录状态丢失 | token 未写入 localStorage | 检查 `stores/auth.js` 的 login 动作是否执行 `localStorage.setItem` |
| 登录成功但首页权限列表为空 | permissions 未保存或后端未返回 | 检查 login 动作对 permissions 的存储，以及后端登录接口返回体中的 permissions 字段 |

---

## 下一阶段衔接

阶段 7 打通了前端登录，首页已能展示当前用户与权限列表，但页面内容仍是固定的。阶段 8（阶段 8：Vue3 根据权限显示菜单和按钮.md）在此基础上引入前端侧的权限渲染：根据 permissions 动态显示菜单与按钮，无权限时跳转 403 页面，并对接用户列表接口。本阶段保存的 `hasPermission` getter 与 localStorage 中的 permissions，正是阶段 8 权限渲染的数据来源。
