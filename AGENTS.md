# AGENTS.md — Self-Evolve Framework

> AI 代理项目指南 · 最后更新: 2026-07-14

## 项目概述

Self-Evolve Framework 是一个 **CodeBuddy IDE 自我进化飞轮工具包**，以 npm 包形式分发。通过 `npx self-evolve-framework init` 将 skill + 规则一键安装到目标项目中，形成 post-edit 验证 → 错误记忆 → 规则推荐的闭环。

## 仓库结构

```
self-evolve-framework/
├── bin/cli.js            # CLI 入口（init / sync / list / help）
├── template/             # 模板文件（安装时复制到目标项目）
│   ├── rules/            # .mdc 规则文件 → 目标 .codebuddy/rules/
│   └── skills/           # skill 目录 → 目标 .codebuddy/skills/
├── package.json          # v1.6.0
├── CLAUDE.md             # AI 项目约束
├── AGENTS.md             # 本文件
└── README.md             # 用户文档（npm 页面）
```

## 构建与发布

```bash
# 无构建步骤（纯静态模板 + 脚本）
# 发布到 npm
npm publish

# 本地测试
node bin/cli.js init --dry-run
node bin/cli.js list
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

1. **模板内容变更必须在 README 中同步更新**："安装了什么" 和 "文件结构" 两个章节
2. **CLI 选项变更必须在 README "选项" 章节和 `showHelp()` 函数中同步**
3. **不在此仓库中运行 npm run check / cargo check** — 这是模板包，无源码编译
4. **.gitignore 保持简洁**：仅 node_modules/、*.tgz、*.txt、日志文件、.DS_Store
5. **版本号唯一来源**：`package.json` 的 `version` 字段

## 自定义指令

当用户说以下关键词时，触发对应的技能/操作：

| 关键词 | 操作 |
|--------|------|
| `同步项目文档` / `sync-docs` / `对齐文档` | 调用 `sync-docs` 技能，同步 README / AGENTS / CLAUDE 与模板实际内容 |
| `发布` / `publish` | 确认后执行 `npm publish` |
| `查看模板` / `list` | 等价于 `npx self-evolve-framework list` |
