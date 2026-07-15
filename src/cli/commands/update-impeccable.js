import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, renameSync, cpSync } from "fs"
import { join, resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { tmpdir } from "os"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const PKG_ROOT = resolve(__dirname, "../../..")

const UPSTREAM_REPO = "pbakaus/impeccable"
const SKILL_PREFIX = ".agents/skills/impeccable/" // 上游仓库中 skill 根路径（通用 harness 变体）
const LOCAL_SKILL_DIR = resolve(PKG_ROOT, "skills/impeccable")
const UA = { "User-Agent": "self-evolve-framework" }

/** 从 frontmatter 解析 version: x.y.z */
function parseVersion(text) {
  const m = text && text.match(/version:\s*([0-9]+\.[0-9]+\.[0-9]+)/)
  return m ? m[1] : null
}

/** 读取框架内 bundled impeccable 的本地版本 */
export function getLocalVersion() {
  const p = join(LOCAL_SKILL_DIR, "SKILL.md")
  if (!existsSync(p)) return null
  try {
    return parseVersion(readFileSync(p, "utf-8"))
  } catch {
    return null
  }
}

/** 语义化版本比较：a>b 返回 >0，a<b 返回 <0，相等返回 0 */
export function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number)
  const pb = String(b).split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d
  }
  return 0
}

/** 带手动超时的 fetch（避免 AbortSignal.timeout 在部分 Node 版本上的提前中止问题） */
async function fetchWithTimeout(url, opts, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson(url) {
  const res = await fetchWithTimeout(url, { headers: UA }, 20000)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchText(url) {
  const res = await fetchWithTimeout(url, { headers: UA }, 20000)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/** 取上游最新 release 的 tag 与 skill 版本号 */
async function getUpstreamInfo() {
  const rel = await fetchJson(`https://api.github.com/repos/${UPSTREAM_REPO}/releases/latest`)
  const tag = rel.tag_name
  // 优先从 tag 解析版本（skill-v3.9.1 → 3.9.1），避免额外网络请求
  const fromTag = tag.replace(/^skill-v/i, "").match(/^[0-9]+\.[0-9]+\.[0-9]+$/)
  const upstreamVersion = fromTag ? fromTag[0] : null
  return { tag, upstreamVersion }
}

/** 取上游 skill 目录下全部 blob 路径 */
async function getSkillPaths(tag) {
  const tree = await fetchJson(
    `https://api.github.com/repos/${UPSTREAM_REPO}/git/trees/${tag}?recursive=1`
  )
  return tree.tree
    .filter((t) => t.type === "blob" && t.path.startsWith(SKILL_PREFIX))
    .map((t) => t.path)
}

/** 将所有 skill 文件下载到临时目录，返回目录、成功文件相对路径列表与失败数 */
async function downloadToTemp(tag, paths) {
  const dest = join(tmpdir(), `self-evolve-impeccable-${Date.now()}`)
  mkdirSync(dest, { recursive: true })
  const okRels = []
  let failed = 0
  for (const p of paths) {
    const rel = p.slice(SKILL_PREFIX.length)
    let buf = null
    for (let attempt = 1; attempt <= 3 && buf === null; attempt++) {
      try {
        const res = await fetchWithTimeout(
          `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${tag}/${p}`,
          { headers: UA },
          30000
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        buf = Buffer.from(await res.arrayBuffer())
      } catch (e) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 800 * attempt))
          continue
        }
        console.warn(`  ⚠️  跳过 ${rel} (${e.message})`)
        failed++
      }
    }
    if (buf === null) continue
    const out = join(dest, rel)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, buf)
    okRels.push(rel)
  }
  return { dest, okRels, failed }
}

/**
 * 检查并同步上游 impeccable 到框架 bundled 目录。
 * @param {{ dryRun?: boolean, force?: boolean }} opts
 * @returns {{ local: string|null, upstream: string|null, updated: boolean, fileCount?: number }}
 */
export async function updateImpeccable({ dryRun = false, force = false } = {}) {
  const local = getLocalVersion()
  console.log(`📦 本地 impeccable 版本: ${local || "未知"}`)

  let info
  try {
    info = await getUpstreamInfo()
  } catch (e) {
    console.warn(`⚠️  无法连接上游 impeccable（${e.message}），跳过更新。`)
    return { local, upstream: null, updated: false }
  }
  console.log(`🌐 上游 impeccable 版本: ${info.upstreamVersion} (${info.tag})`)

  const cmp = !local || !info.upstreamVersion ? 1 : compareVersions(info.upstreamVersion, local)
  if (!force && cmp <= 0) {
    if (cmp === 0) console.log("✅ 已是最新版本，无需更新。")
    else console.log("✅ 本地版本不低于上游，无需更新。")
    return { local, upstream: info.upstreamVersion, updated: false }
  }

  console.log(`${dryRun ? "🔍 预览" : "🔄 同步"} impeccable → ${info.upstreamVersion} ...`)
  const paths = await getSkillPaths(info.tag)
  const { dest, okRels, failed } = await downloadToTemp(info.tag, paths)

  if (okRels.length === 0) {
    rmSync(dest, { recursive: true, force: true })
    console.warn("⚠️  未下载到任何文件，取消更新。")
    return { local, upstream: info.upstreamVersion, updated: false }
  }

  // 关键文件缺失（如 SKILL.md）则放弃替换，保留原目录
  if (!okRels.includes("SKILL.md")) {
    rmSync(dest, { recursive: true, force: true })
    console.warn("⚠️  关键文件 SKILL.md 下载失败，取消更新（保留原目录）。")
    return { local, upstream: info.upstreamVersion, updated: false }
  }

  if (dryRun) {
    rmSync(dest, { recursive: true, force: true })
    console.log(
      `🔍 预览完成：将更新 ${okRels.length} 个文件${failed ? `，${failed} 个失败` : ""}（未写入）。`
    )
    return { local, upstream: info.upstreamVersion, updated: false, fileCount: okRels.length }
  }

  // 原子替换：先清空本地目录，再移入临时目录（跨设备回退到拷贝）
  rmSync(LOCAL_SKILL_DIR, { recursive: true, force: true })
  try {
    renameSync(dest, LOCAL_SKILL_DIR)
  } catch {
    cpSync(dest, LOCAL_SKILL_DIR, { recursive: true })
    rmSync(dest, { recursive: true, force: true })
  }
  console.log(
    `✅ 已更新 impeccable → ${info.upstreamVersion}（${okRels.length} 个文件${failed ? `，${failed} 个失败` : ""}）`
  )
  return { local, upstream: info.upstreamVersion, updated: true, fileCount: okRels.length }
}
