---
name: fix:rust-auto
description: Read Rust plugin (rust-analyzer) diagnostics from the IDE and automatically fix detected issues. Use when the user mentions Rust errors, type mismatches, cargo check failures, compiler warnings, rust-analyzer problems, or asks to fix Rust compilation issues in the src-tauri directory.
---

# Rust Auto-Fix

## Diagnostics collection (dual channel)

1. **Fast path** — `read_lints(paths="d:/code/sheetflow/src-tauri")` 读 IDE 实时诊断
2. **Confirmation** — `cd d:/code/sheetflow/src-tauri && cargo check 2>&1` 获取编译器真实输出

## Categorize

按严重程度分组：

- **Config/Macro errors** — `proc macro panicked`（非代码问题）
- **Code errors** — type mismatches, borrow checker, missing items
- **Warnings** — unused imports, unnecessary `mut`, dead code
- **Hints** — cargo fix suggestions

## Fix workflow

### Phase A: Auto-fix warnings with `cargo fix`

先跑 `cargo fix` 自动处理可修复的 warning，大幅减少手动工作：

```
cd d:/code/sheetflow/src-tauri && cargo fix --lib -p sheetflow --allow-dirty 2>&1
```

完成后 re-check 确认剩余警告。

### Phase B: Handle config/macro errors

`proc macro panicked` 通常是外部原因，不是 Rust 代码问题：

| 错误信息 | 非代码原因 | 处理方式 |
|----------|-----------|---------|
| `frontendDist` 路径不存在 | 前端未构建 | `npm run build` 创建 `build/` |
| `identifier` 格式错误 | `tauri.conf.json` 配置 | 手动检查配置文件 |
| 其他 macro panic | 依赖版本或配置 | 优先检查外部因素再怀疑代码 |

当确认是前端构建问题时，可以调用 `svelte-warnings-fix` 协作修复。

### Phase C: Fix code errors (one category at a time)

按优先级批量处理同类错误，同类修复完再 rescan：

1. **Type mismatches** — `expected X, found Y`
2. **Borrow checker** — `cannot borrow`, `cannot move`
3. **Missing items** — `not found`, `unresolved import`
4. **Other errors**

修复模式：
1. `read_file` 定位错误行
2. 理解上下文
3. `replace_in_file` 最小改动
4. 同类全部修完后 → `cargo check` 全量验证

### Phase D: Handle remaining warnings

对 `dead_code` 警告，按规则决定处理方式：

| 场景 | 做法 |
|------|------|
| `pub struct` 公开 API 的字段 | `#[allow(dead_code)]` 保留 |
| `pub struct` 公开 API 的整个 struct | `#[allow(dead_code)]` 保留 |
| 私有 struct/函数，确定未用 | 删除代码 |
| `pub fn` Tauri 命令参数（如 `_cache`） | 保留或用 `_` 前缀命名 |
| `cache.rs` 整模块未用 | 加 `#![allow(dead_code)]` 模块级注解 |

### Phase E: Final verification

```
cargo check 2>&1
```

确认零错误零警告后输出最终报告。

## Final report

```
## Rust diagnostics resolved

[cargo-fix]  cargo fix 自动处理: X 项
[manual]  手动修复类型错误: Y 项
[allow]   添加 #[allow(dead_code)]: Z 处

Changes:
- file.rs: cargo fix 自动处理
- file.rs: 手动修复 mismatched types
- file.rs: 添加 #[allow(dead_code)]
```
