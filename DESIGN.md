---
name: "自我契约 · 精密计时仪"
description: "深炭绿面板、浅金刻度和清晰读数组成的个人奖励契约界面。"
colors:
  paper: "#151918"
  ink: "#f1f0e8"
  muted: "#b0b3aa"
  rule: "#3c423d"
  accent: "#d4c18b"
  wash: "#232a26"
  success: "#d4c18b"
  error: "#eda89b"
  field: "#1d2320"
  placeholder: "#a3a79e"
  accent-pressed: "#bdaa78"
  dial-track: "#303833"
  dial-minor-tick: "#7c867e"
typography:
  display:
    fontFamily: '"Noto Serif SC", Georgia, serif'
    fontSize: "3.8rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-.03em"
  headline:
    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif'
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif'
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "1rem"
    lineHeight: 1.6
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: ".875rem"
    lineHeight: 1.6
rounded:
  control: "4px"
  primary: "6px"
spacing:
  compact: "4px"
  small: "8px"
  control-gap: "12px"
  row-gap: "16px"
  section: "24px"
  spacious: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.primary}"
    padding: "13px 18px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
  button-primary-active:
    backgroundColor: "{colors.accent-pressed}"
    textColor: "{colors.paper}"
  button-primary-disabled:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    padding: "10px 0"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.paper}"
    rounded: "{rounded.primary}"
    padding: "13px 18px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 12px"
    width: "100%"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  status-label:
    textColor: "{colors.accent}"
    padding: "4px 0 0"
  instrument-row:
    textColor: "{colors.ink}"
    padding: "16px 0"
  progress-dial:
    textColor: "{colors.accent}"
    width: "min(100%, 290px)"
---

# Design System: 自我契约

## Overview

**Creative North Star: “精密计时仪”**

以严肃、安静而清楚的计时仪器感呈现约定。深炭绿承托暖白文字，浅金标出正在读取的进度和时间；层级依靠字号、对齐和细线建立。当前产品名“自我契约”是工作名称。

用户明确选定方案 1「精密计时仪」，拒绝浅色的方案 2「契约文书」。创建、确认、记录和设置均继承同一个深色系统。具体首屏编排留在 `.impeccable/surfaces/public-index-html.md`，本文记录可复用的已实现视觉规则。

**Key Characteristics:**
- 真实比例的刻度圆环与衬线数字读数。
- 暖白主操作、浅金强调、低对比细分隔线。
- 单列手机界面、扁平容器、明确的文字状态。

## Colors

前置 token 是规范值；名称沿用现有 CSS 自定义属性，包括历史命名 `paper`，它现在表示深色背景。

### Primary
- **浅金 / accent**：圆环进度、核心数字、截止时间、当前导航和主按钮悬停。
- **完成金 / success**：完成记录中的勾选，沿用浅金以保持同一语气。
- **按压金 / accent-pressed**：主按钮按下反馈。

### Neutral
- **深炭绿 / paper**：全页和对话框的底色。
- **暖白 / ink**：主要内容、主按钮底色和主刻度。
- **灰绿 / muted**：解释、日期、辅助入口。
- **分隔灰 / rule**：细边框、分隔线、次按钮按下状态。
- **浅层炭绿 / wash**：禁用操作、中断说明、次按钮悬停。
- **输入面 / field、占位灰 / placeholder**：可编辑区域及其示例文字。
- **轨道灰 / dial-track、细刻度灰 / dial-minor-tick**：圆环的未完成部分与次刻度。

错误色 `error` 用于字段错误、危险链接和危险确认按钮，仍附带具体文字说明。

**The Readout Rule.** 浅金用于读数、活动状态和交互反馈；主操作静止时使用暖白底。

## Typography

**Display Font:** Noto Serif SC；中文标题后备为 Songti SC、STSong、serif；数字读数后备为 Georgia、serif。

**Body Font:** 系统无衬线字体，具体顺序见前置 `body` token。没有独立等宽字体。

标题、目标与奖励采用衬线，操作和解释采用无衬线。数字使用 `lining-nums tabular-nums`，保持读数的秩序；正文允许任意长字串换行。

### Hierarchy
- **Display**：圆环的当前天数采用前置 display 角色；分母较小（2.65rem）。手机当前天数（3.45rem）、分母（2.4rem），窄屏进一步收至（3rem / 2.1rem）。总天数达到三位数时统一用（2.8rem / 1.85rem），避免溢出。
- **Headline**：普通页面标题采用 headline；手机标题（1.8rem）。欢迎标题独立使用（2.2rem，行高 1.55），桌面（2.7rem）、手机（1.85rem）、窄屏（1.65rem）。
- **Title**：目标与奖励行采用 title；手机（1.2rem）、窄屏（1.1rem）。次级通用标题为系统无衬线（1.05rem，600，行高 1.5）。
- **Body / Label**：正文和操作以系统字体为主；辅助文字常用（.8125rem、.75rem），手机规则说明最小（.6875rem）。解释段落上限（65ch）。
- **Time**：截止时间采用衬线常规字重（2rem，行高 1.3），手机（1.8rem）。

