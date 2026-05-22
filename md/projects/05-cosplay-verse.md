---
title: "CosVerse"
description: "一个面向 Cosplay 场景的前后端分离服务平台，覆盖活动资讯、服务市场、预约申请和后台维护。"
githubUrl: "https://github.com/Mrtx233/Cosplay_Verse"
tags:
  - Java
  - Spring Boot
  - Vue
  - MySQL
draft: false
---
# CosVerse

CosVerse 是一个面向 Cosplay 场景的前后端分离服务平台，覆盖活动资讯、漫展宣传、服务市场、作品集展示、预约申请、服务者档期管理、论坛浏览和后台数据维护等功能。项目由 Spring Boot 后端、Vue 3 前端和 MySQL 初始化脚本组成，适合课程设计、毕业设计或 Java SSM/Spring Boot 综合实践项目使用。

## 项目结构

```text
Cosplay_Verse/
├── CosVerse/                 # Spring Boot 后端项目
│   ├── src/main/java/com/cosverse
│   │   ├── config/           # 跨域、安全、JWT、MyBatis、拦截器配置
│   │   ├── controller/       # REST API 控制器
│   │   ├── domain/           # 实体类、DTO、VO
│   │   ├── mapper/           # MyBatis Mapper 接口
│   │   ├── service/          # 业务接口
│   │   ├── service/impl/     # 业务实现
│   │   └── utils/            # 统一响应、JWT、密码、上传、异常等工具类
│   ├── src/main/resources
│   │   ├── application.yml   # 后端运行配置
│   │   └── mapper/           # MyBatis XML 映射文件
│   └── pom.xml
├── CosVerse_Vue/             # Vue 3 + Vite 前端项目
│   ├── src
│   │   ├── api/http.js       # Axios 实例和登录态封装
│   │   ├── router/index.js   # 前端路由与角色跳转
│   │   └── views/            # 首页、登录注册、三类工作台页面
│   ├── public/uploads/avatar # 本地上传图片目录
│   └── package.json
└── CosVerse_Sql/
    ├── DDL.Sql               # 建库建表脚本
    └── new_data.sql          # 初始化数据脚本
```

## 技术栈

### 后端

- Java 17
- Spring Boot 3.5.13
- Spring Web
- Spring Security
- MyBatis Spring Boot Starter 3.0.5
- MySQL Connector/J
- PageHelper
- Lombok
- JJWT
- BCrypt 密码加密

### 前端

- Vue 3
- Vite 7
- Vue Router
- Axios
- Element Plus
- Sass Embedded

### 数据库

- MySQL
- 数据库名：`cosverse_db`
- 默认后端端口：`8080`
- 默认前端开发端口：`5173`

## 功能模块

### 公共前台

- 首页内容展示
- 活动资讯列表
- 各地 Cosplay 展出宣传分页展示
- 服务分类浏览
- 服务市场列表
- 服务者详情、作品集展示
- 服务者可预约时段查看
- 用户预约申请提交
- 论坛版块、帖子、评论和点赞数据浏览

### 用户端

- 注册与登录
- 个人资料维护
- 我的预约列表
- 预约详情查看
- 预约取消

### 服务者端

- 服务者个人资料维护
- 服务者头像上传
- 作品集新增、编辑、删除
- 作品图片上传
- 预约申请查看
- 预约同意或拒绝
- 可预约/不可预约档期维护

### 管理员端

- 系统用户管理
- 服务者档案管理
- 服务分类管理
- 服务项目管理
- 服务者作品管理
- 活动资讯管理
- 漫展宣传管理
- 图片上传与回显

## 数据库说明

数据库脚本位于 `CosVerse_Sql` 目录。

主要数据表包括：

| 表名 | 说明 |
| --- | --- |
| `sys_role` | 角色表 |
| `sys_permission` | 权限定义表 |
| `sys_role_permission` | 角色权限关联表 |
| `sys_user` | 用户基础信息表 |
| `sys_provider_info` | 服务者信息表 |
| `t_service_category` | 服务分类表 |
| `t_service_item` | 服务项目表 |
| `y_provider_portfolio` | 服务者作品集表 |
| `y_appointment` | 预约申请表 |
| `y_provider_service_schedule` | 服务者不可预约时间表 |
| `t_news_info` | 活动资讯表 |
| `t_cos_exhibition_promo` | Cosplay 展出宣传表 |
| `t_forum` | 论坛版块表 |
| `t_forum_post` | 论坛帖子表 |
| `t_forum_comment` | 论坛评论表 |
| `t_forum_like` | 论坛点赞表 |

初始化数据中包含三类角色：

| 角色 ID | 角色编码 | 角色名称 | 示例用户名 |
| --- | --- | --- | --- |
| `1` | `ADMIN` | 管理员 | `admin` |
| `2` | `MANAGER` | 服务者 | `manager` |
| `3` | `USER` | 顾客 | `user` |

> 初始化脚本中的用户密码为 BCrypt 密文。如果需要重置演示账号密码，可以通过注册接口创建新用户，或使用后端 BCrypt 工具重新生成密文后更新 `sys_user.password`。

## 环境要求

- JDK 17+
- Maven 3.8+，也可以直接使用项目内置的 `mvnw`
- MySQL 8.x
- Node.js `^20.19.0` 或 `>=22.12.0`
- npm

