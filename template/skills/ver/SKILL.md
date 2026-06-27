---
name: ver
description: 执行版本同步脚本（npm run ver），自动分析 git 提交记录按语义化版本规则升级版本号。当用户说"升级版本""bump version""运行版本同步"或类似含义时触发。
argument-hint: "可选：手动指定版本号，如 0.2.0"
---

# 版本同步 (ver)

执行 `scripts/sync-version.js` 版本同步脚本。

## 调用方式

### 自动分析（默认）
```
npm run ver
```
- 分析自最近 tag 以来的 git 提交记录
- 按 Conventional Commits 类型决定升级幅度：BREAKING → major, feat → minor, fix → patch
- docs/refactor/chore → 不升版
- 开发分支自动追加 `-dev` 后缀，强制 PATCH 升级，跳过 git tag 和 commit
- master 分支自动剥离 `-dev` 后缀后分析
- 同步 `package.json` / `tauri.conf.json` / `Cargo.toml` 三个文件
- 防重复机制：检查最近提交和 tag 是否已存在

### 手动指定版本
```
npm run ver -- X.Y.Z
```
- 直接设置指定版本号
- 开发分支自动追加 `-dev` 后缀

## 同步的文件

| 文件 | 说明 |
|------|------|
| `package.json` | `version` 字段 |
| `src-tauri/tauri.conf.json` | `version` 字段 |
| `src-tauri/Cargo.toml` | `[package]` 下的 `version` 行 |

## 输出说明

脚本执行后会打印：
- 当前分支和版本
- 提交统计（BREAKING/feat/fix/other）
- 升降级类型和结果版本
- 文件同步状态
- git tag 创建状态（master 分支）

## 版本规则

| Commit 类型 | 版本变动 |
|-------------|---------|
| BREAKING CHANGE | 🔺 major |
| feat | 🔺 minor |
| fix | 🔺 patch |
| docs/refactor/chore | ❌ 不升版 |

## 边界行为

- 仅 webstorm/idea 提交（`^Merge branch` 等合并提交）不会影响版本
- 开发分支（非 main/master）仅允许 PATCH 升级，合并到 main 后再完整升版
- 行尾已统一处理：Cargo.toml → LF，tauri.conf.json → LF，package.json → CRLF（兼容其他工具）
