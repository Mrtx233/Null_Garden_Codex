---
title: "UCan Football Management"
description: "一个前后端分离的足球俱乐部管理系统，覆盖管理员、经理人和球员的多角色管理场景。"
githubUrl: "https://github.com/Mrtx233/UCan_Football_Management"
tags:
  - Java
  - Spring Boot
  - Vue
  - MySQL
draft: false
---

# UCan Football Management

UCan Football Management（UCFM）是一个前后端分离的足球俱乐部管理系统。项目面向平台管理员、俱乐部经理人和普通球员三类角色，提供首页公开展示、用户认证、俱乐部资料、成员管理、公告管理、训练计划、比赛信息、战术板和头像上传等功能。

## 项目结构

```text
UCan_Football_Management/
├── UCFM/                 # Spring Boot 后端服务
│   ├── src/main/java/com/ucfm
│   │   ├── config/       # CORS、JWT、权限拦截、MyBatis 配置
│   │   ├── controller/   # REST API 控制器
│   │   ├── domain/       # 实体、DTO、VO
│   │   ├── mapper/       # MyBatis Mapper 接口
│   │   ├── service/      # 业务接口与实现
│   │   └── utils/        # 统一响应、JWT、异常、上传路径等工具
│   ├── src/main/resources
│   │   ├── mapper/       # MyBatis XML 映射文件
│   │   └── application.yml
│   └── pom.xml
├── UCan_Vue/             # Vue 3 + Vite 前端应用
│   ├── src/api/          # Axios 请求封装
│   ├── src/router/       # 前端路由与角色守卫
│   ├── src/views/        # 首页、登录注册、三类角色工作台
│   ├── public/uploads/   # 上传头像访问目录
│   └── package.json
└── UCFM_SQL/             # 数据库建表和初始化数据
    ├── DDL.SQL
    └── new_data.sql
```

## 技术栈

后端：

- Java 17
- Spring Boot 3.5.12
- Spring Web
- Spring Security
- MyBatis 3.0.5
- PageHelper 1.4.7
- MySQL Connector/J
- JJWT 0.11.5
- Lombok

前端：

- Vue 3
- Vite 7
- Vue Router
- Axios
- Element Plus
- Sass Embedded

数据库：

- MySQL 8.x
- 数据库名：`ucfm_db`
- 字符集：`utf8mb4`

## 功能概览

### 公共功能

- 首页聚合数据展示
- 公开公告、比赛、俱乐部与球员展示
- 俱乐部球员展示筛选
- 用户注册、登录、刷新 Token、退出登录

### 管理员端

- 管理端数据看板
- 用户账号管理
- 用户档案管理
- 俱乐部信息管理
- 公告管理
- 用户、俱乐部、角色维度统计

### 俱乐部经理端

- 俱乐部资料查看与维护
- 俱乐部成员查看
- 球员新增、编辑、删除
- 训练计划新增、编辑、删除
- 战术板新增、编辑、删除
- 经理个人资料维护

### 球员端

- 个人账号、档案、球员信息维护
- 查看所属俱乐部公告、比赛和训练计划
- 查看俱乐部战术板只读视图

### 上传能力

- 头像上传接口：`POST /api/upload/avatar`
- 支持格式：`jpg`、`jpeg`、`png`、`gif`、`webp`
- 默认写入前端目录：`UCan_Vue/public/uploads/avatar/yyyyMMdd/`
- 后端静态访问路径：`/uploads/avatar/**` 或 `/avatar/**`

## 环境要求

请先确认本机已安装：

- JDK 17+
- Maven Wrapper 可直接使用，或安装 Maven 3.9+
- Node.js `^20.19.0` 或 `>=22.12.0`
- npm
- MySQL 8.x

## 数据库初始化

后端默认连接配置位于 `UCFM/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ucfm_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: mrtx5127
```

如果本地 MySQL 用户名或密码不同，请先修改该配置。

初始化数据库：

