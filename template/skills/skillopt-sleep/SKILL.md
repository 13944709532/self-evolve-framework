---
name: skillopt-sleep
description: 离线自我进化引擎。分析历史会话、发现重复模式、优化项目 memory 和规则。用 AI 指令替代外部脚本。
---

# SkillOpt-Sleep — 自我进化引擎

> 此技能是 CodeBuddy 适配版（纯指令模式，不依赖外部脚本）。

## 工作流程（6 阶段）

### 阶段 1：Harvest — 收集信息
AI 从以下来源收集项目数据：
- 项目文件结构、代码模式
- 构建/编译错误记录（从 `.codebuddy/memory/`）
- 已知问题列表
- 现有规则集（`.codebuddy/rules/`）
- 设计上下文（`PRODUCT.md`、`DESIGN.md`，如果存在）
- 前端文件的设计质量报告（如果安装了 Impeccable skill，调用 `impeccable detect` 检查项目前端设计质量）

### 阶段 2：Mine — 挖掘模式
分析收集到的数据，识别：
- **重复错误**：同一类 build/lint 错误出现次数
- **代码异嗅**：循环依赖、过度耦合、重复代码
- **缺失约束**：重复发生但无规则防范的问题
- **优化机会**：可简化的逻辑、可合并的文件
- **★ 核心边界**：识别模块间的契约接口、关键用户路径和其依赖方，标记"改/删前必须审慎"的承重区域
- **★ 设计异嗅**：分析 Impeccable 检测报告中的 P0/P1 反复出现的问题模式，识别设计约束缺失或 DESIGN.md 与实现不一致的区域

### 阶段 3：Replay — 回放验证
对每个发现的问题：
- 如果已有关联规则 → 检查规则是否被遵循
- 如果没有规则 → 评估是否需要新规则
- 如果有修复方案 → 验证方案是否仍适用

### 阶段 4：Consolidate — 合并优化
生成改进建议，只接受通过 Held-out 门控的比例：
- **新增规则**：重复 ≥2 次且无规则防范的问题
- **更新规则**：现有规则描述模糊或过时
- **删除规则**：不再相关或从未被触发的规则
- **优化 memory**：合并重复的错误模式记录
- **★ 边界标记**：涉及核心功能路径的删除/修改建议，加 ⚠️ 标签要求人工确认，不可自动采纳

### 阶段 5：Stage — 暂存
所有建议先写入 `.codebuddy/memory/skillopt-staging/` 目录，**不修改任何活文件**。

### 阶段 6：Adopt — 采用
列出所有建议，由你逐条决定是否采纳：
```
📋 待采用清单
  ✅ 新增 rules/promise-chain-check.mdc → 防止未捕获 async 错误
  ✅ 更新 rules/self-evolve.mdc → 增加 cargo check 验证步骤
  ❌ 删除 rules/old-node-format.mdc → 节点格式已统一
```

## 常用命令（AI 模拟）

```text
skillopt-sleep dry-run   → 执行阶段 1-3，输出分析报告，不写任何文件
skillopt-sleep run       → 执行阶段 1-5，输出暂存清单
skillopt-sleep adopt     → 采纳暂存清单中的建议
```

## 触发建议

- **每日一次**：工作开始时输入 `skillopt-sleep dry-run`，花 30 秒看报告
- **周五总结**：输入 `skillopt-sleep run` 生成周改进提案
- **出现相同错误 2 次后**：不用调，self-evolve rule 会自动触发单条规则创建
