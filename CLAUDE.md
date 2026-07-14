# Self-Evolve Framework 项目约束

> 本文件为 AI 代理提供项目级约束和上下文信息。

## 项目身份

这是一个 **npm CLI 工具包**，非传统 Web/桌面应用。核心工作流：修改模板 → 发布 npm → 目标项目 `npx` 安装。

## 硬性约束

### 禁止事项
- **不要在此仓库运行 `npm run build`、`cargo check`、`npm run ver`** — 这是 Skill 包，无编译目标
- **不要添加第三方依赖** — CLI 只用 Node.js 内置模块
- **不要在 package.json 中添加 `scripts`** — 零构建步骤

### 必须遵守
- **规则/技能变更 = README 同步**：rules/ 或 skills/ 增删，必须在 README 的"安装了什么"和"文件结构"两处同步
- **规则新增 → `rules/knowledge/`** — 按语言/框架分文件，通过 `alwaysApply` 控制激活
- **CLI 变更 = 三处同步**：`src/cli/` 实现、`showHelp()`、README
- **版本号**：统一由 `package.json` 的 `version` 字段管理

## 模块速览

| 文件 | 职责 |
|------|------|
| `bin/self-evolve.js` | CLI 入口壳 → `src/cli/index.js` |
| `src/cli/commands/init.js` | 安装/升级引擎 |
| `src/cli/commands/upgrade.js` | 升级逻辑（孤儿清理 + 贡献检测 + GitHub issue） |
| `src/cli/commands/auth.js` | GitHub Device Flow 认证 |
| `src/cli/commands/list.js` | 规则/技能清单 |
| `rules/self-evolve.mdc` | 进化编排 always 规则 |
| `rules/ponytail.mdc` | 代码最小化原则 |
| `rules/knowledge/` | 10 个文件（含 README.md 索引 + 9 个规则文件） |
| `rules/renames.json` | 旧→新文件名映射（升级模式用） |
| `skills/skillopt-sleep/` | 离线进化分析引擎（SKILL.md + src/ + configs/） |
| `skills/impeccable/` | 设计质量审计（SKILL.md + src/ + reference/） |
| `skills/sync-docs/` | 项目文档同步技能 |

## 文档对齐规则

本项目的文档对齐由 `sync-docs` skill 管理。触发后会：
1. 对比 README.md 中声称的规则/技能 vs rules/ skills/ 目录实际内容
2. 对比 CLI `showHelp()` 输出 vs README "选项" 章节
3. 检查 AGENTS.md ↔ CLAUDE.md 约束一致性
4. 检查 package.json version ↔ 文档中版本引用

## 自我进化（always 激活）

统一由 `.codebuddy/rules/self-evolve.mdc` 编排。
调度 Ponytail（代码最小化）+ CodeGraph（依赖分析）+ Skillopt-Sleep（离线进化）+ Impeccable（设计质量）
→ 形成 **post-edit 验证 → 错误记忆 → 规则推荐** 闭环。

