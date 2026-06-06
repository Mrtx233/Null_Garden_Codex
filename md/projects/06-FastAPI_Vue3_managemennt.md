---
title: "FastAPI + Vue3 健身管理系统"
description: "一个基于 FastAPI 和 Vue3 的全栈健身管理系统 Demo，采用模块化架构覆盖 16 张业务表。实现了 JWT 认证登录、RBAC 细粒度权限控制、AES-256-CBC 响应体整体加密传输与前端自动解密，系统管理和内容管理模块支持完整的增删改查操作。"
githubUrl: "https://github.com/Mrtx233/FastAPI-Vue3-Iteration"
tags:
  - FastAPI + Uvicorn
  - JWT（HS256）+ bcrypt 密码哈希
  - Vue 3 + Vite
  - Axios
draft: false
---

# FastAPI + Vue3 健身管理系统

一个基于 FastAPI 和 Vue3 的全栈健身管理系统 Demo，采用模块化架构覆盖 16 张业务表。实现了 JWT 认证登录、RBAC 细粒度权限控制、AES-256-CBC 响应体整体加密传输与前端自动解密，系统管理和内容管理模块支持完整的增删改查操作。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.0（异步模式 + aiomysql） |
| 数据库 | MySQL |
| 认证方案 | JWT（HS256）+ bcrypt 密码哈希 |
| 权限模型 | RBAC（角色-权限关联表，按接口粒度校验） |
| 响应加密 | AES-256-CBC + PKCS7 填充 + 随机 IV |
| 前端框架 | Vue 3 + Vite |
| UI 组件库 | Element Plus |
| HTTP 客户端 | Axios |
| 前端加密库 | crypto-js |

## 项目结构

```
FastAPI+Vue3 Demo/
├── start.bat                          # 一键启动脚本（同时启动前后端）
├── FastAPI_Vue3.sql                   # 16 张表的完整 DDL
├── README.md
├── .gitignore
│
├── backend/                           # 后端项目
│   ├── main.py                        # FastAPI 应用入口
│   ├── init_data.py                   # 标准测试数据初始化脚本
│   ├── requirements.txt               # Python 依赖清单
│   ├── .env                           # 环境变量配置（可选）
│   └── app/
│       ├── __init__.py
│       ├── core/                      # 核心基础设施
│       │   ├── __init__.py
│       │   ├── config.py              # 配置管理（数据库、AES、JWT）
│       │   ├── crypto.py              # AES-CBC 加解密工具
│       │   ├── auth.py                # JWT + bcrypt + RBAC 鉴权模块
│       │   ├── database.py            # 异步数据库引擎与会话工厂
│       │   └── middleware.py          # 响应体 AES 加密中间件
│       └── modules/                   # 业务模块
│           ├── __init__.py            # 共享 Base 类
│           ├── system/                # 系统管理（5 张表，完整 CRUD）
│           │   ├── models.py
│           │   └── router.py
│           ├── store/                 # 门店管理（3 张表）
│           │   ├── models.py
│           │   └── router.py
│           ├── course/                # 课程管理（3 张表）
│           │   ├── models.py
│           │   └── router.py
│           ├── action/                # 动作库（3 张表）
│           │   ├── models.py
│           │   └── router.py
│           ├── activity/              # 赛事活动（1 张表，完整 CRUD）
│           │   ├── models.py
│           │   └── router.py
│           └── slogan/                # 标语管理（1 张表，完整 CRUD）
│               ├── models.py
│               └── router.py
│
└── frontend/                          # 前端项目
    ├── index.html                     # HTML 入口
    ├── vite.config.js                 # Vite 构建配置
    ├── package.json                   # Node.js 依赖清单
    └── src/
        ├── main.js                    # Vue 应用入口
        ├── App.vue                    # 根组件（用户信息 + 登出 + router-view）
        ├── style.css                  # 全局样式
        ├── api/
        │   └── index.js               # Axios 实例 + Token 管理 + CRUD API 封装
        ├── router/
        │   └── index.js               # Vue Router（登录页 + 主页 + 导航守卫）
        ├── utils/
        │   └── crypto.js              # AES-CBC 解密（与后端对应）
        ├── components/
        │   └── DataExplorer.vue       # 通用数据表格 + CRUD 操作 + ID 搜索组件
        └── views/
            ├── Login.vue              # 登录页面
            └── DataOverview.vue       # 数据浏览主页面（侧边栏 + CRUD 配置）
```

## 核心功能

### JWT 认证登录

用户通过 `POST /api/system/login` 提交用户名和密码，后端使用 bcrypt 校验密码后签发 JWT Token（HS256，有效期 2 小时）。Token 载荷包含 `user_id`、`role_id`、`username`。前端将 Token 存储在 `sessionStorage`，Axios 请求拦截器自动为每个请求附加 `Authorization: Bearer <token>` 头。响应拦截器捕获 401 自动清除 Token 并跳转登录页。

