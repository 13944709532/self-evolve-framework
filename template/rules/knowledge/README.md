# 知识库（Knowledge Base）

> 经验知识库按**语言 / 框架 / 组件库**分目录组织，源自长期项目（Tauri 2 + Vue 3 + ant-design-vue + Svelte 5 + shadcn-svelte + Rust 桌面应用等）的踩坑沉淀。
> 由 `self-evolve.mdc` 编排层统一调度，是「post-edit 验证 → 错误记忆 → 规则推荐」飞轮的经验支撑层。

## 目录结构

```
knowledge/
├── README.md          ← 本文件：索引 + 维护约定
├── general.mdc        ← 跨语言通用约束（always 激活）
├── typescript.mdc     ← TS/JS 前端语言层（按需加载）
├── vue.mdc            ← Vue 框架层（按需加载）
├── ant-design-vue.mdc ← ant-design-vue 组件库层（按需加载）
├── svelte.mdc         ← Svelte 5 框架层（按需加载）
├── tailwind.mdc       ← Tailwind CSS v4 框架层（按需加载）
├── shadcn-svelte.mdc  ← shadcn-svelte 组件库层（按需加载）
├── rust.mdc           ← Rust 后端层（按需加载）
└── tauri.mdc          ← Tauri 框架层（按需加载）
```

## 加载策略

| 文件 | 激活方式 | 原因 |
|------|----------|------|
| `general.mdc` | `alwaysApply: true` | 跨项目通用，任何代码改动都适用 |
| 语言/框架专项 | `alwaysApply: false` | 仅在涉及对应语言/框架代码时由 description 语义检索加载，避免一次性注入全部 context 导致膨胀 |

## 编号体系

全库统一编号，跨文件引用不冲突：

- **F1–F13**：强制规则（违反即返工）
- **P1–P15**：多发问题处理模式（同类 bug 反复出现，按模式处理）

新增规则时延续当前最大编号；若某类问题膨胀（如 Rust 专项超过 ~8 条），可在对应专项文件内用 `F-rust-1` / `P-rust-1` 子编号，保持主线编号稳定。

## 归属判断（新增知识放哪）

1. 跨语言/跨框架通用（命名总原则、错误友好、文档漂移、DB 通用坑）→ `general.mdc`
2. 仅 TS/JS 语言层（strict、类型命名、import 安装）→ `typescript.mdc`
3. 仅 Vue 框架（v-model、响应式、弹窗、组件命名）→ `vue.mdc`
4. 仅 Svelte 5 框架（runes、Props、插槽、节点参数同步、画布交互）→ `svelte.mdc`
5. 仅 Tailwind CSS（v4 语法、魔法值、尺寸 Token、@layer）→ `tailwind.mdc`
6. 仅 shadcn-svelte（组件引入、API、尺寸/Portal/下拉防误触、重复弹窗抽壳）→ `shadcn-svelte.mdc`
7. 仅 Rust 语言层（ownership、DB 读取、XLSX、命令注册、AppError）→ `rust.mdc`
8. 仅 Tauri 框架（IPC 通信、WebView2 特性、配置、Dialog API、AppError 前端侧）→ `tauri.mdc`
9. 仅 ant-design-vue（组件引入、ConfigProvider token、优先用组件替代原生、a-table 分页、骨架屏、CSS-in-JS 特异性）→ `ant-design-vue.mdc`

> 一条知识涉及多层时，放在"最通用且最不易过期"的那一层，其余层用一句话引用。

## 与进化飞轮的衔接

- 命中任意强制规则 / 多发模式 → 把「命中 + 处理方式」写入记忆（`update_memory`）。
- 同类问题（P 系列任一类）累计 **≥2 次** 仍无专门规则 → 在 `.codebuddy/rules/` 下新建 `{pattern}.mdc` 固化，并回流到本知识库保持单一真源。
- 调整任何强制规则 → 同步回流本知识库，避免规则散落多处导致漂移。
