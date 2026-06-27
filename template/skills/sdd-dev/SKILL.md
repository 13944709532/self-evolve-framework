---
name: sdd-dev
description: |
  Spec-Driven Development — generate code from PRD/idea via a structured DESIGN.md spec.
  Use when the user asks to "generate frontend code", "design a page", "create a component",
  "按照规范生成", or any feature request that needs both spec and implementation.
---

# Spec-Driven Development (SDD)

流程：需求 → 规范（DESIGN.md）→ 审批 → 代码生成 → 自检

## Phase A: 理解输入

收集设计线索。输入可以是以下任意组合：

1. **PRD / 需求描述** — 功能列表、用户故事
2. **参考 URL** — 可访问的线上页面
3. **截图/设计稿** — 描述你看到的布局和风格
4. **品牌名称 / 关键词** — 如"工务平台"、"数据分析"
5. **已有组件库** — 如 ant-design-vue

如果输入稀疏，使用以下项目已有设计线索作为 fallback：
- `:root` CSS 变量（App.vue）：颜色、字体、圆角、间距
- `RULES.md`：设计约束（统一风格、响应式强制、多页面一致性）
- 现有页面样式作为参考

**在此阶段不要生成任何代码。**

## Phase B: 输出 DESIGN.md

产出一份完整的设计规范文档，存放在 `docs/design/` 目录下，包含以下 **9 个章节**：

### 1. 色彩（Color）
- 主色调、辅助色、语义色（成功/错误/警告）
- 引用 `:root` 已有的 `--primary-color` / `--success-color` 等变量
- 禁止引入全新的颜色体系，除非确实必要

### 2. 字体（Type）
- 使用 `var(--font-sans)` 和 `var(--font-mono)`
- 字号层级：`--font-size-xs/sm/base/lg/xl`
- 行高、字重

### 3. 组件（Component）
- 使用 ant-design-vue 组件优先
- 自定义组件的样式继承 `:root` token
- 每个组件的状态：默认、悬停、禁用、加载

### 4. 布局（Layout）
- 使用 CSS Grid / Flexbox
- 响应式断点：`820px` / `480px`
- 间距使用 `var(--space-xs/sm/md/lg/xl)`

### 5. 动效（Motion）
- 过渡时长：0.15s / 0.2s / 0.3s
- 缓动函数：ease-in-out
- 悬停效果：translateY(-2px) + box-shadow

### 6. 深度（Depth）
- 阴影层级：卡片（sm）、弹窗（md）、Drawer（lg）
- Z-index 层级约定

### 7. 最佳实践 & 禁止事项（Do's & Don'ts）
- 做：引用 `:root` 变量、用设计 token
- 不做：硬编码颜色/尺寸、在 scoped 中定义新 token

### 8. 响应式（Responsive）
- 820px：侧栏折叠、2 列变 1 列
- 480px：字体缩小、触控友好的点击区域（≥44px）

### 9. 无障碍（Accessibility）
- 颜色对比度
- 焦点可见
- 语义化 HTML

**将 DESIGN.md 展示给用户审批前，不允许进入 Phase C。**

## Phase C: 代码生成

严格遵循已审批的 DESIGN.md 生成代码。

### 代码质量自检清单（100 分制）

| 检查项 | 分值 | 说明 |
|--------|------|------|
| 使用 `:root` 变量而非硬编码值 | 15 | 颜色、字体、间距、圆角必须用 var() |
| 响应式布局 | 15 | 820px 和 480px 下正常 |
| 组件复用 | 10 | 优先使用 ant-design-vue 已有组件 |
| 语义化 HTML | 10 | 正确使用 header/main/section/nav |
| CSS 使用 token | 10 | 无硬编码尺寸 |
| 悬停/聚焦效果 | 10 | 所有可交互元素有视觉反馈 |
| 动画过渡 | 10 | 适当使用 transition |
| 无重复样式 | 10 | 无相同值重复声明 |
| 命名规范 | 5 | 组件 PascalCase 等 |
| 无障碍基础 | 5 | focus-visible、aria 属性 |

得分低于 70 分时必须修改。

### diff 审计（如果提供了参考 URL）
将生成代码与参考页面的截图或描述进行对比，标注差异。

## 文件产出位置

```
src/pages/      — 新页面
src/components/ — 新组件
docs/design/    — DESIGN.md 规范文档
```

## 参考

- 项目设计 token：App.vue `:root` 变量
- 设计约束：`RULES.md`
- 组件库：ant-design-vue（已全局注册）