### RBAC 细粒度权限控制

权限模型基于三张关联表：`sys_permission`（权限定义）、`sys_role`（角色）、`sys_role_permission`（角色-权限关联）。每个 API 端点通过 `require_permission('权限编码')` 依赖工厂进行权限校验，动态查询当前角色拥有的权限列表，无权限返回 403。

**角色权限矩阵：**

| 角色 | 系统管理 | 门店 | 课程 | 动作 | 活动 | 标语 |
|------|----------|------|------|------|------|------|
| 超级管理员 | 全部 CRUD | 查看 | 查看 | 查看 | 全部 CRUD | 全部 CRUD |
| 运营管理员 | 全部 CRUD（不可删用户） | 查看 | 查看 | 查看 | 全部 CRUD | 全部 CRUD |
| 教练 | 查看用户/档案 | 查看 | 查看+管理 | 查看+管理 | 查看 | 查看 |
| 会员 | 查看自己 | 查看 | 查看 | 查看 | 查看 | 查看 |

系统管理模块的特殊设计：会员拥有 `user:view_own` 权限，可以通过 `GET /users/{id}` 和 `GET /user-profiles/by-user/{user_id}` 端点查看自己的信息，后端会校验请求者只能访问自己的记录。

### AES-256-CBC 响应体加密

`EncryptResponseMiddleware` 中间件拦截所有 JSON 响应，将整个响应体 AES 加密后返回 `{"data": "<密文>"}` 格式。登录接口（`/api/system/login`）和 Swagger 文档路径不受影响。前端 Axios 响应拦截器自动解密还原为原始 JSON。

### 前端 CRUD 操作

`DataExplorer.vue` 是通用数据表格组件，支持：按列定义渲染表格、通过 `getByIdFn` 实现按 ID 搜索、通过 `createFn/updateFn/deleteFn` 显示新增/编辑/删除操作列和表单弹窗。表单支持 text、number、select、date、datetime、textarea、password 等多种字段类型。

## 各模块 API 接口

所有响应体均被中间件加密为 `{"data": "<AES密文>"}` 格式（登录接口除外）。

### 系统管理 — `/api/system`

**认证（无需鉴权）**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/login` | 用户登录，返回 JWT Token（不加密） |
| GET | `/me` | 获取当前登录用户信息 |

**用户（CRUD）**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/users` | `user:list` | 查询全部用户 |
| GET | `/users/{user_id}` | `user:list` 或 `user:view_own` | 按 ID 查询用户（会员仅自己） |
| POST | `/users` | `user:create` | 创建用户（密码 bcrypt 哈希） |
| PUT | `/users/{user_id}` | `user:edit` | 编辑用户（密码留空不修改） |
| DELETE | `/users/{user_id}` | `user:delete` | 删除用户（级联删除档案） |

**用户档案（CRUD）**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/user-profiles` | `user:list` | 查询全部档案 |
| GET | `/user-profiles/by-user/{user_id}` | `user:list` 或 `user:view_own` | 按用户 ID 查档案（会员仅自己） |
| GET | `/user-profiles/{profile_id}` | `user:list` | 按档案 ID 查询 |
| POST | `/user-profiles` | `user:create` | 创建档案 |
| PUT | `/user-profiles/{profile_id}` | `user:edit` | 编辑档案 |
| DELETE | `/user-profiles/{profile_id}` | `user:delete` | 删除档案 |

**权限定义（CRUD）**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/permissions` | `permission:list` | 查询全部权限 |
| GET | `/permissions/{id}` | `permission:list` | 按 ID 查询 |
| POST | `/permissions` | `permission:create` | 创建权限 |
| PUT | `/permissions/{id}` | `permission:edit` | 编辑权限 |
| DELETE | `/permissions/{id}` | `permission:delete` | 删除权限 |

**角色（CRUD）**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/roles` | `role:list` | 查询全部角色 |
| GET | `/roles/{id}` | `role:list` | 按 ID 查询 |
| POST | `/roles` | `role:create` | 创建角色 |
| PUT | `/roles/{id}` | `role:edit` | 编辑角色 |
| DELETE | `/roles/{id}` | `role:delete` | 删除角色（级联删除关联） |

**角色权限关联**

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/role-permissions` | `role_permission:list` | 查询全部关联 |
| POST | `/role-permissions` | `role_permission:create` | 分配权限（重复检测） |
| DELETE | `/role-permissions/{id}` | `role_permission:delete` | 取消权限 |

### 门店管理 — `/api/stores`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/provinces` | `store:list` | 查询全部省份 |
| GET | `/` | `store:list` | 查询全部用户 |
| GET | `/user-stores` | `store:list` | 查询全部用户-门店关联 |

