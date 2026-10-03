---
title: "BluePrintor｜Java 系统架构设计生成器"
description: "基于 React、Express 和豆包模型的架构设计工具，从项目需求生成可行性报告、功能模块、PlantUML 与 MySQL DDL，并通过模板生成 Spring Boot 后端代码。"
githubUrl: "https://github.com/Mrtx233/BluePrintor"
repositoryVisibility: private
draft: false
featured: true
stack:
  - React
  - TypeScript
  - Vite
  - Express
  - 豆包
  - JSZip
---

# BluePrintor｜Java 系统架构设计生成器

## 项目定位

这是我将 AI 架构规划与后端代码模板结合的设计工具。输入项目名称、架构偏好和补充需求后，系统生成结构化方案，再分区域展示可行性、功能、UML、数据库和 SQL。

工具本身使用 Node.js 与 React 运行；Spring Boot、MySQL 和 MyBatis 是导出后端项目所涉及的技术，不是运行生成器时必须启动的服务。

本篇依据仓库 README、接口、类型定义、代码生成器和界面实现整理，阅读日期为 **2026 年 10 月 3 日**。仓库当前为私有仓库，源码链接需要访问权限。

## 核心能力

### 架构方案生成

后端 `POST /api/architecture/generate` 接收项目需求，调用豆包模型并返回结构化 JSON。输入校验检查项目名称，输出校验检查关键对象、字段与数组，避免把明显不完整的结果直接作为成功方案展示。

可行性报告包含项目背景、目标用户、核心需求、难度、人月估算、技术可行性、风险和应对建议。

### 功能与 UML 设计

功能设计分为用户端、管理端和核心业务引擎。模型同时生成用例图、活动图和系统模块图的 PlantUML 源码，作为设计文档的一部分。

### 数据库与 SQL

方案包含 RBAC 表说明、业务表概要，以及 MySQL 8 的 RBAC、业务和完整 DDL。前端使用表结构解析工具衔接后续代码生成。

### 模板化后端代码生成

`src/utils/codeGenerator.ts` 根据表结构与生成配置输出 Java 分层文件，包括：

- Entity、Mapper 与 Mapper XML。
- Service、ServiceImpl 与 Controller。
- 公共响应、分页和异常处理等类。
- Maven 配置、应用入口与 YAML 配置。

生成配置包含包名、作者和 Lombok、OpenAPI、Validation 等开关。CRUD 配置可控制新增、删除、批量删除、修改、详情、列表、分页和导出等功能。

架构方案来自模型；后端代码部分采用本地模板生成。两者是相互衔接但不同的生成步骤。

### 历史与导出

前端将最近的方案历史保存在本机 `localStorage`，支持恢复、删除和清空。导出组件支持 Markdown 设计文档与 JSON 数据，代码界面结合 JSZip 打包生成文件。

## 技术架构

```text
React 需求输入
  → Express 输入校验
  → 火山方舟模型请求
  → 架构 JSON 校验
  → 设计工作区
  → 表结构解析与代码模板
  → 文档 / JSON / 代码产物
```

| 技术                        | 职责                                       |
| --------------------------- | ------------------------------------------ |
| React / TypeScript          | 需求输入、设计工作区、结构化状态与界面组件 |
| Vite                        | 前端开发与构建                             |
| Express                     | 架构生成接口与服务端模型调用               |
| 豆包 / 火山方舟             | 结构化架构方案生成                         |
| JSZip                       | 代码文件打包                               |
| Tailwind CSS / lucide-react | 样式与图标                                 |

## 关键模块

| 路径                         | 职责                                           |
| ---------------------------- | ---------------------------------------------- |
| `server.ts`                  | 服务启动                                       |
| `src/server/app.ts`          | API、需求校验与架构 JSON 校验                  |
| `src/server/deepseek.ts`     | 当前豆包接口请求与响应处理；文件名保留历史命名 |
| `src/types.ts`               | 架构、数据库、表结构与代码生成类型             |
| `src/utils/sqlParser.ts`     | SQL 表结构解析                                 |
| `src/utils/codeGenerator.ts` | Java 后端代码模板                              |
| `src/components/`            | 可行性、功能、UML、数据库、代码与导出界面      |

## 模型配置

当前代码调用火山方舟 Agent Plan 接口，模型固定为 `doubao-seed-evolving`，启用思考模式和 high 推理强度，要求 JSON 对象，使用非流式请求和 120 秒超时。

服务端优先读取 `ARK_API_KEY`，兼容历史变量名 `DEEPSEEK_API_KEY`。后者当前也必须填写火山方舟密钥，不能因为文件名或变量名包含 DeepSeek 就误填另一家服务的密钥。

## 环境与启动

README 要求 Node.js 20+、npm、可访问火山方舟的网络和有效模型服务密钥。安装依赖后，将 `.env.example` 复制为 `.env.local`，按模板填写配置：

```bash
npm install
npm run dev
```

默认页面位于 `http://localhost:3000`。生产构建与启动：

```bash
npm run build
npm start
```

仓库提供 `npm test`、`npm run lint` 与构建命令。本次整理没有执行模型请求或对导出的 Java 项目进行编译验收。

## 当前边界与实践价值

该项目适合需求讨论、架构草稿和 CRUD 起步。模型输出仍需检查业务正确性、SQL 约束和 UML 语法；结构校验通过不等于设计正确或导出代码能够直接投入生产。

源码中的 Express 生成接口没有实现独立的用户登录或请求限流。对外部署前需要按实际使用场景补齐访问控制；导出的代码也需完成数据库配置、编译、测试和业务实现。

## 仓库与资料

- [GitHub 仓库](https://github.com/Mrtx233/BluePrintor)（私有，需要权限）
- [运行说明](https://github.com/Mrtx233/BluePrintor/blob/main/README.md)
- [架构生成接口](https://github.com/Mrtx233/BluePrintor/blob/main/src/server/app.ts)
- [后端代码模板](https://github.com/Mrtx233/BluePrintor/blob/main/src/utils/codeGenerator.ts)
