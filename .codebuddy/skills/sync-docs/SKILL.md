---
name: sync-docs
description: |
  Synchronize project documentation with actual codebase state.
  Auto-detects project type (framework template vs regular Tauri/Svelte app) and adapts checks.
  Use when user asks "同步项目文档", "sync-docs", "对齐文档", "检查文档一致性".
---

# Sync Project Documentation (sync-docs) — v2 进化版

自动检测项目类型，对比文档与实际代码的一致性，应用最小化修正。

## 进化点（相比 v1）

| v1 (tauri 原版) | v2 (进化版) |
|---|---|
| 硬编码 6 个文档文件 | 自动检测项目类型，选择对应文档集 |
| Tauri 项目专用（src-tauri/src/） | 支持：框架模板 / Tauri+Svelte / Vue / 通用 Node |
| 检查顺序固定 | 按项目类型优先级动态排序 |
| 提交信息单一 | 提交信息描述具体变更 |

## 项目类型检测

读取项目根目录后自动判断：

| 特征 | 项目类型 | 文档集 |
|------|---------|--------|
| 有 `template/` + `bin/cli.js` + `package.json` 无 `scripts` | **框架模板** | README + AGENTS + CLAUDE |
| 有 `src-tauri/` + `src/` | **Tauri 应用** | README + AGENTS + CLAUDE + CONTEXT + RULES ± DESIGN |
| 有 `src/` + `vite.config.*` 无 `src-tauri/` | **Vue/Svelte 前端** | README + AGENTS + CLAUDE ± DESIGN |
| 其他 | **通用项目** | README + AGENTS + CLAUDE（若存在） |

## Process

### Step 1: 读取文档文件

根据检测到的项目类型，读取对应的文档集。

### Step 2: 代码实际状态扫描

#### 框架模板项目
- 列出 `template/rules/` 中的所有 `.mdc` 文件
- 列出 `template/skills/` 中的所有子目录
- 对比 README "安装了什么" 和 "文件结构" 两处与实际一致
- 对比 CLI `showHelp()` 选项 vs README "选项" 章节
- 对比 `bin/cli.js` 命令列表 vs README "使用" 章节
- 检查 package.json version 在文档中是否有引用

#### Tauri 应用项目
- 列出 `src-tauri/src/` 模块 → 与 README 项目结构 + CLAUDE 模块列表对比
- 列出 `src/pages/` 页面 → 与 README 对比
- 检查 `package.json` / `Cargo.toml` 版本号一致性
- 检查 AGENTS.md 构建命令 → 与 `package.json` scripts 对比
- **Rust .gitignore 检查**：若项目含 `Cargo.toml`，检查 `.gitignore` 是否含 `Cargo.lock`

### Step 3: 识别不一致

逐项对比，标记修复优先级：

| 优先级 | 条件 | 示例 |
|--------|------|------|
| **P0** | README 声称存在但代码中缺失 | README 列了 `ponytail-review/` 但 template/skills/ 中没有 |
| **P1** | CLAUDE.md 模块列表与 README 不一致；Rust 项目 .gitignore 缺少 Cargo.lock 或 Git 仍在跟踪 Cargo.lock | README 新增模块但 CLAUDE 未同步；Cargo.toml 存在但 .gitignore 无 Cargo.lock |
| **P2** | AGENTS.md 构建命令与实际 package.json 不同 | 命令名或参数变更 |
| **P3** | 版本号引用过期 | 文档中版本号 ≠ package.json version |
| **P4** | 描述性文字过时 | "最近完成"、"已知问题" 等时间敏感内容 |

### Step 4: 应用修正

使用 `replace_in_file` 做最小化编辑：
- P0: 从文档中移除不存在的内容（或添加缺失的文档条目）
- P1: 将 CLAUDE 模块列表与 README 对齐；Rust 项目补充 `Cargo.lock` 到 `.gitignore` 并 `git rm --cached Cargo.lock` 移除跟踪
- P2: 更新 AGENTS.md 中的命令
- P3: 更新版本号
- P4: 更新时间敏感描述

### Step 5: 自动提交

```bash
git add <修改过的文件>
git commit -m "docs: 文档对齐 — <具体变更摘要>"
```

若所有文档已一致，跳过提交并报告。
