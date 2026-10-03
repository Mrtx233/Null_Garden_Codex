# 关于页人物插画

- 用途：`/about/` 首屏右侧，窄屏时显示在介绍下方。
- 素材：`src/assets/about-character.png`，1024 × 1536，RGBA 透明背景。
- 制作方式：内置 imagegen，根据用户确认的卡通三视图生成单个人物插画。
- 视觉特征：黑色短发、黑框眼镜、红白球衣、黑色长裤与运动鞋；挥手并手持电脑，朝向左侧介绍。
- 页面输出：通过 Astro Image 生成 WebP 和多尺寸 srcset，保留透明通道；源文件不依赖外部图片服务。

## 生成提示词

```text
Use case: stylized-concept. Asset type: transparent PNG personal website about-page hero illustration. Input image is the approved character turnaround, a strict character identity and illustration style reference. Create ONE polished 2D cartoon illustration of that SAME young man, isolated on a genuinely transparent background, for the RIGHT SIDE of an About Me webpage with text on the LEFT. Single full-body character in an appealing relaxed three-quarter pose gently oriented toward LEFT, friendly slight smile, head turned toward viewer. Preserve exactly recognizable tousled short black hair, thick black rectangular glasses, warm skin, face, white long-sleeve football jersey with distinctive curved red stripes edged in black, dark grey undershirt neckline and hem, loose black trousers, black-and-white sneakers. Preserve the hand-drawn crisp outlines and refined soft cel shading of the turnaround. Maintain mildly chibi proportions from the reference, not extreme giant head. One hand gives a small welcoming wave near shoulder, other arm holds a slim closed dark laptop at the hip with a tiny unobtrusive violet accent, no brand on laptop. Natural accurate fingers and relaxed silhouette. Keep original small simplified chest emblems without adding slogans or names. Complete hair, hands and feet visible with ample transparent margin and no cropping. Composition vertically balanced, character centered in tall portrait canvas, suitable to display about 350-430px tall next to personal bio. No written labels, no diagram, no turnaround, no additional characters, no room, no chair, no solid background, no background scene, no watermark, no typography. Ensure authentic transparent alpha, smooth clean edges, readable on both warm off-white and dark navy webpage backgrounds.
```
