#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from "fs"
import { join, resolve, basename } from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const TEMPLATE_DIR = resolve(__dirname, "../template")

const COMMANDS = {
  init: {
    desc: "一键安装全部 CodeBuddy skill + 规则到当前项目",
    run: async (args) => init(args),
  },
  sync: {
    desc: "从框架项目同步最新的 skill + 规则到当前项目",
    run: async (args) => sync(args),
  },
  list: {
    desc: "列出模板中包含的所有 skill 和规则",
    run: () => listSkills(),
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
    npx self-evolve-framework init       一键安装全部 skill + 规则
    npx self-evolve-framework list       列出模板中包含的所有 skill
    npx self-evolve-framework sync       从框架同步最新版本

  选项:
    --project <path>      指定目标项目路径（默认当前目录）
    --skip-claude-md      跳过更新 CLAUDE.md
    --skip-impeccable     跳过 Impeccable 设计质量 skill
    --dry-run             预览要复制的文件，不实际写入

  示例:
    npx self-evolve-framework init
    npx self-evolve-framework init --project ./my-app
    npx self-evolve-framework init --skip-claude-md --dry-run

  智能安装:
    CLI 自动检测目标项目技术栈，选择性安装对应规则：
    - 始终安装：通用规则（7 个）
    - 检测到 Cargo.toml / src-tauri/ → 安装 Rust/Tauri 规则（5 个）
    - 检测到 svelte → 安装 Svelte 规则（2 个）
    - 检测到 tailwindcss → 安装 Tailwind 规则（1 个）
  `)
}

/** 检测目标项目使用的技术栈 */
function detectTechStack(projectDir) {
  const deps = getProjectDeps(projectDir)

  return {
    rust: existsSync(resolve(projectDir, "Cargo.toml"))
       || existsSync(resolve(projectDir, "src-tauri")),
    svelte: !!deps["svelte"] || !!deps["@sveltejs/kit"]
         || existsSync(resolve(projectDir, "svelte.config.js")),
    tailwind: !!deps["tailwindcss"]
           || existsSync(resolve(projectDir, "tailwind.config.js"))
           || existsSync(resolve(projectDir, "tailwind.config.ts")),
  }
}

function getProjectDeps(projectDir) {
  const pkgPath = resolve(projectDir, "package.json")
  if (!existsSync(pkgPath)) return {}
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    return { ...pkg.dependencies, ...pkg.devDependencies }
  } catch {
    return {}
  }
}

/** 递归复制目录中的 .mdc 文件到目标（扁平复制，不保持子目录结构） */
function copyRulesFlat(srcDir, destDir, dryRun) {
  const copied = []
  if (!existsSync(srcDir)) return copied

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry)
      if (statSync(fullPath).isDirectory()) {
        walk(fullPath)
      } else if (entry.endsWith(".mdc")) {
        if (!dryRun) {
          mkdirSync(destDir, { recursive: true })
          cpSync(fullPath, join(destDir, entry), { force: true })
        }
        copied.push(entry)
      }
    }
  }
  walk(srcDir)
  return copied
}

function listSkills() {
  const skillsDir = resolve(TEMPLATE_DIR, "skills")

  console.log("\n📦 模板中包含的规则：")
  listRulesDir(resolve(TEMPLATE_DIR, "rules", "always"), "  通用（始终安装）")
  listRulesDir(resolve(TEMPLATE_DIR, "rules", "rust"), "  Rust / Tauri（检测到 Rust 时安装）")
  listRulesDir(resolve(TEMPLATE_DIR, "rules", "svelte"), "  Svelte（检测到 Svelte 时安装）")
  listRulesDir(resolve(TEMPLATE_DIR, "rules", "tailwind"), "  Tailwind CSS（检测到时安装）")

  console.log("\n🧠 模板中包含的技能：")
  if (existsSync(skillsDir)) {
    for (const d of readdirSync(skillsDir).filter(f => statSync(join(skillsDir, f)).isDirectory()).sort()) {
      const skillMd = join(skillsDir, d, "SKILL.md")
      let desc = ""
      if (existsSync(skillMd)) {
        const firstLine = readFileSync(skillMd, "utf-8").split("\n").find(l => l.startsWith("description:"))
        if (firstLine) desc = firstLine.replace("description: ", "").trim()
      }
      console.log(`  ${d}/  ${desc ? "— " + desc : ""}`)
    }
  }
}

function listRulesDir(dir, label) {
  if (!existsSync(dir)) return
  const files = []
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry.endsWith(".mdc")) {
        files.push(entry)
      }
    }
  }
  walk(dir)
  if (files.length > 0) {
    console.log(`${label}  (${files.length} 个)`)
    for (const f of files.sort()) console.log(`    - ${f}`)
  }
}

async function init(args) {
  const baseDir = resolve(args["--project"] || process.cwd())
  const dryRun = !!args["--dry-run"]
  const skipClaudeMd = !!args["--skip-claude-md"]
  const skipImpeccable = !!args["--skip-impeccable"]

  console.log(`📍 项目路径: ${baseDir}`)
  console.log(`🧪 ${dryRun ? "DRY RUN — 不写入文件" : "执行中..."}\n`)

  // 检测技术栈
  const tech = detectTechStack(baseDir)
  console.log("🔍 技术栈检测：")
  console.log(`  Rust/Tauri: ${tech.rust ? "✅" : "❌"}`)
  console.log(`  Svelte:     ${tech.svelte ? "✅" : "❌"}`)
  console.log(`  Tailwind:   ${tech.tailwind ? "✅" : "❌"}\n`)

  const destRulesDir = resolve(baseDir, ".codebuddy/rules")
  let totalRules = 0

  // 复制 always 规则（始终安装）
  const alwaysSrc = resolve(TEMPLATE_DIR, "rules", "always")
  const alwaysFiles = copyRulesFlat(alwaysSrc, destRulesDir, dryRun)
  const alwaysPreview = dryRun ? "🔍 将复制" : "✅ 复制"
  console.log(`  ${alwaysPreview}  rules/always/  →  .codebuddy/rules/（${alwaysFiles.length} 个通用规则）`)
  totalRules += alwaysFiles.length

  // 复制 Rust 规则（按需）
  if (tech.rust) {
    const rustSrc = resolve(TEMPLATE_DIR, "rules", "rust")
    const rustFiles = copyRulesFlat(rustSrc, destRulesDir, dryRun)
    console.log(`  ${dryRun ? "🔍 将复制" : "✅ 复制"}  rules/rust/    →  .codebuddy/rules/（${rustFiles.length} 个 Rust/Tauri 规则）`)
    totalRules += rustFiles.length
  } else {
    console.log("  ⏭️  跳过  rules/rust/（未检测到 Rust 项目）")
  }

  // 复制 Svelte 规则（按需）
  if (tech.svelte) {
    const svelteSrc = resolve(TEMPLATE_DIR, "rules", "svelte")
    const svelteFiles = copyRulesFlat(svelteSrc, destRulesDir, dryRun)
    console.log(`  ${dryRun ? "🔍 将复制" : "✅ 复制"}  rules/svelte/  →  .codebuddy/rules/（${svelteFiles.length} 个 Svelte 规则）`)
    totalRules += svelteFiles.length
  } else {
    console.log("  ⏭️  跳过  rules/svelte/（未检测到 Svelte）")
  }

  // 复制 Tailwind 规则（按需）
  if (tech.tailwind) {
    const tailwindSrc = resolve(TEMPLATE_DIR, "rules", "tailwind")
    const tailwindFiles = copyRulesFlat(tailwindSrc, destRulesDir, dryRun)
    console.log(`  ${dryRun ? "🔍 将复制" : "✅ 复制"}  rules/tailwind/ →  .codebuddy/rules/（${tailwindFiles.length} 个 Tailwind 规则）`)
    totalRules += tailwindFiles.length
  } else {
    console.log("  ⏭️  跳过  rules/tailwind/（未检测到 Tailwind CSS）")
  }

  let count = totalRules > 0 ? 1 : 0

  // 复制 skills（排除 impeccable 如果 --skip-impeccable）
  const skillsSrc = resolve(TEMPLATE_DIR, "skills")
  if (existsSync(skillsSrc)) {
    const skillDirs = readdirSync(skillsSrc).filter(f =>
      statSync(join(skillsSrc, f)).isDirectory() &&
      !(skipImpeccable && f === "impeccable")
    )
    const skillsDest = resolve(baseDir, ".codebuddy/skills")
    if (!dryRun) {
      mkdirSync(skillsDest, { recursive: true })
      for (const dir of skillDirs) {
        cpSync(join(skillsSrc, dir), join(skillsDest, dir), { recursive: true, force: true })
      }
    }
    console.log(`  ${dryRun ? "🔍 将复制" : "✅ 复制"}  skills/  →  .codebuddy/skills/（${skillDirs.length} 个技能）`)
    count++
  }

  // 更新 CLAUDE.md
  if (!skipClaudeMd) {
    const claudePath = resolve(baseDir, "CLAUDE.md")
    const selfEvolveSection = `
## 自我进化（always 激活）

统一由 \`.codebuddy/rules/self-evolve.mdc\` 编排。
调度 Ponytail（代码最小化）+ CodeGraph（依赖分析）+ Skillopt-Sleep（离线进化）+ Impeccable（设计质量）
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
        writeFileSync(claudePath, `# ${basename(resolve(baseDir))} 项目约束\n${selfEvolveSection}\n`)
      }
      console.log(`${dryRun ? "  🔍 将创建" : "  ✅ 创建"}  CLAUDE.md（含自我进化章节）`)
      count++
    }
  }

  console.log(`\n${dryRun ? `🔍 预览完成，共 ${count} 项操作` : `✅ 已完成 ${count} 项操作 — 下次对话即可生效`}`)
  if (!dryRun && count > 0) {
    console.log("\n📖 使用指南（在 CodeBuddy 对话中输入）：")
    console.log("  skillopt-sleep dry-run  → 每日健康检查")
    console.log("  skillopt-sleep run      → 周改进提案")
    console.log("  impeccable audit/critique  → 设计质量审查")
    console.log("  sync-docs               → 项目文档对齐")
    console.log("  npx self-evolve-framework list  → 查看所有可用 skill")
  }
}

async function sync(args) {
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
Promise.resolve(result).catch((err) => {
  console.error("❌ 错误:", err.message)
  process.exit(1)
})
