# Self-Evolve Framework 项目约束

> 本文件为 AI 代理提供项目级约束和上下文信息。

## 项目身份

这是一个 **npm CLI 工具包**，非传统 Web/桌面应用。核心工作流：修改模板 → 发布 npm → 目标项目 `npx` 安装。

## 硬性约束

### 禁止事项
- **不要在此仓库运行 `npm run build`、`cargo check`、`npm run ver`** — 这些是目标项目的脚本
- **不要修改 `bin/cli.js` 的 `sync()` 函数** — 它委托给 `init()`，这是设计意图
- **不要在 package.json 中添加 `scripts`** — 模板包无需构建脚本
- **不要添加第三方依赖** — CLI 只用 Node.js 内置模块（`fs`、`path`、`url`）

### 必须遵守
- **模板变更 = README 同步**：template/ 下的 skill 或 rule 增删，必须在 README.md 的"安装了什么"和"文件结构"两处同步
- **规则新增 = 放入正确子目录**：通用 → `always/`，Rust → `rust/`，Svelte → `svelte/`，Tailwind → `tailwind/`
- **CLI 选项变更 = 双处同步**：`bin/cli.js` 的 `showHelp()` 和 README.md 的"选项"章节必须一致
- **版本号**：统一由 `package.json` 的 `version` 字段管理，npm publish 前手动更新

## 模块速览

| 文件 | 职责 |
|------|------|
| `bin/cli.js` | CLI 入口：init（安装，含技术栈检测）、sync（同步）、list（列表）、help |
| `template/rules/always/` | 7 个通用规则（始终安装） |
| `template/rules/rust/` | 5 个 Rust/Tauri 规则（按需安装） |
| `template/rules/svelte/` | 2 个 Svelte 规则（按需安装） |
| `template/rules/tailwind/` | 1 个 Tailwind 规则（按需安装） |
| `template/skills/skillopt-sleep/` | 离线进化分析引擎 |
| `template/skills/impeccable/` | 设计质量审计工具 |
| `template/skills/sync-docs/` | 项目文档同步技能（自动检测不一致） |

## 文档对齐规则

本项目的文档对齐由 `sync-docs` skill 管理。触发后会：
1. 对比 README.md 中声称的模板内容 vs template/ 目录实际内容
2. 对比 CLI `showHelp()` 输出 vs README.md 选项章节
3. 检查 AGENTS.md ↔ CLAUDE.md 约束一致性
4. 检查 package.json version ↔ 文档中版本引用
