import { readFileSync, existsSync, unlinkSync } from "fs"
import { join, resolve } from "path"
import { fileURLToPath } from "url"
import { collectRuleFiles, copyRulesFlat, findSourceFile } from "../utils.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const PKG_ROOT = resolve(__dirname, "../../..")

// 最小差异行数阈值（低于此值不报 contribution）
const MIN_DIFF_LINES = 2

// GitHub Issue 去重缓存（文件名 + diff hash）
const _issued = new Set()

/** 读 rules/renames.json 映射表 */
function loadRenames() {
  const path = resolve(PKG_ROOT, "rules", "renames.json")
  try { return JSON.parse(readFileSync(path, "utf-8")) }
  catch { return {} }
}

/** 简单 hash 用于 issue 去重 */
function _hash(content) {
  let h = 0
  for (let i = 0; i < content.length; i++) {
    h = ((h << 5) - h + content.charCodeAt(i)) | 0
  }
  return h.toString(16)
}

/** 对比旧 vs 新内容，返回差异行数和 diff 文本 */
function _diff(oldContent, newContent) {
  const oldLines = oldContent.split("\n")
  const newLines = newContent.split("\n")
  const added = [], removed = []
  for (const l of newLines) {
    if (!oldLines.includes(l)) added.push(`+ ${l}`)
  }
  for (const l of oldLines) {
    if (!newLines.includes(l)) removed.push(`- ${l}`)
  }
  return {
    count: added.length + removed.length,
    text: [...removed, ...added].join("\n"),
  }
}

/** 向 GitHub 创建 contribution issue */
async function _createIssue(title, body) {
  const token = process.env["SELF_EVOLVE_TOKEN"] || process.env["GITHUB_TOKEN"]
  if (!token) return false

  const label = "user-contribution"
  try {
    // 获取或创建 label
    const labelsRes = await fetch(
      "https://api.github.com/repos/13944709532/self-evolve-framework/labels",
      { headers: { Authorization: `token ${token}`, "User-Agent": "self-evolve" } }
    )
    const labels = await labelsRes.json()
    if (!labels.find(l => l.name === label)) {
      await fetch(
        "https://api.github.com/repos/13944709532/self-evolve-framework/labels",
        {
          method: "POST",
          headers: { Authorization: `token ${token}`, "User-Agent": "self-evolve", "Content-Type": "application/json" },
          body: JSON.stringify({ name: label, color: "c5def5", description: "User modification submitted via self-evolve upgrade" }),
        }
      )
    }

    const res = await fetch(
      "https://api.github.com/repos/13944709532/self-evolve-framework/issues",
      {
        method: "POST",
        headers: { Authorization: `token ${token}`, "User-Agent": "self-evolve", "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels: [label] }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}

/**
 * 升级安装 — 双向同步：清理孤儿文件、检测用户修改、提交贡献 issue
 * @returns {{ added: number, skipped: number, contributed: number }}
 */
export async function doUpgrade(targetDir, dryRun = false) {
  const rulesDir = resolve(targetDir, ".codebuddy", "rules")
  const sourceDir = resolve(PKG_ROOT, "rules")
  const renames = loadRenames()

  const sourceFiles = new Set(collectRuleFiles(sourceDir))
  const targetFiles = collectRuleFiles(rulesDir)

  let skipped = 0
  let contributed = 0
  const toRemove = []
  const toAdd = []
  const contributions = []

  // 1. 扫描目标目录 — 找孤儿文件和用户修改
  for (const tFile of targetFiles) {
    const tPath = join(rulesDir, tFile)

    // 孤儿文件：目标中存在，源中无同名
    if (!sourceFiles.has(tFile)) {
      const tContent = readFileSync(tPath, "utf-8")
      const renameTo = renames[tFile]

      if (renameTo !== undefined) {
        // 有重命名映射
        if (renameTo === null) {
          // 已合并到知识库 — 检查内容是否被用户修改
          const contrib = _diff(tContent, "")
          if (contrib.count >= MIN_DIFF_LINES) {
            contributions.push({ title: `[merged] ${tFile} — 用户修改`, body: `**文件**: ${tFile}\n**状态**: 已在知识库中合并（当前源中不再独立存在）\n\n\`\`\`diff\n${contrib.text}\n\`\`\`` })
          }
        } else {
          // 改名了 — 对比新旧
          const newPath = join(sourceDir, renameTo)
          let newContent = ""
          if (existsSync(newPath)) {
            newContent = readFileSync(newPath, "utf-8")
          }
          const contrib = _diff(tContent, newContent)
          if (contrib.count >= MIN_DIFF_LINES) {
            const dedupKey = `${tFile}->${renameTo}:${_hash(contrib.text)}`
            if (!_issued.has(dedupKey)) {
              _issued.add(dedupKey)
              contributions.push({ title: `[renamed] ${tFile}→${renameTo} — 用户修改`, body: `**文件**: ${tFile} → ${renameTo}\n\n\`\`\`diff\n${contrib.text}\n\`\`\`` })
            }
          }
        }
      } else {
        // 用户自增的 mdc 文件 — 报告
        contributions.push({ title: `[new-file] ${tFile} — 用户新增`, body: `**文件**: ${tFile}\n\n\`\`\`\n${tContent.slice(0, 2000)}\n\`\`\`` })
      }

      toRemove.push(tFile)
      continue
    }

    // 源中同名 — 对比内容（需要通过 findSourceFile 定位子目录中的文件）
    const sPath = findSourceFile(sourceDir, tFile)
    const sContent = readFileSync(sPath, "utf-8")
    const tContent = readFileSync(tPath, "utf-8")

    if (sContent !== tContent) {
      const contrib = _diff(tContent, sContent)
      if (contrib.count >= MIN_DIFF_LINES) {
        const dedupKey = `${tFile}:${_hash(contrib.text)}`
        if (!_issued.has(dedupKey)) {
          _issued.add(dedupKey)
          contributions.push({ title: `[modified] ${tFile} — 用户修改`, body: `**文件**: ${tFile}\n\n\`\`\`diff\n${contrib.text}\n\`\`\`` })
        }
      }
      skipped++
    } else {
      // 内容相同 — 正常覆盖
      toAdd.push(tFile)
    }
  }

  // 2. 源中新增的文件
  for (const sFile of sourceFiles) {
    if (!targetFiles.includes(sFile)) {
      toAdd.push(sFile)
    }
  }

  // 3. 删除孤儿文件
  for (const f of toRemove) {
    const path = join(rulesDir, f)
    if (!dryRun && existsSync(path)) {
      unlinkSync(path)
    }
  }

  // 4. 复制新增/更新规则
  const added = copyRulesFlat(sourceDir, rulesDir, dryRun)

  // 5. 提交 contribution issues
  if (!dryRun && contributions.length > 0) {
    for (const c of contributions) {
      const ok = await _createIssue(c.title, c.body)
      if (ok) contributed++
    }
  }

  // 打印报告
  console.log(`\n📋 升级报告：`)
  console.log(`   新增/更新规则: ${added.length} 个`)
  if (toRemove.length) console.log(`   清理旧文件: ${toRemove.join(", ")}`)
  if (skipped > 0) console.log(`   ⚠️  用户修改（已保留）: ${skipped} 个`)
  if (contributed > 0) console.log(`   📤 已提交 GitHub issue: ${contributed} 个`)
  if (contributions.length > contributed) {
    console.log(`   ⚠️  ${contributions.length - contributed} 个贡献未提交（需设置 SELF_EVOLVE_TOKEN）`)
  }

  return { added: added.length, skipped, contributed }
}
