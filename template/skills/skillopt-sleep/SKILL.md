---
name: skillopt-sleep
description: 离线自我进化引擎。分析历史会话、发现重复模式、优化项目 memory 和规则。底层调用 Python 执行引擎（微软 SkillOpt）。
---

# SkillOpt-Sleep — 自我进化引擎

> 执行型 skill：AI 提供指令编排，底层 `python -m skillopt_sleep` 驱动 Harvest → Mine → Replay → Consolidate → Stage → Adopt 六阶段工作流。

## 工作流程

### 前置条件

每次会话首次运行前，确保引擎可用：

```bash
cd .codebuddy/skills/skillopt-sleep/scripts/python
pip install -r requirements.txt 2>/dev/null || echo "依赖已安装"
```

### 阶段 1：Harvest — 收集信息

收集项目数据：
- 项目文件结构、代码模式
- 构建/编译错误记录（从 `.codebuddy/memory/`）
- 已知问题列表
- 现有规则集（`.codebuddy/rules/`）
- 设计上下文（`PRODUCT.md`、`DESIGN.md`，如果存在）
- 前端文件的设计质量报告（如果安装了 Impeccable skill，调用 `impeccable detect` 检查项目前端设计质量）

### 阶段 2：Mine — 挖掘模式

分析数据，识别：
- **重复错误**：同一类 build/lint 错误出现次数
- **代码异嗅**：循环依赖、过度耦合、重复代码
- **缺失约束**：重复发生但无规则防范的问题
- **优化机会**：可简化的逻辑、可合并的文件
- **★ 核心边界**：模块间契约接口、关键用户路径和依赖方
- **★ 设计异嗅**：Impeccable 检测报告中的 P0/P1 反复问题模式

### 阶段 3-6：执行引擎运行

```bash
python -m .codebuddy.skills.skillopt-sleep.scripts.python \
  --project "$(pwd)" \
  --mode <dry-run|run|adopt> \
  --backend claude
```

- `--mode dry-run` → 阶段 1-3，只输出分析报告，不写文件
- `--mode run` → 阶段 1-5，输出暂存清单到 `.codebuddy/memory/skillopt-staging/`
- `--mode adopt` → 阶段 6，采纳暂存清单中的建议

### 手动模式（无 Python 引擎时）

如果 Python 环境不可用，AI 按以下指令模拟执行：

#### Consolidate — 合并优化
生成改进建议，只接受通过 Held-out 门控的比例：
- **新增规则**：重复 ≥2 次且无规则防范的问题
- **更新规则**：现有规则描述模糊或过时
- **删除规则**：不再相关或从未被触发的规则
- **优化 memory**：合并重复的错误模式记录
- **★ 边界标记**：涉及核心功能路径的删除/修改建议，加 ⚠️ 标签

#### Stage — 暂存
所有建议写入 `.codebuddy/memory/skillopt-staging/`，不修改活文件。

#### Adopt — 采用
列出建议由用户逐条决定是否采纳。

## 触发

| 对话输入 | 作用 |
|----------|------|
| `skillopt-sleep dry-run` | 执行阶段 1-3（有引擎则调 Python，无则 AI 模拟） |
| `skillopt-sleep run` | 执行阶段 1-5 |
| `skillopt-sleep adopt` | 采纳建议 |

## 内核

执行引擎来自 [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) — 由微软研究院开源的 skill 文档训练框架。
