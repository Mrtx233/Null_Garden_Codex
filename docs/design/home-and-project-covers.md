# 首页与项目封面设计

使用内置 imagegen，参考用户确认的角色三视图，制作 1 张透明首页插画和 6 张项目概念封面。统一黑发、黑框眼镜、红白上衣与紫色 / 薄荷绿配色。封面表达项目主题，属于设计插画。

## 页面与维护

- 首页：`src/assets/home-garden.png`；透明背景，适配浅色与深色主题。
- 项目 07–12：`src/assets/projects/project-07.png` 至 `project-12.png`。
- `src/data/projectVisuals.ts` 按项目文件编号映射封面。后续已补齐全部文章与项目封面，新增内容未配置专属图片时使用默认插画，详见 [全量内容封面补齐](all-content-covers.md)。
- 首页和项目列表使用 `ProjectCover.astro`，通过共用的 `CoverImage.astro` 生成多尺寸 WebP；非首屏封面延迟加载，首页人物优先加载。
- 内容概览自动统计非草稿文章、项目、手册系列及手册篇数，点击进入对应列表。
- 首页右侧使用静态插画和细线装饰，手机端转为上下布局。

## 完整生成提示词

### 首页

```text
Use case: stylized-concept. Create a polished website hero illustration using the attached approved character turnaround as identity reference. Preserve the young male cartoon character's tousled black hair, thick rectangular black glasses, white long sleeve jersey with red curved stripes, dark trousers and black white sneakers. Remove sports branding and all text. Same refined 2D cel-shaded hand-drawn style. New pose: sitting comfortably on a low rounded lavender garden island with a slim open laptop on his knees, facing slightly left toward website copy, warm focused smile. Beside him, a small mint green plant grows into a graceful branching tree of a few glowing violet abstract data nodes, paper and code-bracket shapes; a tiny watering can near his shoe. A visual metaphor of planting ideas and growing technical projects. Compact balanced composition, character occupies most of the scene, all body and tree visible, generous clear edges. Violet/mint/cream accents, restrained detail, premium editorial illustration, no text, numbers, logos, borders, interface mockup or background. Portrait-ish square canvas. Truly transparent background including corners, only a subtle local ground shadow.
```

### 项目 07

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character happily collecting a few floating product tags, a folded shirt and a shoe into organized mint spreadsheet cells, then a lavender export package. Commerce data collection and export theme.
```

### 项目 08

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character working at a desktop workstation, connecting three chunky lavender workflow modules using mint arrows. Each module has a simple link icon, grid icon or package icon. Modular crawler pipeline and queue management theme.
```

### 项目 09

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character organizing floating mint structured data blocks between large lavender curly brace shapes, pointing toward a simple balanced price chart and an organized report page. JSON structured data analysis and pricing theme. No text inside charts.
```

### 项目 10

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character holding a magnifying glass over a large illustrated question paper with blank line shapes and checkbox circles. A lavender scanning frame converts a small picture tile into clean mint answer lines. Image question recognition and OCR theme. No readable writing.
```

### 项目 11

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character holding a pencil and calmly arranging a large lavender architectural blueprint with mint connected module boxes, database cylinder shapes and a few code bracket symbols. AI software architecture and code generation theme. Abstract diagram without readable names.
```

### 项目 12

```text
Use case: stylized-concept. Create one landscape 1536x1024 editorial illustration for a personal technical project's website cover. Identity reference is the attached approved turnaround: same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes, black trousers. Remove sports logos. Same polished 2D cel shading and clean ink contours. Cohesive palette: warm cream background, lavender/purple, mint and tiny amber accents. Mid-shot character on the left, clear thematic objects on the right, simple spacious composition, restrained details readable at small size. No readable text, letters, labels, logos, watermarks or diagram legends. This is an illustrative metaphor, not an actual application screenshot. Character typing on a slim laptop at a tidy desk while three floating article papers move from mint search magnifying glass to lavender sparkling pen and a final clean page. AI article search, reference analysis and assisted writing theme. Papers use only abstract line shapes, no writing.
```
