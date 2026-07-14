# AGENTS.md — Self-Evolve Framework

> AI 代理项目指南 · 最后更新: 2026-07-14

## 项目概述

Self-Evolve Framework 是一个 **CodeBuddy IDE 自我进化飞轮工具包**，以 npm 包形式分发。通过 `npx self-evolve-framework` 将 skill + 规则一键安装到目标项目中，形成 post-edit 验证 → 错误记忆 → 规则推荐的闭环。

## 仓库结构

```
self-evolve-framework/
├── bin/self-evolve.js    # CLI 入口壳 → src/cli/
├── src/cli/              # 命令中枢（init/upgrade/auth/list）
├── rules/                # 规则（直接消费，安装→ .codebuddy/rules/）
├── skills/               # 技能（直接消费，安装→ .codebuddy/skills/）
├── docs/                 # 架构文档 + 变更日志
├── package.json          # v1.6.1
├── CLAUDE.md / AGENTS.md / LICENSE
└── README.md
```

## 构建与发布

```bash
# 无构建步骤（纯 Node.js + Python 引擎）
# 发布到 npm
npm publish

# 本地测试
node bin/self-evolve.js --dry-run
node bin/self-evolve.js list
```

## 模板内容

### 规则（rules/）

顶层编排 + 经验知识库双层结构：

**顶层（always 激活）**
| 文件 | 用途 |
|------|------|
| `self-evolve.mdc` | 进化编排 — 调度 Ponytail + CodeGraph + Skillopt-Sleep + Impeccable |
| `ponytail.mdc` | 代码最小化原则 |

**`knowledge/` — 经验知识库（按语言/框架分目录，源自 Tauri 等项目沉淀）**
| 文件 | 用途 | 加载方式 |
|------|------|---------|
| `general.mdc` | 跨语言通用约束（命名原则、强制规则、多发模式） | always |
| `typescript.mdc` | TS/JS 前端语言层 | 按需 |
| `vue.mdc` | Vue 框架层 | 按需 |
| `ant-design-vue.mdc` | ant-design-vue 组件库层 | 按需 |
| `svelte.mdc` | Svelte 5 框架层 | 按需 |
| `tailwind.mdc` | Tailwind CSS v4 框架层 | 按需 |
| `shadcn-svelte.mdc` | shadcn-svelte 组件库层 | 按需 |
| `rust.mdc` | Rust 后端层 | 按需 |
| `tauri.mdc` | Tauri 框架层 | 按需 |

各 `.mdc` 文件通过 `alwaysApply` 控制激活：`true` = 始终激活，`false` = 按需加载。

### 技能（skills/）
| 目录 | 用途 |
|------|------|
| `skillopt-sleep/` | 离线进化分析引擎（Python 脚本 + 提示词模板） |
| `impeccable/` | 设计质量审计（JavaScript 脚本 + 参考文档） |
| `sync-docs/` | 项目文档自动对齐（检测 README/AGENTS/CLAUDE 不一致） |

## 关键约束

1. **规则/技能变更必须在 README 中同步更新**："安装了什么" 和 "文件结构" 两个章节
2. **CLI 选项/命令变更 = 三处同步**：`showHelp()`、README、AGENTS
3. **不在此仓库中运行 npm run build / cargo check** — 这是 Skill 包，零依赖无编译
4. **规则新增放入 `rules/knowledge/`** — 按语言/框架分文件
5. **版本号唯一来源**：`package.json` 的 `version` 字段

## 自定义指令

当用户说以下关键词时，触发对应的技能/操作：

| 关键词 | 操作 |
|--------|------|
| `同步项目文档` / `sync-docs` / `对齐文档` | 调用 `sync-docs` 技能，同步 README / AGENTS / CLAUDE 与实际代码 |
| `发布` / `publish` | 确认后执行 `npm publish` |
| `查看模板` / `list` | 等价于 `self-evolve list` |
| `升级` / `update` | 等价于 `self-evolve`（默认安装/升级） |
| `认证` / `auth` | 等价于 `self-evolve auth` |
