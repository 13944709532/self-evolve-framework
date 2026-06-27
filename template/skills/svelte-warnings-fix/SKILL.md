---
name: fix:svelte-warnings
description: Read vite-plugin-svelte diagnostics from the IDE and automatically fix detected issues (a11y, unused CSS, deprecated syntax). Use when the user mentions vite-plugin-svelte warnings, Svelte a11y errors, unused CSS selectors, Svelte build warnings, or asks to fix Svelte component issues from vite build output.
---

# Svelte Warnings Fix

## Quick start

```svelte
<!-- ✅ 正确修复：加 ARIA 属性 -->
<div role="dialog" aria-modal="true" tabindex="-1" onclick={handler}>

<!-- ✅ 不可避免时用 svelte-ignore -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={(e) => e.stopPropagation()}>
```

## Diagnostics collection (dual channel)

1. **Fast path** — `read_lints(paths="d:/code/sheetflow/src")` 读 IDE 实时诊断（~0s）
2. **Fallback** — 如果 read_lints 未捕获到，运行 `npm run build 2>&1` 取构建输出

Diagnostics 按类型分类：
- **A11y** — `a11y_no_static_element_interactions`, `a11y_interactive_supports_focus`, `a11y_click_events_have_key_events` 等
- **Unused CSS** — `Unused CSS selector "..."`
- **Deprecated syntax** — Svelte 5 迁移提示
- **Type errors** — TS 编译失败

## Fix order & verification

批量处理同类问题，而非逐条 rebuild：

```
Collect all A11y warnings → fix all → rebuild once to verify
Collect all unused CSS   → fix all → rebuild once to verify
Collect all type errors  → fix all → rebuild once to verify
```

每类修复后只用一次 `npm run build` 验证，而非每条警告 rebuild 一次。

## Fix rules by category

### 1. A11y issues

参照表决定修复方式：

| 警告 | 正确修复 | svelte-ignore 条件 |
|------|---------|-------------------|
| `a11y_no_static_element_interactions` | 加 `role` 属性 | 当元素仅用于 stopPropagation 包装时 |
| `a11y_interactive_supports_focus` | 加 `tabindex="-1"` 或 `tabindex="0"` | 元素不可聚焦（纯装饰） |
| `a11y_click_events_have_key_events` | 加 `onkeydown` 处理器 | 当 click 仅用于非交互场景时 |
| `a11y_no_noninteractive_element_interactions` | 替换为非交互元素或加 role | 很少需要 ignore |

Svelte 5 的 `svelte-ignore` 注释格式：

```svelte
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onclick={handler}>
```

> **原则**：优先正确修复（加 role/tabindex/aria-label），仅在确实不可避免时用 `svelte-ignore`。

### 2. Unused CSS

- 如果选择器在 template/JS 中确实未引用 → **删除该选择器或整个 `<style>` 块**
- 如果只在运行时由 JS 动态添加 → 用 `:global(.selector) { }` 包裹

### 3. Deprecated syntax

严格遵循项目 Svelte 5 编码规范（工作区规则）：

| 旧语法（Svelte 4） | 新语法（Svelte 5） |
|---|---|
| `export let name` | `let { name } = $props()` |
| `$: double = count * 2` | `let double = $derived(count * 2)` |
| `$: { effect }` | `$effect(() => { effect })` |
| `on:click` handler | `onclick` prop |

### 4. Type errors

与 `rust-auto-fix` 技能协作：Svelte 模板中的 TS 类型错误由本技能修复，.ts 文件中的由 `rust-auto-fix` 处理。

## Final report

```
## Svelte warnings resolved

Total warnings fixed: X

Changes made:
- file.svelte: fixed a11y (added role="dialog" tabindex="-1")
- file.svelte: removed unused CSS selector ".config-field label"
```
