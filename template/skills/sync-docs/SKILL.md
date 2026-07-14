---
name: sync-docs
description: |
  Synchronize project documentation files (README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, RULES.md, DESIGN.md)
  to ensure consistency. Use when user asks "同步项目文档", "sync-docs", "对齐文档", "检查文档一致性".
---

# Sync Project Documentation (sync-docs)

Keep project documentation consistent with each other and the current codebase.

## Purpose

These files serve different but overlapping roles:

| File | Role | Audience |
|------|------|----------|
| README.md | Project overview & quick start | New developers |
| AGENTS.md | AI agent project guidance & build commands | AI assistants & developers |
| CLAUDE.md | AI agent constraints & rules summary | AI assistants |
| CONTEXT.md | Architecture decisions & history | Developers & AI |
| RULES.md | Detailed coding rules & conventions | All developers & AI |
| DESIGN.md | Design context (optional) | Designers & developers |

## Process

### Step 1: Identify existing doc files

Check which of the six files exist in the project root. Only sync files that exist.

### Step 2: Read codebase for actual state

- Rust 项目检测：若存在 `Cargo.toml` 或 `src-tauri/`，检查 `.gitignore`
- New modules in `src-tauri/src/` or `src/` → verify README project structure
- New pages in `src/pages/` → verify README
- Build commands in `package.json` `scripts` field → verify AGENTS.md
- `package.json` version → verify consistency in docs

### Step 3: Identify inconsistencies

Compare across files:
- Module lists → README ≡ CLAUDE
- Build commands → AGENTS.md ≡ README ≡ package.json
- Coding rules → RULES.md as authoritative source
- Architecture → CONTEXT.md reflects current state
- Version number → consistent everywhere

#### Rust 项目 .gitignore 补充

若项目含 `Cargo.toml` 或 `src-tauri/`（即使用 Rust），自动检查 `.gitignore`：

- 若 `.gitignore` 中 **没有** `Cargo.lock` 行 → 追加 `Cargo.lock` 到 `.gitignore` 末尾，并执行 `git rm --cached Cargo.lock` 移除已跟踪的 `Cargo.lock`
- 若 `.gitignore` 已有 `Cargo.lock` 但 Git 仍在跟踪该文件 → 执行 `git rm --cached Cargo.lock`
- 若两者均已处理 → 跳过

> Tauri 项目的 `Cargo.lock` 不应提交到版本控制（库项目），框架项目同理。

### Step 4: Apply minimal fixes

Priority order: README → AGENTS → CLAUDE → RULES → CONTEXT → DESIGN

### Step 5: Auto-commit

```bash
git add <modified-files>
git commit -m "docs: sync docs after project changes"
```

Skip commit if no files changed.
