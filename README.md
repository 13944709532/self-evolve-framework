# Self-Evolve Framework

> **CodeBuddy IDE** 自我进化飞轮 — Post-Edit 验证闭环 + 规则自动推荐 + 离线进化分析
>
> ⚠️ 此包专为 [CodeBuddy](https://www.codebuddy.ai) 设计，依赖 `.codebuddy/rules/` 和 `.codebuddy/skills/` 目录结构，非 CodeBuddy 环境无效。

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
```

## 安装了什么

```
.codebuddy/
├── rules/
│   ├── self-evolve.mdc    ← 编排层（always 激活）
│   └── ponytail.mdc       ← 代码最小化原则
├── skills/
│   └── skillopt-sleep/
│       └── SKILL.md       ← 离线进化分析
CLAUDE.md                  ← 追加自我进化章节
```

## 使用

### 每日自动生效

self-evolve rule 在每个对话中 always 激活：
- **改代码前** → Ponytail 检查 + CodeGraph 影响评估
- **改代码后** → 自动 `npm run build` + `cargo check` 验证
- **验证失败** → 分析修复 → 记录到记忆 → ≥2 次同模式 → 自动写规则
- **会话结束** → 超 7 天未审计 → 提醒

### 按需检查

在 CodeBuddy 对话中输入以下内容触发：

```text
skillopt-sleep dry-run    → 每日健康检查，5 秒出报告
skillopt-sleep run        → 周改进提案
skillopt-sleep adopt      → 采纳建议
```

## 前提

- CodeBuddy IDE（VSCode 系）
- 项目根目录下有 `.codebuddy/` 目录（自动创建）
- 需要 CodeGraph MCP 服务器支持（可选，但推荐）

## 文件结构

```
self-evolve-framework/
├── package.json          # npm 包配置
├── bin/cli.js            # CLI 安装工具
├── template/
│   ├── rules/
│   │   ├── self-evolve.mdc
│   │   └── ponytail.mdc
│   └── skills/
│       └── skillopt-sleep/
│           └── SKILL.md
└── README.md
```
