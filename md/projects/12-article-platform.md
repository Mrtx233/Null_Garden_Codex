---
title: "Article Platform｜公众号文章研究与创作台"
description: "前后端分离的公众号文章研究 Demo，整合关键词搜索、3—10 篇样本分析和 DeepSeek 流式初稿生成，提供三页面工作台、停止重生成与 Markdown 复制。"
githubUrl: "https://github.com/Mrtx233/article-platform"
repositoryVisibility: private
draft: false
featured: true
stack:
  - FastAPI
  - React
  - TypeScript
  - HTTPX
  - DeepSeek
  - SSE
---

# Article Platform｜公众号文章研究与创作台

## 项目定位

这是我将公众号文章检索、方法分析和初稿创作串联起来的内容研究 Demo。项目通过 RedFox 搜索接口获取样本，通过 DeepSeek 分析写作方法，再根据用户主题、要求与素材生成 Markdown 初稿。

当前 README 与前端版本为 V0.2，采用检索、分析、创作三页面工作台。模型提示词要求借鉴写作方法，避免直接复刻样本或虚构用户未提供的事实。

本篇结合仓库说明、前后端依赖、AI 路由、共享状态与 SSE 解析代码整理，阅读日期为 **2026 年 10 月 3 日**。仓库当前为私有仓库，源码链接需要访问权限。

## 三页面工作流

| 页面        | 操作与结果                                              |
| ----------- | ------------------------------------------------------- |
| `/search`   | 关键词搜索、加载更多、选择 3—10 篇分析样本              |
| `/analysis` | 查看样本、请求 AI 分析、浏览结构化结论                  |
| `/create`   | 填写创作要求、接收流式初稿、停止或重生成、复制 Markdown |

根路径跳转到检索页。样本不足时不能进入分析流程，没有分析结果时不能进入创作流程。

React Context 共享检索、选择、分析与生成状态，切换页面不会清空当前工作；开始新检索会重置依赖旧样本的分析和创作结果。

## 核心能力

### 文章搜索与样本选择

前端向自己的 FastAPI 后端发送关键词、分页偏移和排序条件。后端调用 RedFox，统一返回文章字段和错误提示，前端负责加载更多与选择样本。

### 写作方法分析

后端要求 3—10 篇不同文章作为输入，优先使用正文，正文缺失时使用摘要，并限制单篇输入长度。

分析结果覆盖标题、开头、结构、选题、CTA、语气、可复用技巧和单篇洞察，便于将样本研究转化为创作依据。

### SSE 流式创作

创作请求携带上一阶段的分析和用户要求，后端使用 `StreamingResponse` 输出 `text/event-stream`。前端解析跨网络分片的事件，处理增量内容、完成和错误状态。

```text
delta → 追加生成文字
done  → 接收完整 Markdown
error → 展示生成异常
```

前端使用 AbortController 支持停止当前生成，并允许重新生成和复制结果。取消浏览器请求并不保证模型服务端已经停止计费或执行。

### 密钥与接口边界

RedFox、DeepSeek 密钥由后端环境配置读取，前端只访问本项目后端。后端 AI 接口先检查配置，再调用模型服务，并将常见认证、配额、超时和结构异常转为用户可理解的提示。

## 技术架构

```text
React 三页面工作台
  → FastAPI 业务接口
     ├── RedFox：文章检索
     └── DeepSeek：结构化分析与流式生成
  → JSON 分析结果 / SSE Markdown
```

| 技术                | 职责                               |
| ------------------- | ---------------------------------- |
| React / TypeScript  | 页面、共享状态、内容展示与类型约束 |
| React Router        | 三页面路由与流程导航               |
| FastAPI / Pydantic  | API、请求模型与响应结构            |
| HTTPX               | 异步外部服务请求                   |
| SSE                 | 生成结果的增量传输                 |
| Vite / Tailwind CSS | 前端开发、构建与样式               |

## 主要目录与接口

| 路径                             | 职责                      |
| -------------------------------- | ------------------------- |
| `backend/routers/articles.py`    | 文章搜索 API              |
| `backend/routers/ai_articles.py` | 分析与流式生成 API        |
| `backend/services/`              | RedFox、DeepSeek 请求封装 |
| `backend/prompts/`               | 分析与创作提示词          |
| `backend/schemas/`               | 搜索、分析、生成数据模型  |
| `frontend/src/context/`          | 工作台共享状态            |
| `frontend/src/pages/`            | 检索、分析、创作页面      |
| `frontend/src/utils/sse.ts`      | 网络分片与 SSE 事件解析   |

对应接口为 `POST /api/articles/search`、`POST /api/articles/analyze` 和 `POST /api/articles/generate`。

## 环境与启动

README 要求 Python 3.11+、Node.js 20.19+、npm 10+，并准备有效的 RedFox 与 DeepSeek 密钥。实际依赖以各自清单和锁文件为准。

将 `backend/.env.example` 复制为 `backend/.env`，按模板填写 API 配置。启动后端：

```bash
python -m pip install -r backend/requirements.txt
cd backend
python -m uvicorn main:app --reload --port 8000
```

在新的终端，从仓库根目录启动前端：

```bash
cd frontend
npm install
npm run dev
```

前端默认为 `http://localhost:5173`，后端为 `http://localhost:8000`，接口文档为 `/docs`。开发配置默认允许 localhost 前端来源，修改地址时需要同步前端 API 地址与后端 CORS。

## 测试与实践价值

后端保留 API 与服务测试，使用 HTTPX MockTransport 模拟外部请求；前端保留工作台交互和 SSE 解析等 Vitest 测试。

本项目的实践重点是完整的“搜索 → 研究 → 创作”链路、跨页面状态、外部服务隔离和流式体验。本次整理没有运行该仓库测试、调用外部服务或消耗模型额度。

## 当前边界

当前是内容研究 Demo，不包含文章发布、账号管理或长期任务存储。工作台共享状态主要保存在内存，跨页面保持状态不等于刷新或关闭浏览器后永久保存。

输出是需要人工核对的初稿；来源事实、引用和原创性需要在正式使用前检查。后端密钥隔离也不等同于已经具备对外服务所需的用户鉴权与限流。

## 仓库与资料

- [GitHub 仓库](https://github.com/Mrtx233/article-platform)（私有，需要权限）
- [项目运行说明](https://github.com/Mrtx233/article-platform/blob/main/README.md)
- [分析与生成接口](https://github.com/Mrtx233/article-platform/blob/main/backend/routers/ai_articles.py)
- [前端 SSE 解析](https://github.com/Mrtx233/article-platform/blob/main/frontend/src/utils/sse.ts)
