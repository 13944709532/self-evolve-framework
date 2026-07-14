# Self-Evolve Framework

> **CodeBuddy IDE** 自我进化飞轮 — Post-Edit 验证闭环 + 规则自动推荐 + 离线进化分析
>
> ⚠️ 此包专为 [CodeBuddy](https://www.codebuddy.ai) 设计，依赖 `.codebuddy/rules/` 和 `.codebuddy/skills/` 目录结构，非 CodeBuddy 环境无效。

## 由来

维护了两个项目，各自打磨了一套 Skill 规则。每次改进都要在两边重复复制粘贴，很快变得难以同步。直到 AI 建议："为什么不打包成 npm 包？"

于是有了 Self-Evolve Framework。

一套规则，`npx` 即用，两边同步，不再需要手动搬运。

这本质上是一个私人工具箱——觉得好用的 Skill、好用的规则，会持续往里集成。方便自己，也顺手方便别人。

## 安装

```bash
# npx（推荐，零安装）
npx self-evolve-framework init
```

### 选项

```bash
# 指定项目路径
npx self-evolve-framework init --project ./my-app

# 预览模式（不写入任何文件）
npx self-evolve-framework init --dry-run

# 跳过 CLAUDE.md 更新
npx self-evolve-framework init --skip-claude-md

# 跳过 Impeccable 设计质量工具安装
npx self-evolve-framework init --skip-impeccable
```

## 安装了什么

CLI 自动检测目标项目的技术栈，按需安装规则。

### 始终安装（7 个通用规则）

```
.codebuddy/
├── rules/
│   ├── self-evolve.mdc           ← 进化编排（always 激活）
│   ├── ponytail.mdc              ← 代码最小化原则
│   ├── windows-cmd.mdc           ← Windows CMD 命令兼容
│   ├── powershell.mdc            ← PowerShell UTF-8 编码
│   ├── error-message-exposure.mdc ← 错误消息友好化
│   ├── verify-done.mdc           ← 标记完成前核实代码
│   └── CodeGraph.mdc             ← MCP 工具选择指南
├── skills/
│   ├── skillopt-sleep/           ← 离线进化分析
│   ├── impeccable/               ← 设计质量审计
│   └── sync-docs/                ← 项目文档自动对齐
CLAUDE.md                         ← 追加自我进化章节
```

### 按技术栈自动安装

| 检测条件 | 额外安装的规则 |
|---------|--------------|
| 有 `Cargo.toml` 或 `src-tauri/` | `db-path.mdc` · `rust-type-safety.mdc` · `app-error-pattern.mdc` · `invoke-safe-pattern.mdc` · `Tauri.mdc` |
| 有 `svelte` 依赖 | `Svelte_5.mdc` · `Svelte_Flow.mdc` |
| 有 `tailwindcss` 依赖 | `Tailwind_CSS_v4.mdc` |

## 使用

### 每日自动生效

self-evolve rule 在每个对话中 always 激活：
- **改代码前** → Ponytail 检查 + CodeGraph 影响评估 + 核心边界审计
- **改代码后** → 自动 `npm run build` + `cargo check` 验证 + Impeccable 设计审计
- **验证失败** → 分析修复 → 记录到记忆 → ≥2 次同模式 → 自动写规则
- **会话结束** → 超 7 天未审计 → 提醒

### 按需检查

在 CodeBuddy 对话中输入以下内容触发：

```text
skillopt-sleep dry-run    → 每日健康检查，5 秒出报告
skillopt-sleep run        → 周改进提案
skillopt-sleep adopt      → 采纳建议
impeccable audit           → 设计质量技术审计
impeccable critique        → 设计评审
impeccable polish          → 页面润色
sync-docs                  → 项目文档对齐
```

### 设计上下文

在 CodeBuddy 对话中输入 `impeccable init` 生成 `PRODUCT.md` 和 `DESIGN.md`，让后续审计更精准。

## 前提

- CodeBuddy IDE（VSCode 系）
- 项目根目录下有 `.codebuddy/` 目录（自动创建）
- 需要 CodeGraph MCP 服务器支持（可选，但推荐）

## 文件结构

```
self-evolve-framework/
├── package.json          # npm 包配置
├── bin/cli.js            # CLI 安装工具（含技术栈检测）
├── template/
│   ├── rules/
│   │   ├── always/              ← 通用规则（7 个）
│   │   ├── rust/                ← Rust/Tauri 规则（5 个）
│   │   ├── svelte/              ← Svelte 规则（2 个）
│   │   └── tailwind/            ← Tailwind 规则（1 个）
│   └── skills/
│       ├── skillopt-sleep/      ← 离线进化引擎
│       ├── impeccable/          ← 设计质量审计（含脚本）
│       └── sync-docs/           ← 文档自动对齐
├── AGENTS.md             # AI 代理指南
├── CLAUDE.md             # AI 项目约束
├── LICENSE
└── README.md
```
