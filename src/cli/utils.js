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

export function showHelp(cmd) {
  if (cmd === "auth") {
    console.log(`
  self-evolve auth — 一键 GitHub 认证

  浏览器自动弹出 → 点击授权 → token 自动保存到 ~/.self-evolve-token

  之后 self-evolve 检测到你的规则修改会：
    • 保留你修改的版本（不覆盖）
    • 自动将你的修改提交为 GitHub issue（标签 user-contribution）
    • 框架维护者审阅后可能合入正式版本

  手动方式:
    set GITHUB_TOKEN=github_pat_xxxx && self-evolve
    令牌创建: GitHub Settings → Fine-grained tokens → Issues R&W
  `)} else if (cmd === "list") {
    console.log(`
  self-evolve list — 列出包内所有规则和技能

  输出:
    📦 规则清单（含 knowledge/ 经验知识库下的按语言/框架分层文件）
    🧠 技能清单（含每个 Skill 的描述摘要）

  嵌套目录（如 knowledge/）中的 .mdc 文件扁平展示
  `)} else if (cmd === "sync") {
    console.log(`
  self-evolve sync — 强制从框架同步最新版本

  等同于 self-evolve（默认就是安装/升级），额外打印来源路径
  `)} else {
    console.log(`
  self-evolve — CodeBuddy 自我进化飞轮安装工具

  用法:
    self-evolve            一键安装/升级规则 + 技能（默认）
    self-evolve auth       一键 GitHub 认证 ← 先用这个
    self-evolve sync       强制同步最新版本
    self-evolve list       列出规则/技能清单
    self-evolve help [cmd] 查看某命令的详细说明

  安装做了什么:
    rules/ (11 个 .mdc)  → .codebuddy/rules/  （扁平化 knowledge/ 子目录）
    skills/ (3 个)       → .codebuddy/skills/
    + 在 CLAUDE.md 中追加自我进化章节

  升级模式（检测到已有安装时）:
    • 源文件覆盖 → 同名、内容未变
    • 用户修改保留 → 内容不同，跳过覆盖
    • 孤儿清理     → 旧文件已重命名/合并，自动删除
    • 贡献提交     → 检测到 ≥2 行修改，自动提 GitHub issue

  选项:
    --project <path>      指定目标项目路径（默认当前目录）
    --skip-claude-md      跳过更新 CLAUDE.md
    --skip-impeccable     跳过 Impeccable 设计质量 skill
    --dry-run             预览操作，不实际写入

  示例:
    self-evolve                              # 默认安装
    self-evolve --project ./my-app --dry-run # 预览
    self-evolve auth && self-evolve          # 认证后安装
  `)}
}