字体由 `public/fonts/fonts.css` 自托管，`font-display: swap`，声明 400、600、700 三个字重指向同一 UI 子集文件。子集仅覆盖界面中文字与拉丁字母、数字；任意用户输入中未覆盖的字形走本机后备字体，不承诺全字库或三个独立字体文件。来源为 Google Fonts CSS API；许可与出处保存在 `public/fonts/OFL.txt` 和 `public/fonts/SOURCE.txt`（SIL Open Font License 1.1）。

## Layout

单列壳层居中，最大外宽（620px，包含内边距），常规横向留白（40px）。手机断点（480px 及以下）留白（22px）；窄屏（350px 及以下）留白（18px）。桌面断点（800px 起）壳层顶部间距（20px），保持相同阅读宽度。

表单成对字段、备份操作和对话框操作为两列；最窄屏的备份操作改为单列，页脚竖排。顶部、页脚和浮动提示兼顾 safe-area。主要区域的最小高度为视口的六成，文档随内容自然滚动。

标准空间步长在前置 spacing 中；真实布局允许使用已实现的中间值。导航最终间距（4px），每个导航链接最小宽高（44px × 44px）；这里应读取样式表末尾覆盖后的结果。按钮至少（52px）高，文字操作至少（44px）高，输入至少（50px）高。

## Elevation & Depth

界面采用扁平的色面和分隔线，没有卡片投影。原生模态对话框也明确无阴影，通过半透明黑色背景遮罩（`#00000099`）与其边框区分层次。浮动提示使用反色面板，不增加模糊或玻璃效果。

**The Flat Surface Rule.** 复用色面和细边框建立分组，不为常规内容新增悬浮卡片层级。

## Shapes

主按钮与对话框采用前置 primary 圆角，输入、次按钮与提示使用 control 圆角。内容行和记录容器保持直边，通过单像素分隔线定义边界。圆形只承担计量表达；圆环不是背景装饰。

图形资产均为矢量：进度组件由应用生成 SVG，外层语义进度条提供当前值与总值；界面图标为内联 SVG，网站图标是 `public/icon.svg`。当前交付目录不含运行时栅格图，探索效果图留在 `.impeccable/mocks/`，不作为产品页面资产。

## Components

### Buttons

清晰、克制的操作面。主按钮满宽，文字与箭头两端对齐，采用前置主按钮 token；字重（600）。悬停转浅金，按压转按压金。禁用时改为洗色背景、灰绿文字和细边框，内容居中，同时使用真实 `disabled`。

次按钮透明底、细边框，悬停使用 wash 底与浅金边，按压变 rule 底。文字按钮无边框，悬停显示下划线；危险链接用错误色。危险确认按钮沿用主按钮轮廓与通用交互状态，以错误色呈现静止底色。

所有可交互元素使用浅金可见焦点轮廓（2px，外偏移 4px）；不依赖悬停才能辨认操作。

### Inputs / Fields

输入有独立深色色面、细边框和内边距，文本框可纵向调整。错误同时使用 `aria-invalid`、错误边框和字段下方说明，保留已有输入。标签与输入间距（10px）；帮助与错误附着在对应字段下。

### Navigation

当前／记录／设置为文字导航，活动项通过浅金字色与底部细线（2px）识别，并标记 `aria-current`。所有断点保持最小触控面积，最终间距见 Layout。产品名为衬线字标，无装饰性竖线。

### Cards / Containers and Status Labels

内容主要是分隔行，无通用填色卡片：记录上沿细线、确认区上下细线、设置区底部分隔。当前目标与奖励行采用图标标签列加内容列（56px / 剩余，间距 18px），手机（48px / 剩余，间距 16px）。次级状态是浅金纯文字标签（.75rem），不是胶囊。

### Progress Dial

SVG 画布（300 × 300），轨道半径（138），线宽（8）；共 60 条刻度，每 5 条一根主刻度。圆弧从顶部开始，长度严格等于实际连续天数与总天数之比。中心数字仍为 HTML 文本；进度条有可访问名称、最小值、当前值与最大值，装饰 SVG 对辅助技术隐藏。

组件常规宽度见前置 token，手机（252px）、窄屏（230px）。进度变化采用（.25s，`cubic-bezier(.16,1,.3,1)`）；保存回执底色消退（.45s，同曲线），通知透明度变化（.18s，ease-out）。系统减少动态效果时关闭动画和过渡，信息即时更新。

## Do's and Don'ts

### Do:
- **Do** 在所有流程保持选定的深色仪器气质和暖白主操作。
- **Do** 用真实读数驱动圆环比例，用文字同时解释状态。
- **Do** 延续自托管字体子集及本机字形后备，保留字体许可文件。
- **Do** 保留手机触控面积、键盘焦点、长文本换行与减少动态效果支持。

### Don't:
- **Don't** 回到用户明确拒绝的浅色「契约文书」方向。
- **Don't** 用探索效果图替代真实 HTML、按钮或数据读数。
- **Don't** 用任意装饰性进度、假记录、彩色状态胶囊或悬浮卡片改变已实现层级。