### 课程管理 — `/api/courses`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/categories` | `course:list` | 查询全部课程分类 |
| GET | `/` | `course:list` | 查询全部课程 |
| GET | `/favorites` | `course:list` | 查询全部课程收藏 |

### 动作库 — `/api/actions`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/categories` | `action:list` | 查询全部动作分类 |
| GET | `/` | `action:list` | 查询全部动作 |
| GET | `/favorites` | `action:list` | 查询全部动作收藏 |

### 内容管理 — 标语 `/api/slogans`、活动 `/api/activities`

两个模块均为：所有角色可查看（`slogan:list` / `activity:list`），仅超管和运营可增删改（`slogan:manage` / `activity:manage`）。

| 方法 | 路径模式 | 查看权限 | 管理权限 | 说明 |
|------|----------|----------|----------|------|
| GET | `/` | `*:list` | — | 查询列表 |
| GET | `/{id}` | `*:list` | — | 按 ID 查询 |
| POST | `/` | — | `*:manage` | 创建 |
| PUT | `/{id}` | — | `*:manage` | 编辑 |
| DELETE | `/{id}` | — | `*:manage` | 删除 |

## 权限编码全表

共 26 个权限编码：

| ID | 编码 | 说明 |
|----|------|------|
| 1 | `user:list` | 查看用户列表 |
| 2 | `user:create` | 创建用户 |
| 3 | `user:edit` | 编辑用户 |
| 4 | `user:delete` | 删除用户 |
| 5 | `role:list` | 查看角色列表 |
| 6 | `role:create` | 创建角色 |
| 7 | `role:edit` | 编辑角色 |
| 8 | `role:delete` | 删除角色 |
| 9 | `permission:list` | 查看权限列表 |
| 10 | `permission:create` | 创建权限 |
| 11 | `permission:edit` | 编辑权限 |
| 12 | `permission:delete` | 删除权限 |
| 13 | `role_permission:list` | 查看角色权限关联 |
| 14 | `role_permission:create` | 分配角色权限 |
| 15 | `role_permission:delete` | 取消角色权限 |
| 16 | `user:view_own` | 查看自身信息 |
| 17 | `store:list` | 查看门店 |
| 18 | `store:manage` | 管理门店 |
| 19 | `course:list` | 查看课程 |
| 20 | `course:manage` | 管理课程 |
| 21 | `action:list` | 查看动作 |
| 22 | `action:manage` | 管理动作 |
| 23 | `activity:list` | 查看活动 |
| 24 | `activity:manage` | 管理活动 |
| 25 | `slogan:list` | 查看标语 |
| 26 | `slogan:manage` | 管理标语 |

## 快速启动

### 环境要求

- Python 3.12+
- Node.js 18+
- MySQL 5.7+（数据库名 `FastAPI_Vue3`）

### 一键启动

双击根目录的 `start.bat`，会自动启动前后端。

### 手动启动

```bash
# 后端
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001

# 前端
cd frontend
npm install
npm run dev
```

### 初始化测试数据

```bash
cd backend
python init_data.py
```

### 访问

- 前端页面：http://localhost:5173
- 后端 API 文档：http://localhost:8001/docs

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 超级管理员 |
| `operator` | `oper123` | 运营管理员 |
| `coach_w` | `coach123` | 教练 |
| `member_w` | `member123` | 会员 |

## 测试数据概览

| 表 | 数据量 | 说明 |
|----|--------|------|
| sys_permission | 26 | 覆盖用户、角色、权限、门店、课程、动作、活动、标语的细粒度 CRUD 权限 |
| sys_role | 4 | 超级管理员、运营管理员、教练、会员 |
| sys_role_permission | 62 | 超级管理员 26 项，运营管理员 25 项，教练 7 项，会员 5 项 |
| sys_user | 8 | 每种角色各 1-4 个用户，密码 bcrypt 哈希存储 |
| sys_user_profile | 8 | 包含等级、身高体重、入职/到期时间等完整档案 |
| t_store_province | 4 | 北京、上海、广东、四川 |
| t_store | 5 | IronForge 铁馆 3 家 + FitLife 私教馆 2 家 |
| y_user_store | 8 | 每个用户关联一家门店 |
| t_course_category | 4 | 力量训练、有氧训练、柔韧训练、功能性训练 |
| t_course | 8 | 每个分类 2 门课程 |
| y_user_course_favorite | 6 | 4 个会员各有 1-2 门收藏 |
| t_action_category | 4 | 胸部、背部、腿部、肩部 |
| t_action | 12 | 每个分类 3 个动作，含步骤和注意事项 |
| y_user_action_favorite | 6 | 4 个会员各有 1-2 个收藏 |
| t_slogan_info | 3 | 健身励志标语 |
| t_activity_event | 3 | 力量赛、燃脂挑战、瑜伽工作坊 |
