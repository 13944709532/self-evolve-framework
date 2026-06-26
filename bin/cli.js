#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "fs"
import { join, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const TEMPLATE_DIR = resolve(__dirname, "../template")

const COMMANDS = {
  init: {
    desc: "安装自我进化飞轮到当前项目",
    run: async (args) => init(args),
  },
  sync: {
    desc: "从源项目同步配置到当前项目",
    run: async (args) => sync(args),
  },
  help: {
    desc: "显示帮助信息",
    run: () => showHelp(),
  },
}

function showHelp() {
  console.log(`
  self-evolve — CodeBuddy 自我进化飞轮安装工具

  用法:
    npx self-evolve-framework init       安装到当前项目
    npx self-evolve-framework sync       从源项目同步

  选项:
    --project <path>      指定目标项目路径（默认当前目录）
    --skip-claude-md      跳过更新 CLAUDE.md
    --dry-run             预览要复制的文件，不实际写入

  示例:
    npx self-evolve-framework init
    npx self-evolve-framework init --project ./my-app
    npx self-evolve-framework init --skip-claude-md --dry-run
  `)
}

async function init(args) {
  const baseDir = resolve(args["--project"] || process.cwd())
  const dryRun = !!args["--dry-run"]
  const skipClaudeMd = !!args["--skip-claude-md"]

  console.log(`📍 项目路径: ${baseDir}`)
  console.log(`🧪 ${dryRun ? "DRY RUN — 不写入文件" : "执行中..."}\n`)

  // 要复制的目录映射：{ 源相对路径 → 目标相对路径 }
  const dirs = [
    { src: "rules",  dest: ".codebuddy/rules" },
    { src: "skills/skillopt-sleep", dest: ".codebuddy/skills/skillopt-sleep" },
  ]

  let count = 0
  for (const { src, dest } of dirs) {
    const srcDir = resolve(TEMPLATE_DIR, src)
    const destDir = resolve(baseDir, dest)
    if (!existsSync(srcDir)) continue
    if (!dryRun) mkdirSync(destDir, { recursive: true })
    console.log(`${dryRun ? "  🔍 将复制" : "  ✅ 复制"}  ${src}/  →  ${dest}/`)
    if (!dryRun) cpSync(srcDir, destDir, { recursive: true, force: true })
    count++
  }

  // 更新 CLAUDE.md
  if (!skipClaudeMd) {
    const claudePath = resolve(baseDir, "CLAUDE.md")
    const selfEvolveSection = `
## 自我进化（always 激活）

统一由 \`.codebuddy/rules/self-evolve.mdc\` 编排。
调度 Ponytail（代码最小化）+ CodeGraph（依赖分析）+ Skillopt-Sleep（离线进化）
→ 形成 **post-edit 验证 → 错误记忆 → 规则推荐** 闭环。
`
    if (existsSync(claudePath)) {
      const content = readFileSync(claudePath, "utf-8")
      if (!content.includes("自我进化")) {
        if (!dryRun) {
          writeFileSync(claudePath, content.trimEnd() + "\n" + selfEvolveSection + "\n")
        }
        console.log(`${dryRun ? "  🔍 将添加" : "  ✅ 添加"}  自我进化章节 → CLAUDE.md`)
        count++
      } else {
        console.log("  ⏭️  跳过  CLAUDE.md 已包含自我进化章节")
      }
    } else {
      if (!dryRun) {
        writeFileSync(claudePath, `# ${resolve(baseDir).split(/[/\\]/).pop()} 项目约束\n${selfEvolveSection}\n`)
      }
      console.log(`${dryRun ? "  🔍 将创建" : "  ✅ 创建"}  CLAUDE.md（含自我进化章节）`)
      count++
    }
  }

  console.log(`\n${dryRun ? `🔍 预览完成，共 ${count} 项操作` : `✅ 已完成 ${count} 项操作 — 下次对话即可生效`}`)
  if (!dryRun) {
    console.log("\n📖 使用指南：")
    console.log("  /skillopt dry-run  → 每日健康检查")
    console.log("  /skillopt run      → 周改进提案")
  }
}

async function sync(args) {
  // 从 self-evolve-framework 项目中读取默认配置
  const baseDir = resolve(args["--project"] || process.cwd())
  const srcDir = resolve(args["--from"] || TEMPLATE_DIR.replace(/template$/, ""))
  console.log(`从 ${srcDir} 同步配置到 ${baseDir}`)
  await init({ ...args, "--project": baseDir })
}

// 入口
const cmd = process.argv[2] || "help"
const fn = COMMANDS[cmd]
if (!fn) {
  console.error(`未知命令: ${cmd}\n`)
  showHelp()
  process.exit(1)
}

// 解析命令行参数
const args = {}
for (let i = 3; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg.startsWith("--")) {
    const next = process.argv[i + 1]
    if (next && !next.startsWith("--")) {
      args[arg] = next
      i++
    } else {
      args[arg] = true
    }
  }
}

const result = fn.run(args)
// 兼容 sync 和 async 的 run 函数
Promise.resolve(result).catch((err) => {
  console.error("❌ 错误:", err.message)
  process.exit(1)
})
