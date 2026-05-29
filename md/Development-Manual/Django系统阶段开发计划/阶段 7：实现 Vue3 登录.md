本阶段目标：

```plain
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

---

## 7.1 先处理后端跨域
因为你的后端是：

```plain
http://127.0.0.1:8000
```

Vue3 前端是：

```plain
http://localhost:5173
```

端口不一样，所以浏览器会拦截跨域请求。

所以我们先让 Django 允许 Vue3 访问。

---

### 7.1.1 第 1 步：安装跨域包
安装：

```plain
pip install django-cors-headers
```

---

### 7.1.2 第 2 步：修改后端配置
打开文件：

```plain
backend/config/settings.py
```

找到：

```plain
INSTALLED_APPS = [
```

加入：

```plain
"corsheaders",
```

例如：

```plain
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

---

找到：

```plain
MIDDLEWARE = [
```

把：

```plain
"corsheaders.middleware.CorsMiddleware",
```

放到最上面。

例如：

```plain
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

---

在 `settings.py` 文件最后加入：

```plain
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

---

### 7.1.3 第 3 步：重启后端
如果后端正在运行，先停掉：

```plain
Ctrl + C
```

重新启动：

```plain
python manage.py runserver
```

---

## 7.2 创建 Vue3 项目
现在回到项目根目录：

```plain
cd ..
```

如果你现在在：

```plain
rbac_project/backend
```

执行：

```plain
cd ..
```

现在应该在：

```plain
rbac_project
```

创建前端项目：

```plain
npm create vite@latest frontend -- --template vue
```

进入前端目录：

```plain
cd frontend
```

安装依赖：

```plain
npm install
```

安装登录需要的包：

```plain
npm install axios vue-router pinia
```

---

## 7.3 前端目录结构
本阶段我们要写这些文件：

```plain
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

```plain
mkdir src\api src\router src\stores src\utils src\views
```

macOS / Linux：

```plain
mkdir -p src/api src/router src/stores src/utils src/views
```

---

## 7.4 编写前端代码
### 7.4.1 `frontend/src/main.js`
```plain
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

```plain
启动 Vue 项目
加载 Pinia 状态管理
加载 Vue Router 路由
```

---

### 7.4.2 `frontend/src/App.vue`
```plain
<template>
  <router-view />
</template>

```

这个文件很简单。

意思是：

```plain
当前路由是什么，就显示什么页面
```

比如：

```plain
/login 显示登录页
/      显示首页
```

---

### 7.4.3 `frontend/src/utils/request.js`
```plain
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

```plain
如果 localStorage 里面有 access_token，
就自动放到请求头 Authorization 里面。
```

请求头最终是：

```plain
Authorization: Bearer access_token
```

---

### 7.4.4 `frontend/src/api/auth.js`
```plain
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

```plain
loginApi    登录
getMeApi    获取当前用户信息
```

本阶段主要用 `loginApi`。

---

### 7.4.5 `frontend/src/stores/auth.js`
```plain
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

```plain
保存 token
保存用户信息
保存权限列表
判断用户是否登录
退出登录
```

登录成功后，会把数据保存到：

```plain
localStorage
```

这样刷新页面后，登录状态还在。

---

### 7.4.6 `frontend/src/router/index.js`
```plain
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

```plain
/login 登录页
/      首页
```

路由守卫的意思是：

```plain
如果没登录，不能进首页，自动跳到 /login
如果已经登录，再访问 /login，会自动跳到首页
```

---

### 7.4.7 `frontend/src/views/Login.vue`
```plain
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

```plain
1. 输入用户名
2. 输入密码
3. 点击登录
4. 请求 /api/login/
5. 登录成功后跳转首页
6. 登录失败显示错误信息
```

---

### 7.4.8 `frontend/src/views/Home.vue`
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

```plain
显示当前用户
显示当前角色
显示当前权限
```

---

## 7.5 启动前端
确认你在：

```plain
rbac_project/frontend
```

执行：

```plain
npm run dev
```

成功后会看到：

```plain
Local: http://localhost:5173/
```

打开浏览器访问：

```plain
http://localhost:5173/login
```

---

## 7.6 测试登录
确保后端也在运行：

```plain
http://127.0.0.1:8000
```

然后前端登录：

```plain
admin / 123456
```

成功后跳转首页。

你应该看到：

```plain
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

```plain
zhangsan / 123456
```

你应该看到：

```plain
用户名：zhangsan
真实姓名：张三
当前角色：普通用户
当前权限：
- user:list
```

---

## 7.7 当前阶段完整流程
现在已经实现：

```plain
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

---

## 7.8 阶段 7 完成标准
你只需要确认：

```plain
1. Vue3 项目能启动
2. 可以打开 http://localhost:5173/login
3. admin / 123456 可以登录成功
4. zhangsan / 123456 可以登录成功
5. 登录成功后跳转首页
6. 首页能显示用户信息和权限列表
7. localStorage 里有 access_token 和 refresh_token
```

