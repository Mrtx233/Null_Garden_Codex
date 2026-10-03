# Null Garden｜个人技术博客与学习档案

Null Garden 是 **LV MA（马缕）** 的个人网站，用于持续记录技术学习、Python 数据采集、AI 工具、项目实践和个人思考。网站将独立文章、项目介绍和阶段式开发手册统一归档，便于按主题浏览和长期维护。

项目基于 **Astro 静态站点生成**，使用 Markdown 管理内容，使用 TypeScript 编写内容处理逻辑，使用原生 CSS 实现页面样式。构建后生成静态 HTML 和资源文件，部署时不需要数据库或常驻后端服务。

- 网站地址：[Null Garden](https://null-garden.netlify.app/)
- 代码仓库：[Mrtx233 / Null_Garden_Codex](https://github.com/Mrtx233/Null_Garden_Codex)
- 当前项目版本：`0.1.0`，对应 `package.json`。
- 文档更新日期：**2026 年 10 月 3 日**；以下说明以当前仓库实现为依据。

## 目录

- [一、项目定位与功能](#一项目定位与功能)
- [二、技术栈与运行要求](#二技术栈与运行要求)
- [三、快速启动与常用命令](#三快速启动与常用命令)
- [四、目录结构与代码职责](#四目录结构与代码职责)
- [五、页面路由与内容处理流程](#五页面路由与内容处理流程)
- [六、Markdown 内容维护](#六markdown-内容维护)
- [七、命名、排序与稳定链接](#七命名排序与稳定链接)
- [八、界面与站点信息定制](#八界面与站点信息定制)
- [九、构建与部署](#九构建与部署)
- [十、维护流程与检查](#十维护流程与检查)
- [十一、常见问题](#十一常见问题)
- [十二、当前边界与授权说明](#十二当前边界与授权说明)

## 一、项目定位与功能

网站以简洁、低干扰和适合长文阅读为主要设计目标，内容分为三个板块：

| 板块 | 内容用途 | Markdown 位置 |
| --- | --- | --- |
| 文章 | 独立技术笔记、知识总结和专题整理 | `md/` 直接下属的 `.md` 文件 |
| 项目介绍 | 项目定位、技术方案、功能说明和仓库入口 | `md/projects/` 直接下属的 `.md` 文件 |
| 开发手册 | 按系列和阶段组织的学习路线、实施步骤 | `md/Development-Manual/` 下的 `.md` 文件，支持子目录 |

现有文章涉及 Python 爬虫、字节编码、AES/RSA、DrissionPage 和 Scrapy；目前收录 12 个项目，包括 Vague-Search、政务信息采集、JoyFit、Anglan 电商数据处理系列、含图题目 OCR、BluePrintor 和公众号文章研究台；开发手册包括 Django、Flask、FastAPI 和 Python 爬虫学习路线。这些是网站展示的内容主题，运行博客本身不需要安装它们涉及的 Python 框架。

已实现的主要能力：

- **静态页面生成**：首页、列表页、关于页和内容详情页在构建时生成。
- **统一内容管理**：三类内容通过 Astro Content Collections 加载，并校验 frontmatter 字段。
- **深浅主题切换**：默认深色，可通过导航区按钮切换，选择保存在浏览器 `localStorage` 的 `theme` 键中。
- **自动目录与侧边导航**：详情页从 Markdown 二级、三级标题生成目录，支持折叠子章节；手机端默认收起目录，文章/项目/系列导航放在正文之后。
- **目录位置提示**：浏览器滚动时，根据标题位置高亮当前目录项。
- **代码复制**：代码块配有独立操作栏；成功显示“已复制”，浏览器不支持剪贴板或拒绝权限时提供手动复制提示。
- **编号排序**：文件编号控制文章、项目和手册的显示顺序。
- **草稿过滤**：`draft: true` 的内容不进入当前页面列表，也不生成对应详情路由。
- **响应式阅读布局**：桌面端使用侧栏与正文布局，小屏幕下转换为单列。
- **搜索与筛选**：支持标题、简介和正文搜索，可按文章/项目/手册及标签筛选。搜索索引仅在有搜索条件时加载。
- **阅读辅助**：提供预计阅读时间、上一篇/下一篇、返回目录和返回顶部。
- **订阅与收录**：提供 RSS、站点地图、robots.txt、自定义 404、favicon 和 PNG 分享图。
- **基础页面元信息**：提供页面标题、描述、canonical、Open Graph 和 Twitter 卡片信息；搜索及 404 页面标记为 noindex。
- **发布前检查**：构建自动检查内部页面、正文锚点、资源和搜索结果地址，失效链接会导致构建失败。

## 二、技术栈与运行要求

| 项目 | 当前配置 | 用途 |
| --- | --- | --- |
| Astro | `^7.3.5` | 页面构建、静态路由、Markdown 渲染和内容集合 |
| TypeScript | `^6.0.3` | 类型约束和内容工具函数 |
| `@astrojs/check` | `^0.9.10` | 构建前检查 Astro 文件和类型问题 |
| 样式 | 原生 CSS、CSS 变量、媒体查询 | 主题、排版、卡片和响应式布局 |
| 内容格式 | Markdown + 必填 YAML frontmatter | 内容存储与元数据维护 |
| Markdown 处理 | `@astrojs/markdown-remark`、`github-slugger` | 相对文档链接转换和稳定 ID 生成 |
| 检查工具 | `parse5`（开发依赖）、Node.js 测试工具 | 解析构建 HTML，验证链接和回归行为 |
| 默认部署配置 | Netlify | 执行构建并发布 `dist/` |

版本范围来自 `package.json`，实际安装版本由 `package-lock.json` 锁定。安装时还会包含传递依赖；以锁文件和 `npm ls --depth=0` 的结果为准。

运行环境要求：

- **Node.js `>= 22.12.0`**：依据当前安装的 Astro 7.3.5 的 `engines.node`。旧版说明中的 Node.js 18 或 20 不适用于此版本。
- **npm `>= 9.6.5`**：依据同一 Astro 包的 npm 版本要求。
- 项目通过 `.nvmrc` 与 Netlify 配置固定 Node.js **24.11.1**，建议开发环境使用相同版本。
- Git：用于克隆仓库和管理改动。

先在终端确认版本：

```bash
node -v
npm -v
```

本项目没有 Python 启动入口，也不需要创建 Python 虚拟环境。macOS、Windows 和 Linux 均可在满足 Node.js/npm 要求后使用相同的 npm 命令运行。

## 三、快速启动与常用命令

### 1. 获取代码

```bash
git clone https://github.com/Mrtx233/Null_Garden_Codex.git
cd Null_Garden_Codex
```

已有本地项目时，直接进入包含 `package.json` 的仓库根目录。

### 2. 安装依赖

推荐按锁文件安装，保持本地与部署环境一致：

```bash
npm ci
```

需要新增依赖或主动更新依赖时使用 `npm install`，并检查 `package.json` 与 `package-lock.json` 的变化。`npm ci` 要求二者一致，且会重新安装 `node_modules/`。

### 3. 启动开发服务

```bash
npm run dev
```

默认访问地址为 `http://localhost:4321/`；端口被占用时，以终端实际显示的地址为准。修改页面、样式和 Markdown 内容后，开发服务会更新页面。停止服务使用 `Ctrl + C`。

如需指定端口：

```bash
npm run dev -- --port 4322
```

### 4. 常用命令

| 命令 | 作用 | 适用场景 |
| --- | --- | --- |
| `npm ci` | 按锁文件安装依赖 | 首次获取代码、部署安装 |
| `npm run dev` | 启动开发服务 | 日常编辑与调试 |
| `npm start` | 同样执行 `astro dev` | 与开发命令等价 |
| `npm run check` | 单独执行项目检查 | 排查类型和 Astro 诊断 |
| `npm test` | 执行回归测试 | 验证链接映射、主题容错与复制行为 |
| `npm run check:links` | 检查现有 `dist/` | 验证页面、锚点、资源和搜索链接 |
| `npm run build` | 执行类型检查、静态构建和链接检查 | 发布前验证并生成静态站点 |
| `npm run preview` | 预览已构建的站点 | 检查最终产物，需要先完成构建 |

## 四、目录结构与代码职责

```text
Null_Garden_Codex/
├── README.md                         # 项目说明与维护指南
├── package.json                      # 依赖声明与 npm 命令
├── package-lock.json                 # 依赖锁文件
├── astro.config.mjs                  # 站点地址、链接转换与深浅代码主题
├── .nvmrc                            # Node.js 版本
├── .github/workflows/check.yml        # CI：安装、回归测试、构建与链接检查
├── scripts/                          # 内容路由、Markdown 转换与链接检查
├── tests/                            # 链接与浏览器异常路径回归测试
├── public/                           # favicon、分享图与分享图 SVG 源文件
├── tsconfig.json                     # 继承 Astro 严格类型配置
├── netlify.toml                      # Netlify 构建命令与发布目录
├── .gitignore                        # 忽略依赖、构建产物和本地缓存
├── md/                               # 网站内容源文件
│   ├── 01Python爬虫完整系统总结.md     # 文章示例
│   ├── projects/                     # 项目介绍
│   │   ├── 01-vague-search.md
│   │   ├── …                         # 02—06：原有项目介绍
│   │   ├── 07-anglan-crawler.md
│   │   ├── 08-anglan-crawler-pro.md
│   │   ├── 09-anglan-crawler-json.md
│   │   ├── 10-pic-question-crawler.md
│   │   ├── 11-blueprintor.md
│   │   └── 12-article-platform.md
│   └── Development-Manual/           # 按目录划分的开发手册系列
│       ├── Django系统阶段开发计划/
│       ├── Flask 系统阶段开发计划/
│       ├── FastAPI系统阶段开发计划/
│       └── python爬虫阶段学习/
├── src/
│   ├── content.config.ts             # 内容集合、扫描路径与字段校验
│   ├── env.d.ts                      # Astro 类型引用
│   ├── components/                   # 折叠目录、前后篇阅读导航
│   ├── scripts/                      # 浏览器交互与搜索逻辑
│   ├── layouts/
│   │   └── BaseLayout.astro          # 页面外壳、导航、元信息与交互脚本
│   ├── pages/
│   │   ├── index.astro               # 首页
│   │   ├── about.astro               # 关于页，复用 featured 项目数据
│   │   ├── search.astro              # 搜索与筛选
│   │   ├── search-index.json.ts       # 公开内容搜索索引
│   │   ├── rss.xml.ts                # 文章订阅
│   │   ├── sitemap.xml.ts            # 公开页面站点地图
│   │   ├── robots.txt.ts             # 爬虫入口配置
│   │   ├── 404.astro                 # 未找到页面
│   │   ├── blog/
│   │   │   ├── index.astro           # 文章列表
│   │   │   └── [...slug].astro       # 文章详情
│   │   ├── projects/
│   │   │   ├── index.astro           # 项目列表
│   │   │   └── [...slug].astro       # 项目详情
│   │   └── development-manual/
│   │       ├── index.astro           # 手册系列列表
│   │       └── [...slug].astro       # 手册详情
│   ├── styles/
│   │   └── global.css                # 全站样式
│   └── utils/
│       ├── blog.ts                   # 文章标题、摘要、排序与链接
│       ├── projects.ts               # 项目字段读取、排序与仓库状态文案
│       └── developmentManual.ts      # 系列识别、阶段排序与摘要提取
├── node_modules/                     # 安装生成，不提交
├── .astro/                           # Astro 生成的类型和缓存，不提交
└── dist/                             # 构建生成的静态产物，不提交
```

最后三个目录由工具生成，首次克隆时可能不存在。当前仓库没有 `docs/` 协作日志目录或 `ai-dev-rules.md` 文件。

## 五、页面路由与内容处理流程

| 页面 | 路由 | 数据来源与行为 |
| --- | --- | --- |
| 首页 | `/` | 显示最新排序后的前 6 篇文章、编号排序后的前 6 个项目，以及各手册系列和每系列前 3 篇预览 |
| 文章列表 | `/blog/` | 所有非草稿文章，按文件编号排序 |
| 文章详情 | `/blog/<内容ID>/` | 渲染正文、目录和全部文章导航 |
| 项目列表 | `/projects/` | 所有非草稿项目，显示描述、技术栈和仓库填写状态 |
| 项目详情 | `/projects/<内容ID>/` | 渲染正文、目录、项目导航和 GitHub 入口 |
| 手册列表 | `/development-manual/` | 按系列分组，再按阶段排序 |
| 手册详情 | `/development-manual/<内容ID>/` | 渲染正文、目录及当前系列导航 |
| 关于页 | `/about/` | 个人信息来自页面，项目卡片来自非草稿且 `featured: true` 的个人项目；卡片标题一行，技术能力和工作与教育的描述完整显示，桌面端一行四列，窄屏自动减少列数；项目卡片描述三行，桌面端横滑完卡片后继续纵向滚动 |
| 搜索 | `/search/` | 可搜索标题、简介、正文，支持分类与标签筛选 |
| 搜索索引 | `/search-index.json` | 所有公开内容的静态 JSON；不会包含草稿 |
| RSS | `/rss.xml` | 公开文章摘要订阅，按首页的最新规则排序 |
| 站点地图 | `/sitemap.xml` | 主要列表、关于页和内容详情，不含搜索与 404 |
| 爬虫配置 | `/robots.txt` | 站点地图入口 |
| 未找到页面 | `/404.html` | 托管平台对不存在地址展示此页面 |

`<内容ID>` 使用 Astro 内容加载器生成的 `entry.id`。它来源于文件路径，可能经过规范化，并非所有情况下都与原始中文文件名逐字相同。维护链接时，以页面实际链接或构建输出为准。

```text
编辑 Markdown 文件
    ↓
content.config.ts 按扫描规则加载，并校验 frontmatter
    ↓
各页面过滤草稿，调用 utils 中的排序、分组和展示函数
    ↓
详情页通过 getStaticPaths() 确定路由，通过 render() 渲染正文与标题
    ↓
BaseLayout.astro 提供统一页面外壳和浏览器交互
    ↓
构建输出到 dist/，由静态托管服务发布
```

首页“最新文章”按 `pubDate` 倒序排序；有日期的文章优先，无日期或日期相同时按编号倒序，列表和前后篇导航仍按编号升序。现有文章没有可靠的历史发布日期，因此没有自动补造日期。更新 Markdown 后，正式网站需要重新构建、部署才能看到变化。

首页“我的项目”展示 LV MA 开发的、编号最近的 6 个非草稿项目，按编号倒序；项目总列表和前后篇导航按编号升序。关于页展示 `featured: true` 的项目。项目介绍为静态内容，仓库是私有还是公开不影响介绍页生成，也不会改变 GitHub 仓库的访问权限。

## 六、Markdown 内容维护

### 1. 通用写法

frontmatter 是文件最顶部、两行 `---` 之间的 YAML 元数据。标题、描述、标签等展示字段写在这里，正文写在第二行分隔符之后。

维护时建议：

- 文件保存为 UTF-8；YAML 使用空格缩进，避免 Tab。
- 描述写成简短、完整的一段话，适合列表展示和页面描述。
- 数组使用 YAML 列表格式；布尔值使用 `true` / `false`，不要写成字符串。
- 正文使用 `##` 和 `###` 划分章节，使侧边目录清楚易读。
- 代码块注明语言，例如 `python`、`bash`、`json`。
- 文件编号尽量固定并保持唯一，避免频繁重命名导致页面地址变化。

### 2. 新增文章

在 `md/` 下直接创建文件，例如 `md/07_异步爬虫实践.md`：

````markdown
---
title: "异步爬虫实践：从请求并发到数据归档"
description: "记录 asyncio 与 aiohttp 的使用方式、并发控制和错误处理。"
pubDate: 2026-10-03
tags:
  - Python
  - asyncio
  - 爬虫实践
draft: false
---

# 异步爬虫实践：从请求并发到数据归档

说明本文要解决的问题、适用场景和运行环境。

## 一、整体方案

介绍请求调度、并发限制与结果处理的流程。

### 1. 示例代码

```python
import asyncio

async def main():
    print("开始整理异步任务")

asyncio.run(main())
```

## 二、实践总结

记录遇到的问题、解决方法和后续改进。
````

| 字段 | 类型 | 是否必填 | 默认或行为 |
| --- | --- | --- | --- |
| `title` | 非空字符串 | **是** | 页面和卡片使用明确填写的标题 |
| `description` | 非空字符串 | **是** | 页面描述和卡片使用明确填写的摘要 |
| `pubDate` | 可转换为日期的值 | 否 | 有值时显示日期，并参与首页和 RSS 的最新排序 |
| `slug` | 路径字符串 | 否 | 显式固定内容 ID；可以使用文字、数字、下划线、连字符和路径段 |
| `tags` | 字符串数组 | 否 | 默认 `[]`，非空时展示为标签 |
| `draft` | 布尔值 | 否 | 默认 `false` |

文章集合只扫描 `md/*.md`。将文章放入新的子目录后，不会自动进入文章列表；需要修改加载规则才能支持这种结构。

### 3. 新增项目介绍

在 `md/projects/` 下直接创建文件，例如 `md/projects/07-my-project.md`：

```markdown
---
title: "我的项目"
description: "一个用于整理技术资料和开发记录的示例项目。"
githubUrl: "https://github.com/your-name/your-project"
stack:
  - Python
  - FastAPI
  - Vue 3
draft: false
---

# 我的项目

## 项目定位

说明目标用户、使用场景和解决的问题。

## 核心功能

- 功能一及其作用。
- 功能二及其使用方式。

## 技术方案

说明模块划分、主要依赖与实现思路。

## 安装与运行

根据对应项目的实际情况填写配置和启动步骤。
```

| 字段 | 类型 | 是否必填 | 默认或行为 |
| --- | --- | --- | --- |
| `title` | 字符串 | **是** | 用于项目名称和页面标题 |
| `description` | 字符串 | **是** | 用于列表摘要和页面描述 |
| `githubUrl` | HTTPS URL | 否 | 填写时校验 URL 与协议；不提供时显示“项目记录” |
| `repositoryVisibility` | `public` / `private` | 否 | 显示公开 / 私有仓库标签；未填时使用通用“GitHub 仓库” |
| `stack` | 非空字符串数组 | **是** | 展示技术栈标签，至少填写一项 |
| `featured` | 布尔值 | 否 | 默认 `false`；为 `true` 时出现在关于页 |
| `slug` | 路径字符串 | 否 | 显式固定内容 ID |
| `draft` | 布尔值 | 否 | 默认 `false` |

项目集合只扫描 `md/projects/*.md`。技术栈展示读取的是 **`stack`**；全部现有项目已统一为 `stack`。项目使用严格字段校验，误写为 `tags` 等未声明字段时会报错。

`githubUrl` 校验 HTTPS URL 格式，但不会在构建时访问外部仓库验证其存在性。公开仓库不等于已经声明开源许可；私有仓库的详情入口会标记“需访问权限”。发布前应手动确认链接和可见性，并替换模板中的示例地址。

当前项目文件索引：

| 编号 | 内容文件 | 项目 |
| --- | --- | --- |
| 01 | [01-vague-search.md](md/projects/01-vague-search.md) | Vague-Search |
| 02 | [02-scrapy-official-document.md](md/projects/02-scrapy-official-document.md) | Scrapy 政务与资讯采集 |
| 03 | [03-joyfit-ml.md](md/projects/03-joyfit-ml.md) | JoyFit 健身管理 |
| 04 | [04-ucan-football-management.md](md/projects/04-ucan-football-management.md) | 足球俱乐部管理 |
| 05 | [05-cosplay-verse.md](md/projects/05-cosplay-verse.md) | CosVerse |
| 06 | [06-FastAPI_Vue3_managemennt.md](md/projects/06-FastAPI_Vue3_managemennt.md) | FastAPI + Vue3 健身管理 |
| 07 | [07-anglan-crawler.md](md/projects/07-anglan-crawler.md) | Anglan 电商采集与转换 |
| 08 | [08-anglan-crawler-pro.md](md/projects/08-anglan-crawler-pro.md) | Anglan Pro 模块化工作流 |
| 09 | [09-anglan-crawler-json.md](md/projects/09-anglan-crawler-json.md) | JSON 四阶段与定价工作台 |
| 10 | [10-pic-question-crawler.md](md/projects/10-pic-question-crawler.md) | 含图题目采集与 OCR |
| 11 | [11-blueprintor.md](md/projects/11-blueprintor.md) | Java 系统架构生成器 |
| 12 | [12-article-platform.md](md/projects/12-article-platform.md) | 公众号文章研究与创作台 |

新收录的 6 篇介绍依据仓库说明和可见代码整理，并注明阅读日期、资料来源与当前边界。Anglan 三个项目通过相对 Markdown 链接互相关联。介绍页不复制真实密钥、浏览器会话或业务样本数据；本次整理没有执行这些项目的采集、模型调用或运行验收。

### 4. 新增开发手册系列

在 `md/Development-Manual/` 下创建系列目录，再放入阶段文件：

```text
md/Development-Manual/我的新系列/
├── 00_总览.md
├── 01_环境与基础搭建.md
├── 02_核心模块开发.md
└── 03_联调与发布.md
```

阶段文件示例：

```markdown
---
title: "第一阶段：环境与基础搭建"
description: "完成运行环境检查、项目初始化和最小可运行验证。"
tags:
  - 开发手册
  - 环境搭建
draft: false
---

# 第一阶段：环境与基础搭建

## 阶段目标

说明本阶段要完成的结果和前置条件。

## 操作步骤

1. 检查运行环境。
2. 初始化目录和依赖。
3. 启动并验证最小示例。

## 验收标准

- 启动命令可以正常执行。
- 页面或接口返回预期结果。

## 常见问题

记录错误现象、原因和处理方式。
```

手册必须提供非空 `title`、`description`；`tags`、`draft`、`slug` 可选，类型与文章中的同名字段一致。可设置 `overview: true` 标记总览。所有集合均拒绝未声明的字段，避免拼写错误被忽略。手册集合没有声明 `pubDate`，页面也没有日期功能。

手册递归扫描 `md/Development-Manual/**/*.md`，系列名称采用该目录下的**第一级子目录原始名称**。更深的目录仍归属于同一个顶层系列；直接放在 `Development-Manual/` 根目录的文件归到“开发手册”系列。

现有手册已补齐标题、摘要和标签。页面直接使用 frontmatter 中的标题，不再以文件名推断标题。

### 5. 草稿与发布

尚未完成的内容可设置：

```yaml
draft: true
```

完成编辑后改为 `false` 或删除该字段，再构建、部署。草稿过滤由页面代码执行，文件仍会经过内容加载和 schema 校验，因此项目草稿也必须提供 `title`、`description` 等必填字段。

## 七、命名、排序与稳定链接

### 1. 文章与项目的排序

文章和项目都读取内容 ID 文件名部分开头的数字，按数字从小到大排序：

```text
01_基础知识.md
02_实践记录.md
10_进阶总结.md
```

- 开头没有数字的内容排在带数字内容后面。
- 编号相同时，使用中文区域的自然文件名比较规则继续排序。
- 文章显示“第 01 篇”，项目显示“项目 01”；没有编号时分别显示“笔记”和“项目”。
- 文章列表、项目列表和阅读顺序按编号；首页文章与 RSS 按发布日期及编号倒序。
- 有自定义 `slug` 时，编号仍从原始文件名读取，调整显示名称不会改变排序规则。

### 2. 手册系列与阶段排序

先按系列名称排序，再在系列内部计算阶段顺序：

| 文件名示例 | 识别结果 |
| --- | --- |
| `阶段 1：项目初始化.md` | 阶段 1 |
| `阶段 12：业务拆分.md` | 阶段 12 |
| `01_项目初始化.md` | 阶段 01 |
| `02-核心模块.md` | 阶段 02 |
| `00_总览.md` | 总览，排序值为 0 |
| `补充说明.md` | “手册”，排在有编号的文件后面 |

手册设置 `overview: true`、文件名以 `00_` 等编号形式开头，或文件名清理后等于系列名称时，均显示“总览”，排序值为 0。建议阶段文件使用“数字 + 下划线/空格/连字符”的形式。

### 3. 明确摘要与稳定链接

三类内容都必须填写 `description`，不再自动从正文抽取摘要。摘要建议说明这篇内容的主题、适用场景和阅读收获，避免直接复制目录或代码。

正文中仍可以使用相对 Markdown 链接，例如：

```markdown
[进入第一阶段](01_环境与基础搭建.md)
[直接查看某一章节](01_环境与基础搭建.md#阶段目标)
```

构建插件会按目标文件的内容集合与 ID 转成网站地址，并保留查询参数和锚点。支持普通链接与引用式链接；外部链接和单页标题锚点不做改写。目标不存在、不在集合扫描范围，或公开内容引用草稿时，会中止构建。生成后再检查锚点是否存在。

文件重命名默认会改变地址。可以事先设置 `slug` 固定 ID；若已发布地址需要变更，应同时配置旧地址重定向。

### 4. 正文目录

详情页仅将二级和三级标题加入侧边目录，四级及以下标题不进入目录。文章和手册还会排除部分重复标题及“目录”标题，文章另外排除 `Table of Contents`；项目页使用全部符合层级条件的标题。

目录链接来自渲染后的标题锚点，三级标题放入可折叠的子章节。桌面端展开总目录，手机端默认收起总目录，并将全部文章/系列导航放在正文之后。正文自身的手写目录与侧边目录是两套内容，更新章节时也需要维护正文里的手写链接。

## 八、界面与站点信息定制

### 1. 修改站点名称和个人信息

| 修改内容 | 主要文件 |
| --- | --- |
| 默认页面标题、描述、导航和页脚 | `src/layouts/BaseLayout.astro` |
| 首页主标题、简介、板块文案和预览数量 | `src/pages/index.astro` |
| 个人介绍、技能、经历、项目和联系方式 | `src/pages/about.astro` |
| 各列表页标题与介绍 | 对应目录的 `index.astro` |
| 内容详情标题后缀与页面结构 | 对应目录的 `[...slug].astro` |
| 正式站点 URL | `astro.config.mjs` 的 `site` 字段 |

更换域名时同步更新 `site`，布局会据此生成 canonical 和 Open Graph URL。关于页仍是 Astro 页面，个人介绍与经历在页面中维护；项目展示复用内容集合中的 `featured` 项目。

### 2. 调整颜色与排版

全站样式集中在 `src/styles/global.css`：

- `:root` 定义默认深色主题颜色、字体和阴影。
- `:root[data-theme="light"]` 覆盖浅色主题变量。
- `--color-bg` 控制背景，`--color-text` 控制正文，`--color-muted` 控制辅助文字。
- `--color-accent` 及相关变量控制链接、按钮和交互强调色。
- `--font-body` 与 `--font-mono` 分别控制正文与代码字体；当前采用本地/系统字体回退方式。
- `.site-main`、`.site-header`、`.site-footer` 控制站点整体宽度，目前上限为 **1280px**。
- `.article-header h1`、`.content` 和 `.content pre` 分别控制详情标题、正文与代码块。

当前 `html` 没有显式设置全局 `font-size: 18px`，不要依据旧版 README 假定基础字号固定为 18px。顶部导航是普通页面布局；使用 `position: sticky` 的是桌面端侧边导航。

### 3. 响应式断点

| 最大视口宽度 | 主要变化 |
| --- | --- |
| `980px` | 文章、列表与手册侧栏布局转为单列，侧栏取消粘性定位 |
| `820px` | 文章、项目与手册系列等卡片网格转为单列 |
| `640px` | 调整导航排列、标题尺寸、页面间距，并保持复制按钮可见 |

修改样式后，建议分别检查桌面宽屏、平板宽度和手机宽度，尤其是长标题、代码块和表格。

## 九、构建与部署

### 1. 本地生产构建

```bash
npm run build
```

此命令依次执行 `astro check`、`astro build` 和 `npm run check:links`。任何一步失败都会阻止发布，避免错误链接随静态页面上线。构建产物位于 `dist/`，应编辑源文件后重新构建，不要直接修改生成的 HTML。

完成构建后预览：

```bash
npm run preview
```

预览服务展示的是上次构建产物，修改源文件后需要再次构建。访问地址以终端显示为准。

### 2. Netlify 部署

仓库已经提供 `netlify.toml`：

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24.11.1"
```

部署配置要点：

1. 在 Netlify 中关联本项目仓库，并选择用于部署的分支。
2. 将构建基础目录设为仓库根目录。
3. 构建命令使用 `npm run build`，发布目录使用 `dist`。
4. 确认构建环境的 Node.js 为 `22.12.0` 或以上，npm 满足前述要求。
5. 部署后检查首页、列表页、详情页和站点域名配置。

`.nvmrc`、CI 与 `netlify.toml` 使用相同的 Node.js 版本，升级运行环境时应同步修改。已配置 Git 自动部署后，提交并推送到部署分支通常会触发新构建；具体以该站点设置为准。

### 3. 使用其他静态托管服务

本项目没有服务端适配器，默认输出静态站点。其他支持静态文件的托管服务或 Nginx 可发布 `dist/` 全部内容，构建命令仍为 `npm run build`。

迁移时需要核对：

- 运行环境满足 Node.js/npm 要求。
- `astro.config.mjs` 的 `site` 对应新站点域名。
- 托管服务能将目录请求映射到生成的 `index.html`。
- 若部署到域名下的子路径，需要配置 Astro `base`，并检查现有以 `/` 开头的导航、内容链接和资源地址；当前代码主要按域名根路径部署编写。

## 十、维护流程与检查

推荐修改流程：

1. 确定修改的是站点说明、文章、项目介绍、手册还是页面代码。
2. 编辑对应源文件，检查 frontmatter、编号和标题层级。
3. 使用 `npm run dev` 查看列表和详情页，核对标题、摘要、标签、目录和链接。
4. 执行 `npm run build`，确认类型检查与静态构建完成。
5. 必要时运行 `npm run preview`，核对生产产物。
6. 使用 Git 检查修改范围，再提交和推送。

提交前检查命令：

```bash
git status --short
git diff --check
git diff -- README.md md/ src/
```

改动依赖时，也需要检查 `package.json` 与 `package-lock.json`。`node_modules/`、`dist/`、`.astro/` 和 `.netlify/` 已加入忽略规则，不应作为源文件提交。

内容检查重点：

- 必填字段是否齐全，字段类型是否正确。
- 新文件是否位于相应集合扫描范围内。
- 摘要是否意外显示目录列表或开场签名。
- 项目技术栈是否使用 `stack`。
- 草稿是否正确隐藏，发布内容是否显示在预期位置。
- 图片、外部链接、正文目录和页面导航是否有效。
- 长代码和宽表格在小屏幕下是否可阅读。

GitHub Actions 对 push 和 pull request 执行 `npm ci`、`npm test`、`npm run build`。回归测试覆盖中文路由与 slug、相对链接转换、失效链接检测、禁用存储时的主题切换、复制成功和复制失败。链接检查只检查站内引用，不请求外部网站；内容准确性和外部链接仍需人工核对。

建议发布前执行：

```bash
npm test
npm run build
git diff --check
```

## 十一、常见问题

| 现象 | 常见原因 | 处理方式 |
| --- | --- | --- |
| 启动提示 Node.js 版本不支持 | 使用旧版 Node.js | 升级到满足 `>= 22.12.0` 的版本，并确认终端实际使用的版本 |
| `npm ci` 报锁文件不一致 | 依赖声明与锁文件不匹配 | 核对改动意图，需要更新依赖时运行 `npm install` 并审阅锁文件变化 |
| 新文章没有出现 | 放在未扫描的子目录、设置了草稿或校验失败 | 检查路径、`draft` 和终端诊断 |
| 项目内容加载失败 | 缺少 `title` / `description` / `stack`，或字段类型不正确 | 补全必填元数据，数组和布尔值按示例填写 |
| 项目技术栈没有显示 | 使用 `tags`，或 `stack` 为空 | 将技术栈填写到 `stack` 字段 |
| 最新文章顺序不符合预期 | 缺少日期或日期相同 | 填写真实 `pubDate`；无日期时按编号倒序 |
| 手册标题与正文标题不同 | 两处标题填写不一致 | 同步更新 `title` 与正文一级标题 |
| 手册排序不符合预期 | 文件名不符合阶段编号规则 | 使用 `01_名称.md` 或 `阶段 1：名称.md` 等格式 |
| 构建提示未知字段 | 元数据拼写错误，或将项目技术栈写成 tags | 按集合字段表修正，项目使用 stack |
| 侧边目录缺少某些标题 | 标题层级不在二级、三级范围内，或被过滤 | 核对标题层级及对应详情页过滤逻辑 |
| 重命名后旧链接失效 | 文件路径改变导致内容 ID 改变 | 更新站内引用，并根据托管平台配置旧地址重定向 |
| 本地预览显示旧内容 | `preview` 使用上次构建结果 | 重新运行 `npm run build` 后再预览 |
| 线上没有显示最新修改 | 尚未部署、构建失败或部署分支不同 | 检查部署记录、构建日志和分支配置 |
| 复制按钮无法自动复制 | 浏览器不支持或拒绝剪贴板权限 | 按页面提示手动复制，也可在 HTTPS/localhost 下重试 |
| 主题选择无法记住 | 浏览器禁用了持久存储或清除了站点数据 | 检查 `localStorage`；清除 `theme` 后默认恢复深色 |

## 十二、当前边界与授权说明

当前实现聚焦静态内容展示，已经支持搜索、筛选、RSS 和站点地图；尚未实现分页、评论、登录和在线编辑后台。若需要增加这些能力，应同时更新相关页面、依赖配置和本文档。

`README.md` 用于仓库说明，不会被当前内容集合自动展示为网站文章。网站文章仍需放入 `md/`，项目介绍放入 `md/projects/`，手册放入 `md/Development-Manual/`。

本仓库目前没有独立的 `LICENSE` 文件，`package.json` 也未声明开源许可。内容和代码的使用授权请与作者确认。

### 搜索与订阅说明

- 搜索索引只包含非草稿内容，包括正文文本；使用多个空格分隔的关键词时，结果必须同时包含各关键词。
- 标题命中优先于摘要/标签命中，再使用正文命中；结果显示内容类型、标签、摘要和必要的正文片段。
- 提交搜索时将筛选条件写入 URL，便于分享；没有 JavaScript 时可使用文章、项目和手册列表。
- 索引加载失败时显示重试提示，后续搜索可以重新加载；结果使用纯文本创建 DOM，避免把正文当 HTML 注入。
- RSS 仅订阅文章摘要，无可靠发布日期的文章不输出虚构的发布日期。
- 分享图使用 `public/share.png`，`public/share.svg` 保留其可编辑源文件。部分社交平台会缓存分享图，需要发布后按平台规则刷新。

### 依赖升级与已知限制

本轮将 Astro 升级到 `7.3.5`，Markdown 处理显式使用 `@astrojs/markdown-remark` 的 `unified()`，保留相对文档链接转换和现有渲染行为；设置 `compressHTML: true` 保留原来的 HTML 空白规则。迁移依据：[Astro 7 官方迁移指南](https://docs.astro.build/en/guides/upgrade-to/v7/)。

截至 2026 年 10 月 3 日，`npm audit` 剩余 2 条高危报告，均来自 `http-cache-semantics` 同一个上游缓存问题及其对 Astro 的依赖关联；当前没有可用的修复版本。项目发布的是静态文件，没有用户认证响应缓存的服务端运行路径。后续升级依赖时仍应检查该公告：[GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)。不要使用 `npm audit fix --force` 自动降级到旧版 Astro。
