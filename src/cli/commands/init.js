import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from "fs"
import { join, resolve, basename } from "path"
import { fileURLToPath } from "url"
import { copyRulesFlat } from "../utils.js"
import { doUpgrade } from "./upgrade.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const PKG_ROOT = resolve(__dirname, "../../..")

export async function init(args, isSync = false) {
  const baseDir = resolve(args["--project"] || process.cwd())
  const dryRun = !!args["--dry-run"]
  const skipClaudeMd = !!args["--skip-claude-md"]
  const skipImpeccable = !!args["--skip-impeccable"]

  if (isSync) {
    console.log(`从 ${PKG_ROOT} 同步配置到 ${baseDir}`)
  }
  console.log(`📍 项目路径: ${baseDir}`)
  console.log(`🧪 ${dryRun ? "DRY RUN — 不写入文件" : "执行中..."}\n`)

  const rulesExist = existsSync(resolve(baseDir, ".codebuddy/rules"))
  let count = 0

  // 规则安装：已有 → 升级模式，无 → 首次安装
  if (rulesExist) {
    console.log("🔄 检测到已有安装，进入升级模式...\n")
    const { added, skipped } = await doUpgrade(baseDir, dryRun)
    console.log(`  ${dryRun ? "🔍 将执行" : "✅ 执行"}  升级安装（${added} 个规则）`)
    if (skipped > 0) console.log(`  ⚠️  ${skipped} 个文件已保留用户修改`)
    count = added > 0 || skipped > 0 ? 1 : 0
  } else {
    const rulesSrc = resolve(PKG_ROOT, "rules")
    const rulesFiles = copyRulesFlat(rulesSrc, resolve(baseDir, ".codebuddy/rules"), dryRun)
    console.log(`  ${dryRun ? "🔍 将复制" : "✅ 复制"}  rules/  →  .codebuddy/rules/（${rulesFiles.length} 个规则）`)
    count++
  }

  // 复制 skills
  const skillsSrc = resolve(PKG_ROOT, "skills")
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