## 快速启动

### 1. 初始化数据库

登录 MySQL 后执行：

```bash
mysql -u root -p < CosVerse_Sql/DDL.Sql
mysql -u root -p cosverse_db < CosVerse_Sql/new_data.sql
```

`DDL.Sql` 会删除并重新创建 `cosverse_db` 数据库，请在执行前确认本地没有需要保留的同名数据库。

### 2. 修改后端数据库配置

打开 `CosVerse/src/main/resources/application.yml`，根据本地 MySQL 环境修改：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/cosverse_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
```

当前项目中的默认配置为：

```yaml
server:
  port: 8080
```

### 3. 启动后端

```bash
cd CosVerse
./mvnw spring-boot:run
```

后端启动地址：

```text
http://localhost:8080
```

### 4. 安装并启动前端

```bash
cd CosVerse_Vue
npm install
npm run dev
```

前端默认访问地址：

```text
http://localhost:5173
```

前端接口地址在 `CosVerse_Vue/src/api/http.js` 中配置：

```js
const http = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 5000,
})
```

如果后端端口或地址发生变化，需要同步修改这里。

## 常用命令

### 后端

```bash
cd CosVerse
./mvnw spring-boot:run
./mvnw -DskipTests compile
```

### 前端

```bash
cd CosVerse_Vue
npm install
npm run dev
npm run build
npm run preview
```

## 接口分组

| 控制器 | 路径前缀 | 说明 |
| --- | --- | --- |
| `AuthController` | `/api/auth` | 注册、登录、刷新 Token、退出登录 |
| `IndexController` | `/api/index` | 首页、分类、资讯、展出、服务市场、预约创建 |
| `ForumController` | `/api/forum` | 论坛版块、帖子、评论、点赞列表 |
| `PersonnelInfoController` | `/api/personnel` | 当前用户/服务者综合信息 |
| `UserController` | `/api/user` | 顾客个人资料与预约管理 |
| `ManagerController` | `/api/manager` | 服务者资料、作品集、预约处理、档期管理 |
| `AdminController` | `/api/admin` | 后台基础数据管理 |
| `ImageUploadController` | `/api/upload` | 图片上传 |

## 前端路由

| 路由 | 页面 | 访问说明 |
| --- | --- | --- |
| `/` | 首页 | 公共访问 |
| `/market` | 服务市场 | 公共访问 |
| `/forum` | 论坛广场 | 公共访问 |
| `/login` | 登录 | 公共访问 |
| `/register` | 注册 | 公共访问 |
| `/mine/admin` | 管理员工作台 | 角色 ID 为 `1` |
| `/mine/manager` | 服务者工作台 | 角色 ID 为 `2` |
| `/mine/user` | 用户工作台 | 角色 ID 为 `3` |

登录成功后，前端会根据 `roleId` 自动跳转：

- `1` 跳转 `/mine/admin`
- `2` 跳转 `/mine/manager`
- `3` 跳转 `/mine/user`

## 上传文件说明

图片上传接口为：

```text
POST /api/upload/avatar
```

后端通过 `UploadPathUtil` 将图片保存到前端项目的：

```text
CosVerse_Vue/public/uploads/avatar
```

并通过以下静态资源路径访问：

```text
/avatar/**
/uploads/avatar/**
```

前端展示图片时会将相对路径拼接到后端 `baseURL` 上，因此本地开发时通常访问：

```text
http://localhost:8080/uploads/avatar/xxx.jpg
```

## 鉴权与安全状态

项目包含 JWT、权限注解、权限拦截器、密码 BCrypt 加密和 Spring Security 配置。

需要注意的是，当前 `CosVerse/src/main/java/com/cosverse/config/MybatisConfig.java` 中 JWT 拦截器和权限拦截器的注册代码处于注释状态；`SecurityConfig` 中也配置为所有请求 `permitAll`。因此当前后端主要依赖前端路由和业务参数进行页面级区分。如果要用于生产环境，应启用 JWT 拦截器、权限拦截器，并按接口补充严格的后端权限校验。

## 开发注意事项

- `application.yml` 中包含本地数据库账号密码，提交公开仓库前建议改为环境变量或本地配置覆盖。
- `new_data.sql` 数据量较大，包含用户、服务、资讯、展会和论坛示例数据。
- 前端 `http.js` 的后端地址为硬编码 `http://localhost:8080`，部署时建议改为环境变量。
- Vue 项目依赖 Node 20.19+ 或 Node 22.12+，低版本 Node 可能无法正常安装或启动 Vite 7。
- 后端上传目录与前端 `public/uploads/avatar` 有耦合，部署时需要确认静态资源目录存在且进程有写入权限。

## 项目入口

- 后端启动类：`CosVerse/src/main/java/com/cosverse/CosVerseApplication.java`
- 后端配置文件：`CosVerse/src/main/resources/application.yml`
- 前端入口：`CosVerse_Vue/src/main.js`
- 前端路由：`CosVerse_Vue/src/router/index.js`
- 前端请求封装：`CosVerse_Vue/src/api/http.js`
- 数据库脚本：`CosVerse_Sql/DDL.Sql`、`CosVerse_Sql/new_data.sql`

## GitHub 链接

https://github.com/Mrtx233/Cosplay_Verse
