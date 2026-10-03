# 全部文章与项目封面补齐

本次用内置 imagegen，参考已确认角色三视图，补齐文章 01–06 和项目 01–06。人物、配色与已有项目封面一致，每篇内容使用独立主题插画。素材保存至 `src/assets/posts/` 和 `src/assets/projects/`。

## 使用与维护

- 首页展示全部非草稿文章和项目，不再截取六条；文章按最新规则排序，项目按编号倒序。
- `src/data/postVisuals.ts`、`src/data/projectVisuals.ts` 按文件编号映射封面。
- `CoverImage.astro` 统一输出多尺寸 WebP，图片延迟加载；`PostCover.astro` 和 `ProjectCover.astro` 分别关联文章与项目。
- 新增内容未配置专属封面时，文章暂用学习主题、项目暂用架构主题默认封面，补充映射后自动使用专属图片。
- 首页带配图的卡片使用统一高度，窄屏保持原生横向滑动。

## 完整生成提示词

### project-01

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Fuzzy spreadsheet search theme. Character uses a mint magnifying glass to find similar rows in several floating lavender spreadsheet pages; the matching rows group into a tidy folder with a small download arrow. Tidy research desk.
```

### project-02

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Government news collection theme. Character at laptop collecting a few abstract public notice papers from a stylized civic building into a lavender archive via mint connected pipeline nodes. Organized document research scene, no seals or flags.
```

### project-03

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Gym membership management theme. Character at reception desk coordinating membership passes, a simple dumbbell, mint class schedule and lavender gym storefront icon. Welcoming fitness administration, character remains in reference outfit.
```

### project-04

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Football club management theme. Character holding a clipboard, beside a lavender football tactics board with mint player positions and a football. Clean organized club planning theme, same reference outfit.
```

### project-05

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Cosplay event and booking services theme. Character coordinating a mint event calendar, lavender admission ticket, camera and small theatre mask at a clean creative event desk. Friendly creative services, reference character outfit unchanged.
```

### project-06

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Modular fitness platform security theme. Character assembling connected lavender backend and mint frontend modules around a gym dumbbell icon, with a large shield and database cylinder. Clean protected business platform metaphor, reference outfit unchanged.
```

### post-01

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Complete web crawling knowledge theme. Character studies a large lavender browser page, follows mint arrows through request, parsing magnifying glass and database icons, using a tidy open study notebook. A clear learning journey metaphor.
```

### post-02

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Advanced crawler concurrency theme. Character conducting three parallel mint data streams from lavender browser nodes into one organized server stack, with a small clock and balanced queue blocks. Precise engineering scene, no spider creatures.
```

### post-03

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. String and byte encoding theme. Character sorting a row of abstract text glyph tiles through a lavender transformation bridge into neat mint byte blocks. Add small paper and conversion arrows, clarity of representation, no readable text or digits.
```

### post-04

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Encryption fundamentals theme. Character carefully holding a mint key beside a large lavender lock and two matching key shapes, with abstract data packets moving through a shield between two devices. Warm educational encryption metaphor, no hacker imagery.
```

### post-05

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Browser automation and element location theme. Character pointing with a mint cursor pointer at a highlighted block inside a large lavender browser window, with a magnifying glass and small connected automation gear. Accurate visual concept, no real browser brand, no text.
```

### post-06

```text
Use case: stylized-concept. Asset: one landscape 1536x1024 cover illustration for a personal technology website, coherent with a lavender and mint technical garden visual identity. The attached approved turnaround is the strict CHARACTER IDENTITY reference. Same young male cartoon, tousled black hair, thick black rectangular glasses, white jersey with curved red sleeve stripes and charcoal neckline, black trousers. Remove sports branding. Refined 2D cel shading, clean ink outlines, warm cream background, lavender, mint and tiny amber accents. Character mid-shot on left, a few large clear theme objects on right. Keep entire head visible with generous upper margin, important objects in upper two thirds, readable small, harmonious simple composition. Not a real application screenshot. No readable text, letters, logos, watermark or legends. Scrapy framework engineering theme. Character assembling three lavender crawler workflow blocks: browser requests, a mint parsing funnel, organized output papers and database; a small friendly mechanical crawler robot nearby. Tidy robust pipeline learning metaphor, no readable code or labels.
```
