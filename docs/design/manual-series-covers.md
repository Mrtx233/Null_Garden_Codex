# 开发手册四个专栏封面

使用内置 imagegen，参考用户确认的角色三视图，制作四张独立主题封面，与首页、文章和项目封面保持一致的红白上衣角色、紫色 / 薄荷绿和暖色背景。

## 素材与维护

| 专栏 | 素材 | 主题 |
| --- | --- | --- |
| Django | `src/assets/manuals/django.png` | 数据库底座、模块搭建与角色权限 |
| FastAPI | `src/assets/manuals/fastapi.png` | API 服务、前后端连接与安全 |
| Flask | `src/assets/manuals/flask.png` | 轻量应用与插件扩展 |
| Python 爬虫 | `src/assets/manuals/python-crawler.png` | 采集、解析、并发和存储的阶段路线 |

首页通过 `ManualSeriesCover.astro` 使用图片，`manualVisuals.ts` 按已有专栏锚点映射，未配置封面的新专栏暂用 Django 模块搭建图。共用 `CoverImage.astro` 输出多尺寸 WebP，图片延迟加载；手机端封面与卡片边缘对齐。原始 PNG 保留用于后续设计调整。

## 完整生成提示词

### django

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a staged development manual column on a personal technical website. Attached character turnaround is the strict identity reference. Same young male cartoon, tousled short black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and dark neckline, black trousers. Remove sports branding. Refined 2D cel-shaded editorial style, clean contours, warm cream background, lavender and mint with tiny amber accents; match the existing technical garden covers. Character mid-shot left, a few large thematic objects right. Entire head visible, generous top margin, essential objects upper two thirds so the art works in a short card crop. No readable text, names, letters, logos, watermark or diagram labels. Friendly learning journey, a visual metaphor not an actual app screenshot. Django staged business system development theme. Character builds a robust lavender modular building from database cylinder foundation upward into admin dashboard blocks, with a mint key representing roles and permissions and a short staircase representing progressive learning. Thoughtful architect pose, tidy plants.
```

### fastapi

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a staged development manual column on a personal technical website. Attached character turnaround is the strict identity reference. Same young male cartoon, tousled short black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and dark neckline, black trousers. Remove sports branding. Refined 2D cel-shaded editorial style, clean contours, warm cream background, lavender and mint with tiny amber accents; match the existing technical garden covers. Character mid-shot left, a few large thematic objects right. Entire head visible, generous top margin, essential objects upper two thirds so the art works in a short card crop. No readable text, names, letters, logos, watermark or diagram labels. Friendly learning journey, a visual metaphor not an actual app screenshot. FastAPI staged API and full stack development theme. Character connects a lavender API server to a mint browser client using a clear lightning-shaped data path, a shield and database nearby. Progressive stepping stones mark the route; energetic focused pose at laptop, restrained technical symbols.
```

### flask

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a staged development manual column on a personal technical website. Attached character turnaround is the strict identity reference. Same young male cartoon, tousled short black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and dark neckline, black trousers. Remove sports branding. Refined 2D cel-shaded editorial style, clean contours, warm cream background, lavender and mint with tiny amber accents; match the existing technical garden covers. Character mid-shot left, a few large thematic objects right. Entire head visible, generous top margin, essential objects upper two thirds so the art works in a short card crop. No readable text, names, letters, logos, watermark or diagram labels. Friendly learning journey, a visual metaphor not an actual app screenshot. Flask lightweight application development theme. Character connecting a few small lavender plug-in modules around a simple mint web application window on a tidy workbench; a small laboratory flask with a sprouting plant symbolizes lightweight growth, plus a compact route staircase. Calm hands-on crafting pose, not chemistry lesson.
```

### python-crawler

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a staged development manual column on a personal technical website. Attached character turnaround is the strict identity reference. Same young male cartoon, tousled short black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and dark neckline, black trousers. Remove sports branding. Refined 2D cel-shaded editorial style, clean contours, warm cream background, lavender and mint with tiny amber accents; match the existing technical garden covers. Character mid-shot left, a few large thematic objects right. Entire head visible, generous top margin, essential objects upper two thirds so the art works in a short card crop. No readable text, names, letters, logos, watermark or diagram labels. Friendly learning journey, a visual metaphor not an actual app screenshot. Python crawler staged learning roadmap theme. Character holding a study notebook beside an upward stepping-stone path through large lavender browser, mint magnifying glass, clock, tiny friendly crawler robot and database icons. Path framed by garden sprouts; a clear progressive technical learning journey, no brand mascot, no real snake.
```