```bash
mysql -uroot -p < UCFM_SQL/DDL.SQL
mysql -uroot -p ucfm_db < UCFM_SQL/new_data.sql
```

注意：`DDL.SQL` 中包含 `DROP DATABASE IF EXISTS ucfm_db`，执行前请确认不会覆盖重要数据。

初始化数据中包含三类基础角色：

| 角色ID | 角色代码 | 说明 |
| --- | --- | --- |
| 1 | ADMIN | 平台管理员 |
| 2 | MANAGER | 俱乐部经理人 |
| 3 | USER | 球员 |

示例用户数据位于 `UCFM_SQL/new_data.sql`，包括 `admin`、`manager`、`user` 以及批量俱乐部经理人与球员账号。密码以 BCrypt 密文存储，若需要调整示例账号密码，可通过系统管理端修改，或重新生成 BCrypt 密文后更新 SQL。

## 后端启动

进入后端目录：

```bash
cd UCFM
./mvnw spring-boot:run
```

默认服务地址：

```text
http://localhost:8080
```

后端主要配置：

- 服务端口：`8080`
- API 前缀：`/api`
- JWT 请求头：`Authorization: Bearer <token>`
- JWT 过期时间：`86400` 秒
- MyBatis XML：`classpath:mapper/*.xml`

## 前端启动

进入前端目录：

```bash
cd UCan_Vue
npm install
npm run dev
```

Vite 默认访问地址通常为：

```text
http://localhost:5173
```

前端 Axios 默认请求后端：

```js
baseURL: 'http://localhost:8080'
```

如果后端端口或地址变化，请修改 `UCan_Vue/src/api/http.js` 中的 `baseURL`。

## 构建命令

后端编译：

```bash
cd UCFM
./mvnw -DskipTests compile
```

前端构建：

```bash
cd UCan_Vue
npm run build
```

前端预览构建产物：

```bash
cd UCan_Vue
npm run preview
```

## 路由说明

前端路由定义在 `UCan_Vue/src/router/index.js`：

| 路由 | 页面 | 访问要求 |
| --- | --- | --- |
| `/` | 首页 | 公开访问 |
| `/login` | 登录页 | 公开访问 |
| `/register` | 注册页 | 公开访问 |
| `/admin` | 管理员总控台 | 登录且角色ID为 1 |
| `/manager` | 经理人工作台 | 登录且角色ID为 2 |
| `/user` | 球员个人工作区 | 登录且角色ID为 3 |

登录成功后，前端会根据 `roleId` 自动跳转：

- `1 -> /admin`
- `2 -> /manager`
- `3 -> /user`

## API 概览

### 认证接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 用户注册，默认注册为球员角色 |
| POST | `/api/auth/login` | 用户登录，返回 JWT 与用户基础信息 |
| POST | `/api/auth/refresh` | 刷新 JWT |
| POST | `/api/auth/logout` | 退出登录并使 Token 失效 |

### 首页公开接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/index` | 首页聚合数据 |
| GET | `/api/index/player-showcase/clubs` | 球员展示俱乐部筛选列表 |
| GET | `/api/index/player-showcase/clubs/{clubId}` | 指定俱乐部球员展示详情 |

### 管理员接口

管理员接口统一前缀为 `/api/admin`，需要 `admin:select` 权限：

- `/dashboard/overview`
- `/users`
- `/users/{userId}`
- `/user-profiles`
- `/user-profiles/{profileId}`
- `/clubs`
- `/clubs/{clubId}`
- `/user-clubs/stats/roles`
- `/user-clubs/stats/clubs`
- `/user-clubs/stats/clubs/{clubId}`
- `/notices`
- `/notices/{noticeId}`

### 经理人接口

经理人接口统一前缀为 `/api/manager`，需要 `manager:select` 权限：

