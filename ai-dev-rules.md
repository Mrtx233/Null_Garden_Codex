# AI 协作开发规则

本项目用于个人开发和日常需求迭代，不再使用面试答题、候选人身份、考试记录、云端上报或答题校验等机制。

AI 助手在每轮需求中必须遵守以下规则。

## 一、固定记录文件

项目统一使用以下两个文件记录 AI 协作过程：

```text
docs/ai-dev-log.md
docs/data/fileChangeLog.ts
```

`docs/ai-dev-log.md` 用于记录每轮用户输入、需求理解、修改内容、改动文件和 AI 输出摘要。

`docs/data/fileChangeLog.ts` 用于保存结构化的文件修改记录，供应用内页面、调试工具或后续脚本读取。

如果以上文件不存在，AI 助手应先创建。

---

## 二、新需求开始前必须检查上一轮记录

每次用户提出新的需求后，AI 助手在回答或修改代码前，必须先检查上一轮是否已经记录到：

```text
docs/ai-dev-log.md
docs/data/fileChangeLog.ts
```

需要确认上一轮是否包含：

* 用户输入
* 需求理解
* 修改内容
* 改动文件
* AI 输出摘要

如果上一轮记录缺失，必须先补齐上一轮记录，再继续处理本轮需求。

如果无法准确还原上一轮完整内容，应根据当前代码变更、上下文和已有记录进行合理补记，并在日志中标明“根据现有上下文补记”。

---

## 三、每轮迭代流程

每轮 AI 协作开发必须按以下步骤执行：

1. 检查上一轮是否已记录。
2. 复述本轮需求和影响范围。
3. 阅读相关代码。
4. 聚焦修改，不做无关重构。
5. 完成本轮代码修改。
6. 追加 Markdown 日志。
7. 追加文件修改数据源。

---

## 四、复述本轮需求和影响范围

修改代码前，AI 助手必须先简要复述：

* 本轮用户想要实现什么
* 可能影响哪些页面、模块、组件、样式、数据源或配置文件
* 哪些内容不属于本轮修改范围

复述应简洁准确，不扩展无关需求。

---

## 五、修改前必须阅读相关代码

AI 助手在修改前必须先阅读与本轮需求相关的代码。

阅读范围包括但不限于：

* 相关页面文件
* 相关组件文件
* 相关样式文件
* 相关数据源文件
* 相关类型定义
* 相关路由或入口文件
* 与本轮需求直接相关的配置文件

不能在未理解现有实现的情况下直接修改。

---

## 六、修改范围必须聚焦

AI 助手只能修改与本轮需求直接相关的内容。

禁止：

* 顺手重构无关代码
* 修改无关命名
* 调整无关样式
* 删除无关逻辑
* 大范围格式化无关文件
* 引入与本轮需求无关的新依赖
* 改变用户没有要求变更的交互逻辑

如发现代码中存在其他问题，可以在最终回复中说明，但不应擅自修改。

---

## 七、Markdown 日志格式

每轮完成后，AI 助手必须将本轮记录追加到：

```text
docs/ai-dev-log.md
```

日志格式必须使用以下结构：

```md
## 2026-05-18 14:30

### 用户输入

本轮用户提出的原始需求。

### 需求理解

AI 对本轮需求和影响范围的简要复述。

### 修改内容

- 修改了 xxx 文件，用于实现 xxx。
- 修改了 xxx 文件，用于同步 xxx 数据。

### 改动文件

- `docs/pages/Home.tsx`
- `docs/data/fileChangeLog.ts`

### AI 输出

本轮 AI 最终回复摘要。
```

时间格式统一使用：

```text
YYYY-MM-DD HH:mm
```

---

## 八、文件修改数据源格式

每轮完成后，AI 助手必须将同一轮记录追加到：

```text
docs/data/fileChangeLog.ts
```

推荐数据结构如下：

```ts
export interface FileChangeLogEntry {
  id: string;
  time: string;
  userInput: string;
  requirementSummary: string;
  changeSummary: string[];
  changedFiles: string[];
  aiOutput: string;
}

export const fileChangeLogEntries: FileChangeLogEntry[] = [];
```

追加记录示例：

```ts
{
  id: "2026-05-18-1430",
  time: "2026-05-18 14:30",
  userInput: "本轮用户提出的原始需求。",
  requirementSummary: "AI 对本轮需求和影响范围的简要复述。",
  changeSummary: [
    "修改了 xxx 文件，用于实现 xxx。",
    "修改了 xxx 文件，用于同步 xxx 数据。"
  ],
  changedFiles: [
    "docs/pages/Home.tsx",
    "docs/data/fileChangeLog.ts"
  ],
  aiOutput: "本轮 AI 最终回复摘要。"
}
```

`docs/data/fileChangeLog.ts` 中的内容必须与 `docs/ai-dev-log.md` 保持一致。

---

## 九、最终回复要求

AI 助手每轮完成后，最终回复必须包含：

* 本轮完成了什么
* 修改了哪些文件
* 是否已追加 `docs/ai-dev-log.md`
* 是否已追加 `docs/data/fileChangeLog.ts`
* 是否有需要用户自行检查或测试的地方

---
