import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from "fs"
import { join, resolve, basename } from "path"

/** 递归复制目录中的 .mdc 文件到目标（扁平复制，不保持子目录结构） */
export function copyRulesFlat(srcDir, destDir, dryRun) {
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

/** 收集目录中所有 .mdc 文件名（扁平，不保持路径） */
export function collectRuleFiles(dir) {
  const files = []
  if (!existsSync(dir)) return files

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
  return files
}

/** 在源目录中通过扁平文件名找到完整路径 */
export function findSourceFile(baseDir, flatName) {
  const found = []
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry === flatName) {
        found.push(full)
      }
    }
  }
  walk(baseDir)
  return found[0] || join(baseDir, flatName)
}

export function showHelp() {
  console.log(`
  self-evolve — CodeBuddy 自我进化飞轮安装工具

  用法:
    self-evolve init       一键安装全部 skill + 规则
    self-evolve sync       从框架同步最新版本
    self-evolve list       列出包含的 skill 和规则
    self-evolve help       显示帮助信息

  选项:
    --project <path>      指定目标项目路径（默认当前目录）
    --skip-claude-md      跳过更新 CLAUDE.md
    --skip-impeccable     跳过 Impeccable 设计质量 skill
    --dry-run             预览要复制的文件，不实际写入

  示例:
    self-evolve init
    self-evolve init --project ./my-app
    self-evolve init --skip-claude-md --dry-run
  `)
}