- `/club-users`
- `/club-info`
- `/tactical-boards`
- `/tactical-boards/{boardId}`
- `/training-plans`
- `/training-plans/{trainingId}`
- `/club-overview`
- `/players`
- `/players/{userId}`
- `/self/sys-user`
- `/self/sys-user-profile`

### 球员接口

球员接口统一前缀为 `/api/user`，需要 `member:select` 权限：

- `/club-content`
- `/tactical-board-view`
- `/self/sys-user`
- `/self/sys-user-profile`
- `/self/sys-player-info`

### 用户资料与上传接口

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | `/api/user-profile/detail` | 管理员、经理人、球员 |
| POST | `/api/upload/avatar` | 管理员、经理人、球员 |

## 权限与认证机制

后端使用 JWT + 自定义权限注解完成接口保护：

- `JwtInterceptor` 校验 `/api/**` 请求中的 `Authorization` 请求头。
- `/api/auth/login`、`/api/auth/register`、`/api/index/**` 不需要登录。
- `PermissionInterceptor` 读取控制器或方法上的 `@RequiresPermissions` 注解。
- 权限码来自 `sys_permission`，通过 `sys_role_permission` 与角色关联。

接口统一响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1770000000000
}
```

常见状态码：

- `200`：成功
- `400`：参数错误
- `401`：未授权或 Token 无效
- `403`：权限不足
- `404`：资源不存在
- `500`：业务或服务器错误

## 数据表说明

核心数据表定义在 `UCFM_SQL/DDL.SQL`：

| 表名 | 说明 |
| --- | --- |
| `sys_role` | 系统角色 |
| `sys_permission` | 权限定义 |
| `sys_role_permission` | 角色权限关联 |
| `sys_user` | 用户基础账号 |
| `sys_user_profile` | 用户扩展档案 |
| `sys_player_info` | 球员信息 |
| `t_club_info` | 俱乐部信息 |
| `y_user_club` | 用户与俱乐部关联 |
| `t_notice` | 公告 |
| `t_match_info` | 比赛信息 |
| `t_match_player_stat` | 比赛球员数据 |
| `t_training_plan` | 训练计划 |
| `t_training_record` | 训练记录 |
| `t_tactical_board` | 俱乐部战术板 |

## 开发注意事项

- `application.yml` 中包含本地数据库密码和 JWT 密钥，生产环境请改为环境变量或外部配置。
- 前端请求地址目前写死为 `http://localhost:8080`，部署时需要改为实际后端地址或使用 Vite 环境变量统一管理。
- 后端 CORS 已允许 `http://localhost:5173`，同时 Spring Security 中也配置了跨域放行。
- 头像上传目录与前端 `public/uploads/avatar` 绑定，后端和前端目录结构变化时需要同步检查 `UploadPathResolver`。
- `DDL.SQL` 会删除并重建数据库，适合本地初始化，不适合直接在生产库执行。
- 注册用户默认角色为球员：`role_id = 3`。

## 常见问题

### 前端登录后接口返回 401

检查后端是否启动在 `http://localhost:8080`，并确认浏览器请求头中包含：

```text
Authorization: Bearer <token>
```

### 前端无法访问后端

检查：

- 后端是否启动成功
- `UCan_Vue/src/api/http.js` 中的 `baseURL` 是否正确
- 浏览器控制台是否有 CORS 报错
- 后端 `CorsConfig` 是否包含当前前端地址

### 数据库连接失败

检查：

- MySQL 是否启动
- `ucfm_db` 是否已创建
- `application.yml` 中的用户名、密码、端口是否正确
- 是否已执行 `UCFM_SQL/DDL.SQL` 和 `UCFM_SQL/new_data.sql`

### 头像上传后不显示

检查：

- 上传接口是否返回 `avatarUrl`
- 文件是否写入 `UCan_Vue/public/uploads/avatar/`
- 后端静态资源路径 `/uploads/avatar/**` 是否可访问
- 前端拼接图片地址时是否使用了后端基础地址


## GitHub 链接

https://github.com/Mrtx233/UCan_Football_Management
