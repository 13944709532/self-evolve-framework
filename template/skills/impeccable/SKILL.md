---
name: impeccable
description: AI 前端设计质量审计。检测 UI 反模式、可访问性、布局一致性。扫描 html/css/jsx/tsx/vue/svelte 文件。
---

# Impeccable — 前端设计质量审计

> CodeBuddy 适配版（纯指令模式，底层调用 `npx impeccable` 执行）。

## 核心命令

通过在对话中输入以下命令触发。执行时会调用 `npx impeccable <command>` 底层 CLI。

| 对话输入 | 作用 | 底层调用 |
|----------|------|---------|
| `impeccable audit` | 五维度技术质量检查（P0-P3 严重性分级） | `npx impeccable audit` |
| `impeccable critique` | 设计评审（评分 + 可用性测试） | `npx impeccable critique` |
| `impeccable polish` | 页面最终润色打磨 | `npx impeccable polish` |
| `impeccable detect` | 自动检测反模式 | `npx impeccable detect` |
| `impeccable layout` | 修复布局、间距和视觉节奏 | `npx impeccable layout` |
| `impeccable typeset` | 修复排版问题 | `npx impeccable typeset` |
| `impeccable colorize` | 为单色界面添加颜色 | `npx impeccable colorize` |
| `impeccable clarify` | 重写混淆的 UX 文案 | `npx impeccable clarify` |
| `impeccable distill` | 简化界面，去除多余元素 | `npx impeccable distill` |
| `impeccable harden` | 使界面更健壮（处理边界情况） | `npx impeccable harden` |
| `impeccable optimize` | 诊断并修复 UI 性能问题 | `npx impeccable optimize` |
| `impeccable init` | 创建设计上下文（PRODUCT.md + DESIGN.md） | `npx impeccable init` |
| `impeccable craft` | 设计并构建一个新功能 | `npx impeccable craft` |
| `impeccable shape` | 生成设计简报 | `npx impeccable shape` |

## 质量分级

```
P0（阻断）→ 修复后才能继续
P1（严重）→ 当前会话修复
P2（一般）→ 记入记忆，下次处理
P3（建议）→ 记入记忆，下次处理
```

## 设计上下文

`impeccable init` 生成 `PRODUCT.md` 和 `DESIGN.md`。这两份文件作为设计上下文，能让后续审计更精准。

## 在工作流中的位置

详见 `.codebuddy/rules/self-evolve.mdc` 步骤 3（自动验证）：
每次修改前端文件后，自动检查设计质量，仅当发现 P0/P1 问题才中断流程。
